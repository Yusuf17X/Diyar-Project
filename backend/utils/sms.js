const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
import twilio from "twilio";

const sendSMS = async (options) => {
  try {
    const client = twilio(accountSid, authToken);

    const message = await client.messages.create({
      body: options.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: options.to,
    });

    console.log(`SMS sent successfully to ${options.to}: ${message.sid}`);
    return { success: true, message };
  } catch (error) {
    console.error(`Error sending SMS to ${options.to}:`, error.message);
    return { success: false, error: error.message };
  }
};

export default sendSMS;
