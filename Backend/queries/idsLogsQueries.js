const { dynamoDB } = require('../database');

async function getIdsLogs(sourceIP) {
  try {
    const params = { TableName: process.env.AWS_DYNAMODB_TABLE_NAME };
    if (sourceIP) {
      params.FilterExpression = 'Source_IP = :sourceIP';
      params.ExpressionAttributeValues = { ':sourceIP': sourceIP };
    }
    const data = await dynamoDB.scan(params).promise();
    return { status: 200, data: data.Items };
  } catch (err) {
    console.error('Error fetching IDS logs:', err.message, err.stack);
    return { status: 500, error: 'Internal server error' };
  }
}

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

async function changeAlertOwner(alertIds, newOwner) {
  try {
    for (const alertId of alertIds) {
      const params = {
        TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
        Key: { id: alertId },
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

async function updateAlertStatus(id, status, username) {
  try {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: { id },
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
