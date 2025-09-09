import { NextRequest, NextResponse } from "next/server";
import {
  LightsparkClient,
  AccountTokenAuthProvider,
} from "@lightsparkdev/lightspark-sdk";

const getLightsparkClient = () => {
  const clientId = process.env.LIGHTSPARK_CLIENT_ID;
  const clientSecret = process.env.LIGHTSPARK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Lightspark credentials not configured");
  }

  return new LightsparkClient(
    new AccountTokenAuthProvider(clientId, clientSecret)
  );
};

export async function POST(request: NextRequest) {
  try {
    const { invoice } = await request.json();
    const client = getLightsparkClient();
    const nodeId = process.env.LIGHTSPARK_NODE_ID;

    if (!nodeId) {
      throw new Error("Node ID not configured");
    }

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice is required" },
        { status: 400 }
      );
    }

    // In a real-world scenario, you might want to add more validation here.
    // For example, checking the invoice amount against user balances.

    const payment = await client.payUmaInvoice(nodeId, invoice, 1000);

    return NextResponse.json({ success: true, payment });
  } catch (error) {
    console.error("Send payment error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
