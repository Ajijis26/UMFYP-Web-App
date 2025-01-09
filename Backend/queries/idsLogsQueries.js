const { dynamoDB } = require('../database');
const { sendEmailNotification } = require('../snsService');
const { fetchUserDetails } = require('./userQueries');

// Fetch IDS Logs with optional filtering
async function getIdsLogs(sourceIP, dstIP, protocolType) {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    };

    if (sourceIP || dstIP || protocolType) {
      params.FilterExpression = '';
      params.ExpressionAttributeValues = {};

      if (sourceIP) {
        params.FilterExpression += 'SrcIP = :sourceIP';
        params.ExpressionAttributeValues[':sourceIP'] = sourceIP;
      }

      if (dstIP) {
        params.FilterExpression += (params.FilterExpression ? ' AND ' : '') + 'DstIP = :dstIP';
        params.ExpressionAttributeValues[':dstIP'] = dstIP;
      }

      if (protocolType) {
        params.FilterExpression += (params.FilterExpression ? ' AND ' : '') + 'ProtocolType = :protocolType';
        params.ExpressionAttributeValues[':protocolType'] = protocolType;
      }
    }

    const data = await dynamoDB.scan(params).promise();
    return { status: 200, data: data.Items };
  } catch (err) {
    console.error('Error fetching IDS logs:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

// Fetch IDS Alerts based on Label
async function fetchAlerts() {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      FilterExpression: 'Label <> :normalLabel', // Exclude alerts with Label = "normal"
      ExpressionAttributeValues: { ':normalLabel': 'normal' },
    };

    const data = await dynamoDB.scan(params).promise();

    return {
      status: 200,
      data: data.Items.map(item => ({
        ConnectionID: item.ConnectionID,
        SrcIP: item.SrcIP,
        DstIP: item.DstIP,
        ProtocolType: item.ProtocolType,
        Service: item.Service,
        Status: item.Status,
        Timestamp: item.Timestamp,
        Label: item.Label,
        Owner: item.Owner,
        LastUpdatedBy: item.LastUpdatedBy || "N/A",
        SrcBytes: item.SrcBytes,
        DstBytes: item.DstBytes,
        SerrorRate: item.SerrorRate,
        DiffSrvRate: item.DiffSrvRate,
        SameSrvRate: item.SameSrvRate,
        RerrorRate: item.RerrorRate,
        Flag: item.Flag,
        Land: item.Land,
        Duration: item.Duration,
      })),
    };
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return { status: 500, error: 'Internal server error' };
  }
}


// Update Alert Owner
async function changeAlertOwner(alerts, newOwner) {
  if (!Array.isArray(alerts) || alerts.length === 0) {
    throw new Error("Invalid alerts array provided.");
  }

  try {
    // Fetch the new owner's email
    const newOwnerDetails = await fetchUserDetails(newOwner);
    const newOwnerEmail = newOwnerDetails.data.email;

    for (const alert of alerts) {
      if (!alert.ConnectionID || !alert.Timestamp) {
        throw new Error("Invalid alert structure. Missing ConnectionID or SrcIP.");
      }

      const params = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Key: {
          ConnectionID: alert.ConnectionID, // Partition Key
          Timestamp: alert.Timestamp, // Sort Key
        },
        UpdateExpression: 'SET #owner = :newOwner',
        ExpressionAttributeNames: {
          '#owner': 'Owner', // Alias for the reserved keyword
        },
        ExpressionAttributeValues: {
          ':newOwner': newOwner,
        },
      };

      console.log("Updating alert:", params); // Debug log
      await dynamoDB.update(params).promise();

      // Send an email notification for each alert
      await sendEmailNotification(newOwnerEmail, {
        ConnectionID: alert.ConnectionID,
        Timestamp: alert.Timestamp,
        Label: alert.Label,
        Status: alert.Status,
      });
    }

    return { status: 200, message: 'Alert owner updated successfully' };
  } catch (err) {
    console.error("Error updating alert owner into database:", err);
    return { status: 500, error: 'Internal server error' };
  }
}

// Update Alert Status
async function updateAlertStatus(connectionId, timestamp, status, username) {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: {
        ConnectionID: connectionId, // Partition Key
        Timestamp: timestamp,              // Sort Key
      },
      UpdateExpression: 'SET #status = :status, #lastUpdatedBy = :lastUpdatedBy',
      ExpressionAttributeNames: {
        '#status': 'Status',         // Map 'Status' attribute
        '#lastUpdatedBy': 'LastUpdatedBy', // Map 'LastUpdatedBy' attribute correctly
      },
      ExpressionAttributeValues: {
        ':status': status,           // New status value
        ':lastUpdatedBy': username,  // Current user's username
      },
    };

    await dynamoDB.update(params).promise();
    return { status: 200, message: 'Alert status updated successfully' };
  } catch (err) {
    console.error('Error updating alert status:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

// Helper function to process label statistics
const processLabelStats = (alerts) => {
  const totalAlerts = alerts.length;
  const labelCounts = {};

  // Count alerts by label
  alerts.forEach((alert) => {
    labelCounts[alert.Label] = (labelCounts[alert.Label] || 0) + 1;
  });

  // Calculate percentage
  return Object.keys(labelCounts).map((label) => ({
    name: label,
    count: labelCounts[label],
    percentage: ((labelCounts[label] / totalAlerts) * 100).toFixed(2),
  }));
};

// Helper function to fetch real-time alerts
const getRealTimeAlerts = async () => {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      FilterExpression: '#label <> :normalLabel AND #status = :unresolved',
      ExpressionAttributeNames: {
        '#label': 'Label',
        '#status': 'Status',
      },
      ExpressionAttributeValues: {
        ':normalLabel': 'normal',  // Exclude logs with Label = "normal"
        ':unresolved': 'unresolved',  // Only include logs with Status = "Unresolved"
      },
    };

    const data = await dynamoDB.scan(params).promise();

    // Map data to format expected by the frontend
    return data.Items.map((alert) => ({
      timestamp: alert.Timestamp,
      connectionID: alert.ConnectionID, // Ensure this field is included
      label: alert.Label, // Add label field
      owner: alert.Owner || "Unassigned", // Include owner with a default value
      status: alert.Status,
    }));
  } catch (err) {
    console.error('Error fetching real-time alerts:', err);
    return [];
  }
};

// Group logs by date for the selected week
async function getLogsGroupedByDate(weekStart, weekEnd) {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      FilterExpression: 'Timestamp BETWEEN :weekStart AND :weekEnd',
      ExpressionAttributeValues: {
        ':weekStart': weekStart,
        ':weekEnd': weekEnd,
      },
    };

    const data = await dynamoDB.scan(params).promise();

    // Group logs by date
    const daysOfWeek = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(weekStart);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
        count: 0,
      };
    });

    data.Items.forEach((log) => {
      const logDate = new Date(log.Timestamp).toISOString().split('T')[0];
      const day = daysOfWeek.find((d) => d.date === logDate);
      if (day) {
        day.count++;
      }
    });

    return { status: 200, data: daysOfWeek };
  } catch (err) {
    console.error('Error fetching and grouping logs:', err);
    return { status: 500, error: 'Internal server error' };
  }
}



module.exports = {
  getIdsLogs,
  fetchAlerts,
  changeAlertOwner,
  updateAlertStatus,
  //processDailyStats,
  processLabelStats,
  getRealTimeAlerts,
  getLogsGroupedByDate,
};
