const AWS = require('aws-sdk');

// Configure AWS SNS
AWS.config.update({
  accessKeyId: process.env.AWS_SNS_ACCESS_KEY_ID, // Set in your .env file
  secretAccessKey: process.env.AWS_SNS_SECRET_ACCESS_KEY, // Set in your .env file
  region: process.env.AWS_SNS_REGION, // Example: 'us-east-1'
});

const sns = new AWS.SNS();

// Function to dynamically create a subscription
const createSubscriptionIfNotExists = async (email, topicArn) => {
  try {
    // List subscriptions for the topic
    const subscriptions = await sns.listSubscriptionsByTopic({ TopicArn: topicArn }).promise();

    // Check if the email is already subscribed
    const isSubscribed = subscriptions.Subscriptions.some(
      (subscription) => subscription.Endpoint === email && subscription.SubscriptionArn !== 'PendingConfirmation'
    );

    if (isSubscribed) {
      console.log(`Email ${email} is already subscribed to the topic.`);
      return; // Exit if already subscribed
    }

    // Create a new subscription
    const params = {
      Protocol: 'email', // Email subscription
      TopicArn: topicArn,
      Endpoint: email,
    };

    const result = await sns.subscribe(params).promise();
    console.log(`Subscription request sent to ${email}:`, result);
    console.log(`The user must confirm the subscription via the email sent by AWS SNS.`);
  } catch (error) {
    console.error('Error creating subscription:', error.message);
    throw error;
  }
};

const sendEmailNotification = async (recipientEmail, alertDetails) => {
  const topicArn = process.env.SNS_TOPIC_ARN;

  // Dynamically create subscription if needed
  await createSubscriptionIfNotExists(recipientEmail, topicArn);

  const message = `Dear User,

You have been assigned as the new owner for the following alert:

Connection ID: ${alertDetails.ConnectionID}
Timestamp: ${alertDetails.Timestamp}
Label: ${alertDetails.Label}
Status: ${alertDetails.Status}

Please log in to the system. Then go to the Alert Details page for further details. 
Here is the system link: https://umfypidswebapp.netlify.app/

Best Regards,
System Admin`;

  const params = {
    Message: message,
    Subject: 'Alert Ownership Change Notification',
    TopicArn: topicArn, // Replace with your SNS Topic ARN
  };

  try {
    const result = await sns.publish(params).promise();
    console.log('SNS Publish Response:', result);
    console.log(`Email notification sent to: ${recipientEmail}`);
  } catch (error) {
    console.error('Error sending email notification:', error.message);
  }
};

module.exports = {
  sendEmailNotification,
};
