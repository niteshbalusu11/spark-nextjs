import { NextRequest, NextResponse } from "next/server";
import * as uma from "@uma-sdk/core";
import {
  LightsparkClient,
  AccountTokenAuthProvider,
} from "@lightsparkdev/lightspark-sdk";

// Initialize Lightspark client
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

import {
  loadUMACertificates,
  extractPrivateKeyHex,
} from "@/utils/umaCertificates";

// In-memory cache for public keys. In a real application, you'd want to use a
// persistent cache like Redis.
const pubKeyCache = new Map<string, uma.PubKeyResponse>();

export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);
    console.log(body);
    const payRequest = uma.PayRequest.fromJson(bodyText);
    const client = getLightsparkClient();
    const nodeId = process.env.LIGHTSPARK_NODE_ID;
    if (!nodeId) {
      throw new Error("Node ID not configured");
    }

    const umaCerts = loadUMACertificates();
    if (!umaCerts) {
      throw new Error("UMA certificates not loaded");
    }

    // In a real application, you'd fetch the public keys from the sender's VASP.
    // const senderPublicKeys = await uma.fetchPublicKeyForVasp({
    //   vaspDomain: payRequest.vaspDomain,
    //   cache: pubKeyCache,
    // });

    // In a real application, you would verify the signature.
    // const isValid = await uma.verifyPayRequestSignature({
    //   request: payRequest,
    //   vaspPublicKeys: senderPublicKeys,
    // });
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    // }

    const metadata = JSON.stringify([
      ["text/plain", `Payment from ${payRequest.payerData?.identifier}`],
    ]);

    const umaInvoiceCreator = {
      createUmaInvoice: async (amountMsats: number, metadata: string) => {
        const invoice = await client.createUmaInvoice(
          nodeId,
          Math.round(amountMsats),
          metadata
        );
        return invoice?.data.encodedPaymentRequest;
      },
    };

    console.log("Creating PayReq response for:", payRequest);

    const response = await uma.getPayReqResponse({
      request: payRequest,
      invoiceCreator: umaInvoiceCreator,
      metadata,
      receivingCurrencyCode: "USD",
      // In a real application, you'd fetch this from a real exchange rate service.
      conversionRate: 40000,
      receivingCurrencyDecimals: 2,
      receiverFeesMillisats: 500,
      payeeData: {
        name: "Alice",
        email: "alice@vasp.com",
      },
      // This is the identifier of the user in your system.
      payeeIdentifier: "$alice@vasp.com",
      receivingVaspPrivateKey: Buffer.from(
        extractPrivateKeyHex(umaCerts.privateKey),
        "hex"
      ),
      receiverChannelUtxos: [],
    });

    console.log("PayReq response:", response);

    return NextResponse.json(response.toJsonSchemaObject());
  } catch (error) {
    console.error("PayReq error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
