import axios from "axios";
import { config } from "../config";

export async function initiatePayment(
  phone: string,
  amount: number,
  reference: string
): Promise<{ success: boolean; transactionId?: string; message?: string }> {
  const msisdn = phone.replace(/\D/g, "").replace(/^0/, "255");

  try {
    const res = await axios.post(
      `${config.tigo.baseUrl}/payment/collect`,
      {
        BillerCode: config.tigo.billerCode,
        BillerPin: config.tigo.billerPin,
        MSISDN: msisdn,
        Amount: amount.toFixed(2),
        Reference: reference,
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const data = res.data;
    if (data.ResponseCode === "BILLER_000") {
      return { success: true, transactionId: data.TransactionId };
    }
    return { success: false, message: data.ResponseDescription ?? "Payment failed" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, message };
  }
}
