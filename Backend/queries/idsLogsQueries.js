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
async function fetchAlerts(label = 'intrusion') {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      FilterExpression: 'Label = :label',
      ExpressionAttributeValues: { ':label': label },
    };

    const data = await dynamoDB.scan(params).promise();
    return { status: 200, data: data.Items };
  } catch (err) {
    console.error('Error fetching alerts:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

// Update Alert Owner
async function changeAlertOwner(alertIds, newOwner) {
  try {
    for (const alertId of alertIds) {
      const params = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Key: { ConnectionID: alertId }, // Adjust to your Partition Key
        UpdateExpression: 'SET Owner = :newOwner',
        ExpressionAttributeValues: { ':newOwner': newOwner },
      };
      await dynamoDB.update(params).promise();
    }
    return { status: 200, message: 'Alert owner updated successfully' };
  } catch (err) {
    console.error('Error updating alert owner:', err);
    return { status: 500, error: 'Internal server error' };
  }
}

// Update Alert Status
async function updateAlertStatus(connectionId, status, username) {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: { ConnectionID: connectionId },
      UpdateExpression: 'SET Status = :status, UpdatedBy = :username',
      ExpressionAttributeValues: { ':status': status, ':username': username },
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
