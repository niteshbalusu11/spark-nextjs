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
    const receiverAddress = searchParams.get('receiver');
    const isUmaRequest = searchParams.get('signature') !== null;
    
    if (!receiverAddress) {
      return NextResponse.json(
        { error: 'Receiver address is required' },
        { status: 400 }
      );
    }

    // Parse the UMA address
    const [username, domain] = receiverAddress.replace('$', '').split('@');
    
    // Check if this is a valid user (in production, check your database)
    // For now, we'll accept any username for testing
    
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

    // Add UMA-specific fields if this is a UMA request
    if (isUmaRequest) {
      response.currencies = [
        {
          code: 'USD',
          name: 'US Dollar',
          symbol: '$',
          multiplier: 100,
          decimals: 2,
          minSendable: 100, // $1.00 minimum
          maxSendable: 1000000, // $10,000 maximum
        },
        {
          code: 'BTC',
          name: 'Bitcoin',
          symbol: '₿',
          multiplier: 100000000,
          decimals: 8,
          minSendable: 1000,
          maxSendable: 100000000000,
        },
      ];
      response.umaVersion = '1.0';
      response.commentAllowed = 255;
      response.nostrPubkey = process.env.UMA_NOSTR_PUBKEY;
      response.allowsNostr = true;
      
      // Add compliance requirements
      response.payerData = {
        name: { mandatory: false },
        email: { mandatory: false },
        identifier: { mandatory: true },
        compliance: { mandatory: true },
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('LNURLP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for LNURLP responses
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify the signature if this is a UMA request
    if (body.signature) {
      // In production, verify the signature using the sender's public key
      // For now, we'll skip verification for testing
    }
    
    // Process the LNURLP response
    const response = {
      status: 'success',
      message: 'LNURLP response processed',
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('LNURLP POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}