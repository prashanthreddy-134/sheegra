import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../prismaClient.js";

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 5;

function generateSixDigitCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

async function sendViaMsg91(phone, code) {
  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authkey: process.env.MSG91_AUTH_KEY,
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phone.replace("+", ""),
      sender: process.env.MSG91_SENDER_ID,
      otp: code,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `MSG91 send failed: ${res.status} ${await res.text()}`
    );
  }
}

async function sendViaTwilio(phone, code) {
  const twilio = (await import("twilio")).default;

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    to: phone,
    messagingServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    body: `Your Sheegra verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
  });
}

async function dispatchOtp(phone, code) {
  const provider = process.env.OTP_PROVIDER || "console";

  if (provider === "msg91") {
    return sendViaMsg91(phone, code);
  }

  if (provider === "twilio") {
    return sendViaTwilio(phone, code);
  }

  // Development fallback.
  console.log(
    `[DEV OTP] ${phone} -> ${code} (expires in ${OTP_TTL_MINUTES}m)`
  );
}

export async function requestOtp(phone, purpose = "LOGIN") {
  const code = generateSixDigitCode();

  const codeHash = await bcrypt.hash(code, 10);

  const expiresAt = new Date(
    Date.now() + OTP_TTL_MINUTES * 60 * 1000
  );

  await prisma.otpRequest.create({
    data: {
      phone,
      codeHash,
      purpose,
      expiresAt,
    },
  });

  await dispatchOtp(phone, code);

  return {
    expiresAt,
  };
}

export async function verifyOtp(
  phone,
  code,
  purpose = "LOGIN"
) {
  const otp = await prisma.otpRequest.findFirst({
    where: {
      phone,
      purpose,
      consumed: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!otp) {
    return {
      valid: false,
      reason: "No OTP request found. Request a new code.",
    };
  }

  if (otp.expiresAt < new Date()) {
    return {
      valid: false,
      reason: "OTP expired. Request a new code.",
    };
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    return {
      valid: false,
      reason: "Too many attempts. Request a new code.",
    };
  }

  const match = await bcrypt.compare(code, otp.codeHash);

  if (!match) {
    await prisma.otpRequest.update({
      where: {
        id: otp.id,
      },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });

    return {
      valid: false,
      reason: "Incorrect code.",
    };
  }

  await prisma.otpRequest.update({
    where: {
      id: otp.id,
    },
    data: {
      consumed: true,
    },
  });

  return {
    valid: true,
  };
}