import axios from "axios";
import { config } from "../config";

async function getToken(): Promise<string> {
  const res = await axios.post(
    `${config.airtel.baseUrl}/auth/oauth2/token`,
    {
      client_id: config.airtel.clientId,
      client_secret: config.airtel.clientSecret,
      grant_type: "client_credentials",
    },
    { headers: { "Content-Type": "application/json" } }
  );
  return res.data.access_token;
}

export async function initiatePayment(
  phone: string,
  amount: number,
  reference: string,
  transactionId: string
): Promise<string> {
  const token = await getToken();
  const msisdn = phone.replace(/\D/g, "").replace(/^0/, "255");

  const res = await axios.post(
    `${config.airtel.baseUrl}/merchant/v1/payments/`,
    {
      reference,
      subscriber: { country: "TZ", currency: "TZS", msisdn },
      transaction: { amount, country: "TZ", currency: "TZS", id: transactionId },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Country": "TZ",
        "X-Currency": "TZS",
      },
    }
  );

  return res.data.data?.transaction?.id ?? transactionId;
}
