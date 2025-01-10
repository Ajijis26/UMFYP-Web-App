const AWS = require('aws-sdk');

// Configure AWS SNS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID, 
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, 
  region: process.env.AWS_REGION,
});

const sns = new AWS.SNS();
const ses = new AWS.SES();

const verifyEmailWithSES = async (email) => {
  try {
    const params = { EmailAddress: email };
    await ses.verifyEmailIdentity(params).promise();
    console.log(`Verification email sent to ${email}.`);
  } catch (error) {
    console.error(`Error verifying email with SES: ${error.message}`);
    throw error;
  }
};

// Function to dynamically create a subscription
const createSubscriptionIfNotExists = async (email, topicArn) => {
  try {
    // Check if the email is already subscribed to the SNS topic
    const subscriptions = await sns.listSubscriptionsByTopic({ TopicArn: topicArn }).promise();
    const isSubscribed = subscriptions.Subscriptions.some(
      (subscription) => subscription.Endpoint === email && subscription.SubscriptionArn !== 'PendingConfirmation'
    );

    if (isSubscribed) {
      console.log(`Email ${email} is already subscribed to the topic.`);
    } else {
      // Subscribe the email to the SNS topic
      const subscriptionParams = {
        Protocol: 'email',
        TopicArn: topicArn,
        Endpoint: email,
      };
      const result = await sns.subscribe(subscriptionParams).promise();
      console.log(`Subscription request sent to ${email}:`, result);
    }

    // Verify the email address with SES
    await verifyEmailWithSES(email);
  } catch (error) {
    console.error(`Error creating subscription or verifying email: ${error.message}`);
    throw error;
  }
};


const sendEmailNotificationSES = async (recipientEmail, subject, body) => {
  const params = {
    Source: process.env.SES_EMAIL_FROM, // Verified sender email
    Destination: {
      ToAddresses: [recipientEmail],
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Text: {
          Data: body, // For plain text emails
        },
        // Uncomment below for HTML emails:
        // Html: {
        //   Data: `<html><body>${body}</body></html>`,
        // },
      },
    },
  };

  try {
    const result = await ses.sendEmail(params).promise();
    console.log(`Email sent to ${recipientEmail}:`, result);
  } catch (error) {
    console.error(`Error sending email to ${recipientEmail}:`, error.message);
    throw error;
  }
};

module.exports = {
  createSubscriptionIfNotExists,
  sendEmailNotificationSES,
};
