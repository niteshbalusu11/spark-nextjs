import { NextRequest, NextResponse } from 'next/server';
import * as uma from '@uma-sdk/core';
import { LightsparkClient, AccountTokenAuthProvider } from '@lightsparkdev/lightspark-sdk';
import { loadUMACertificates, extractPrivateKeyHex, createUMASigner } from '@/utils/umaCertificates';

// Load certificates on server startup
let umaKeys: { certificate: string; privateKey: string; } | null = null;
let umaSigner: ((message: string) => Promise<string>) | null = null;

// Initialize UMA keys and signer
const initializeUMAKeys = () => {
  if (!umaKeys) {
    umaKeys = loadUMACertificates();
    if (umaKeys) {
      umaSigner = createUMASigner(umaKeys.privateKey);
    }
  }
  return { umaKeys, umaSigner };
};

// Initialize Lightspark client
const getLightsparkClient = () => {
  const clientId = process.env.LIGHTSPARK_CLIENT_ID;
  const clientSecret = process.env.LIGHTSPARK_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    throw new Error('Lightspark credentials not configured');
  }
  
  return new LightsparkClient(
    new AccountTokenAuthProvider(clientId, clientSecret)
  );
};

// GET handler for LNURLP requests
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = new URL(request.url);
    const isUmaRequest = uma.isUmaLnurlpQuery(url);

    if (isUmaRequest) {
      const { umaKeys, umaSigner } = initializeUMAKeys();
      if (!umaKeys || !umaSigner) {
        throw new Error('UMA certificates not loaded');
      }

      const umaRequest = uma.parseLnurlpRequest(url);
      const client = getLightsparkClient();

      // In a real application, you'd fetch the public keys from the sender's VASP.
      // For this example, we'll assume a mock implementation or a known key.
      // const senderPublicKeys = await uma.fetchPublicKeyForVasp({
      //   vaspDomain: umaRequest.vaspDomain,
      //   cache: new Map(), // In production, use a persistent cache
      // });

      // In a real application, you would verify the signature.
      // const isValid = await uma.verifyUmaLnurlpRequestSignature({
      //   request: umaRequest,
      //   vaspPublicKeys: senderPublicKeys,
      //   nonceCache: new Map(), // In production, use a persistent cache
      // });
      // if (!isValid) {
      //   return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      // }

      const metadata = JSON.stringify([
        ['text/plain', `Payment to ${umaRequest.receiverAddress}`],
        ['text/identifier', umaRequest.receiverAddress],
      ]);

      const response = await uma.getLnurlpResponse({
        request: umaRequest,
        privateKeyBytes: Buffer.from(extractPrivateKeyHex(umaKeys.privateKey), 'hex'),
        requiresTravelRuleInfo: true,
        callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/uma/payreq`,
        encodedMetadata: metadata,
        minSendableSats: 1,
        maxSendableSats: 10000000,
        payerDataOptions: {
          name: { mandatory: false },
          email: { mandatory: false },
          identifier: { mandatory: true },
          compliance: { mandatory: true },
        },
        currencyOptions: [
          new uma.Currency(
            'USD',
            'US Dollar',
            '$',
            2,
            100,
            1000000,
            100,
          ),
          new uma.Currency(
            'BTC',
            'Bitcoin',
            '₿',
            8,
            1000,
            100000000000,
            100000000,
          ),
        ],
        nostrPubkey: process.env.UMA_NOSTR_PUBKEY,
      });

      return NextResponse.json(response.toJsonSchemaObject());
    }

    // Fallback for standard LNURLP requests
    const receiverAddress = searchParams.get('receiver');
    if (!receiverAddress) {
      return NextResponse.json(
        { error: 'Receiver address is required' },
        { status: 400 }
      );
    }

    const response: any = {
      callback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/uma/payreq`,
      minSendable: 1000, // 1 sat minimum
      maxSendable: 100000000000, // 1 BTC maximum
      metadata: JSON.stringify([
        ['text/plain', `Payment to ${receiverAddress}`],
        ['text/identifier', receiverAddress],
      ]),
      tag: 'payRequest',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('LNURLP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
