const { dynamoDB } = require('../database');

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
    for (const alert of alerts) {
      if (!alert.ConnectionID || !alert.SrcIP) {
        throw new Error("Invalid alert structure. Missing ConnectionID or SrcIP.");
      }

      const params = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Key: {
          ConnectionID: alert.ConnectionID, // Partition Key
          SrcIP: alert.SrcIP, // Sort Key
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
    }

    return { status: 200, message: 'Alert owner updated successfully' };
  } catch (err) {
    console.error("Error updating alert owner into database:", err);
    return { status: 500, error: 'Internal server error' };
  }
}

// Update Alert Status
async function updateAlertStatus(connectionId, srcIp, status, username) {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: {
        ConnectionID: connectionId, // Partition Key
        SrcIP: srcIp,              // Sort Key
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


module.exports = {
  getIdsLogs,
  fetchAlerts,
  changeAlertOwner,
  updateAlertStatus,
};
