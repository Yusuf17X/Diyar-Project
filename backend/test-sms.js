import "dotenv/config";
import sendSMS from "./utils/sms.js";

const runTest = async () => {
  const myPhoneNumber = process.env.MY_PHONE_NUMBER;

  console.log("Attempting to send a test SMS...");

  await sendSMS({
    to: myPhoneNumber,
    message:
      "Hello from Diyar backend! If you see this, the Twilio SMS service is working.",
  });

  console.log("Test finished. Check your phone!");
};

runTest();
