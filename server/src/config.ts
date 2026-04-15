import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback = ""): string {
  return process.env[key] ?? fallback;
}

export const config = {
  nodeEnv: optional("NODE_ENV", "development"),
  port: parseInt(optional("SERVER_PORT", "4000"), 10),
  origin: optional("SERVER_ORIGIN", "http://localhost:3000"),

  db: {
    url: required("DATABASE_URL"),
  },

  jwt: {
    secret: optional("JWT_SECRET", "dev-secret-change-me"),
    expiresIn: optional("JWT_EXPIRES_IN", "15m"),
    refreshSecret: optional("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
    refreshExpiresIn: optional("JWT_REFRESH_EXPIRES_IN", "7d"),
  },

  whatsapp: {
    token: optional("WHATSAPP_TOKEN"),
    phoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
    webhookVerifyToken: optional("WHATSAPP_WEBHOOK_VERIFY_TOKEN"),
  },

  mpesa: {
    consumerKey: optional("MPESA_CONSUMER_KEY"),
    consumerSecret: optional("MPESA_CONSUMER_SECRET"),
    shortcode: optional("MPESA_SHORTCODE"),
    passkey: optional("MPESA_PASSKEY"),
    callbackUrl: optional("MPESA_CALLBACK_URL"),
  },

  airtel: {
    clientId: optional("AIRTEL_CLIENT_ID"),
    clientSecret: optional("AIRTEL_CLIENT_SECRET"),
    baseUrl: optional("AIRTEL_BASE_URL", "https://openapi.airtel.africa"),
    callbackUrl: optional("AIRTEL_CALLBACK_URL"),
  },

  tigo: {
    billerCode: optional("TIGO_BILLER_CODE"),
    billerPin: optional("TIGO_BILLER_PIN"),
    baseUrl: optional("TIGO_BASE_URL"),
    callbackUrl: optional("TIGO_CALLBACK_URL"),
  },

  sms: {
    apiKey: optional("SMS_API_KEY", ""),
    authType: optional("SMS_AUTH_TYPE", "basic") as "bearer" | "basic",
    senderId: optional("SMS_SENDER_ID", "ENTRON"),
    sandbox: optional("SMS_SANDBOX", "false") === "true",
  },

  // Beem Africa SMS (https://apisms.beem.africa)
  beem: {
    apiKey:    optional("BEEM_API_KEY", ""),
    secretKey: optional("BEEM_SECRET_KEY", ""),
    senderId:  optional("BEEM_SENDER_ID", "ENTRON"),
  },

  storage: {
    type: optional("STORAGE_TYPE", "local") as "local" | "s3",
    uploadDir: optional("UPLOAD_DIR", "./uploads"),
  },
} as const;
