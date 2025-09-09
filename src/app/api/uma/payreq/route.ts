import { NextRequest, NextResponse } from 'next/server';
import * as uma from '@uma-sdk/core';
import { LightsparkClient, AccountTokenAuthProvider } from '@lightsparkdev/lightspark-sdk';

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

// Mock exchange rate service
const getExchangeRate = (fromCurrency: string, toCurrency: string): number => {
  // In production, fetch real exchange rates
  const rates: Record<string, number> = {
    'USD_BTC': 0.000025,
    'BTC_USD': 40000,
  };
  
  return rates[`${fromCurrency}_${toCurrency}`] || 1;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Extract payment request details
    const {
      amount,
      currency,
      payerData,
      payerIdentifier,
      payerKycStatus,
      comment,
    } = body;
    
    if (!amount || !currency) {
      return NextResponse.json(
        { error: 'Amount and currency are required' },
        { status: 400 }
      );
    }
    
    // Initialize Lightspark client
    const client = getLightsparkClient();
    const nodeId = process.env.LIGHTSPARK_NODE_ID;
    
    if (!nodeId) {
      throw new Error('Node ID not configured');
    }
    
    // Calculate amount in millisatoshis
    let amountMsats: number;
    if (currency === 'BTC') {
      amountMsats = Math.round(amount * 1000); // BTC to millisats
    } else if (currency === 'USD') {
      const btcAmount = amount * getExchangeRate('USD', 'BTC');
      amountMsats = Math.round(btcAmount * 100000000 * 1000); // USD to BTC to millisats
    } else {
      amountMsats = Math.round(amount * 1000); // Default to sats
    }
    
    // Create Lightning invoice
    const expirationSec = 600; // 10 minutes
    const memo = comment || `Payment of ${amount} ${currency}`;
    
    try {
      // Create UMA invoice using Lightspark
      const invoice = await client.createUmaInvoice(
        nodeId,
        amountMsats,
        JSON.stringify({
          currency,
          amount,
          payerIdentifier,
          timestamp: Date.now(),
        }),
        expirationSec
      );
      
      if (!invoice?.data.encodedPaymentRequest) {
        throw new Error('Failed to create invoice');
      }
      
      // Prepare response
      const response: any = {
        pr: invoice.data.encodedPaymentRequest,
        routes: [],
        disposable: true,
      };
      
      // Add payment info for currency conversion
      if (currency !== 'BTC') {
        response.paymentInfo = {
          currencyCode: currency,
          decimals: currency === 'USD' ? 2 : 8,
          multiplier: currency === 'USD' ? 100 : 100000000,
          exchangeFeesMillisatoshi: Math.round(amountMsats * 0.001), // 0.1% fee
        };
      }
      
      // Add compliance data if required
      if (payerKycStatus) {
        response.compliance = {
          nodePubKey: process.env.UMA_NODE_PUBKEY,
          utxoCallback: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/uma/utxo`,
        };
      }
      
      // Add payee data
      response.payeeData = {
        name: payerData?.name,
        email: payerData?.email,
        identifier: payerIdentifier,
      };
      
      // Add success action
      response.successAction = {
        tag: 'message',
        message: `Payment of ${amount} ${currency} received successfully!`,
      };
      
      return NextResponse.json(response);
    } catch (invoiceError) {
      console.error('Invoice creation error:', invoiceError);
      
      // Return a mock invoice for testing if Lightspark is not configured
      if (process.env.NODE_ENV === 'development') {
        const mockInvoice = 'lnbc' + Math.random().toString(36).substring(2, 15);
        return NextResponse.json({
          pr: mockInvoice,
          routes: [],
          disposable: true,
          paymentInfo: {
            currencyCode: currency,
            decimals: currency === 'USD' ? 2 : 8,
            multiplier: currency === 'USD' ? 100 : 100000000,
            exchangeFeesMillisatoshi: Math.round(amountMsats * 0.001),
          },
          successAction: {
            tag: 'message',
            message: `Mock payment of ${amount} ${currency} (dev mode)`,
          },
        });
      }
      
      throw invoiceError;
    }
  } catch (error) {
    console.error('PayReq error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET handler for checking payment status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoice');
    
    if (!invoiceId) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }
    
    // In production, check the actual payment status
    // For now, return a mock status
    const status = {
      paid: false,
      preimage: null,
      settledAt: null,
    };
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Payment status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}