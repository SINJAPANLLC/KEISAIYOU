const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID;
const SQUARE_ENV = process.env.SQUARE_ENV || "sandbox";
const BASE_URL =
  SQUARE_ENV === "production"
    ? "https://connect.squareup.com/v2"
    : "https://connect.squareupsandbox.com/v2";

function squareHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
    "Square-Version": "2024-01-17",
  };
}

export function isSquareConfigured(): boolean {
  return !!(SQUARE_ACCESS_TOKEN && SQUARE_LOCATION_ID);
}

export async function createSquareCustomer(params: {
  email: string;
  companyName: string;
  contactName?: string;
  phone?: string;
}): Promise<string | null> {
  if (!isSquareConfigured()) {
    console.log("[Square] Not configured – skipping createCustomer");
    return null;
  }
  const res = await fetch(`${BASE_URL}/customers`, {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify({
      email_address: params.email,
      company_name: params.companyName,
      given_name: params.contactName || params.companyName,
      phone_number: params.phone,
      idempotency_key: `customer-${params.email}-${Date.now()}`,
    }),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    console.error("[Square] createCustomer error:", JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.detail || "Square customer creation failed");
  }
  return data.customer?.id || null;
}

export async function saveSquareCard(params: {
  customerId: string;
  sourceId: string;
}): Promise<string | null> {
  if (!isSquareConfigured()) {
    console.log("[Square] Not configured – skipping saveCard");
    return null;
  }
  const res = await fetch(`${BASE_URL}/cards`, {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify({
      idempotency_key: `card-${params.customerId}-${Date.now()}`,
      source_id: params.sourceId,
      card: { customer_id: params.customerId },
    }),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    console.error("[Square] saveCard error:", JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.detail || "Square card save failed");
  }
  return data.card?.id || null;
}

export async function chargeSquareCard(params: {
  customerId: string;
  cardId: string;
  amountYen: number;
  note: string;
}): Promise<{ paymentId: string; status: string }> {
  if (!isSquareConfigured()) {
    console.log(`[Square] Not configured – mock charge ¥${params.amountYen} for ${params.note}`);
    return { paymentId: `mock-${Date.now()}`, status: "COMPLETED" };
  }
  const res = await fetch(`${BASE_URL}/payments`, {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify({
      idempotency_key: `pay-${params.cardId}-${Date.now()}`,
      source_id: params.cardId,
      customer_id: params.customerId,
      amount_money: { amount: params.amountYen, currency: "JPY" },
      location_id: SQUARE_LOCATION_ID,
      note: params.note,
    }),
  });
  const data = await res.json() as any;
  if (!res.ok) {
    console.error("[Square] charge error:", JSON.stringify(data.errors));
    throw new Error(data.errors?.[0]?.detail || "Square payment failed");
  }
  return {
    paymentId: data.payment?.id,
    status: data.payment?.status,
  };
}
