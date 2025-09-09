import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Load certificate and key from environment variables or files
 * For Vercel deployment, use environment variables
 * For local development, use files
 */
export function loadUMACertificates() {
  try {
    // First, try to load from environment variables (for Vercel)
    if (process.env.UMA_CERTIFICATE && process.env.UMA_PRIVATE_KEY) {
      console.log('Loading UMA certificates from environment variables');
      return {
        certificate: process.env.UMA_CERTIFICATE,
        privateKey: process.env.UMA_PRIVATE_KEY,
      };
    }
    
    // If using hex format in env variables
    if (process.env.UMA_PRIVATE_KEY_HEX) {
      console.log('Loading UMA private key from hex environment variable');
      // Convert hex to PEM format
      const privateKeyPem = hexToPem(process.env.UMA_PRIVATE_KEY_HEX, 'EC PRIVATE KEY');
      return {
        certificate: process.env.UMA_CERTIFICATE || '',
        privateKey: privateKeyPem,
      };
    }
    
    // Fallback to loading from files (for local development)
    if (fs.existsSync('ec_crt.crt') && fs.existsSync('ec_key.pem')) {
      console.log('Loading UMA certificates from files');
      const certPath = path.join(process.cwd(), 'ec_crt.crt');
      const keyPath = path.join(process.cwd(), 'ec_key.pem');
      
      const certificate = fs.readFileSync(certPath, 'utf8');
      const privateKey = fs.readFileSync(keyPath, 'utf8');
      
      return {
        certificate,
        privateKey,
      };
    }
    
    console.warn('No UMA certificates found in environment or files');
    return null;
  } catch (error) {
    console.error('Failed to load UMA certificates:', error);
    return null;
  }
}

/**
 * Convert hex string to PEM format
 */
function hexToPem(hexKey: string, type: string): string {
  const buffer = Buffer.from(hexKey, 'hex');
  const base64 = buffer.toString('base64');
  
  // Split into 64-character lines
  const lines = base64.match(/.{1,64}/g) || [];
  
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`;
}

/**
 * Convert PEM to single-line format for environment variables
 */
export function pemToSingleLine(pem: string): string {
  return pem.replace(/\n/g, '\\n');
}

/**
 * Convert single-line format back to PEM
 */
export function singleLineToPem(singleLine: string): string {
  return singleLine.replace(/\\n/g, '\n');
}

/**
 * Extract the private key for signing from PEM format
 */
export function extractPrivateKeyHex(pemKey: string): string {
  try {
    // Handle single-line format from env variables
    const normalizedPem = singleLineToPem(pemKey);
    
    // Remove PEM headers and decode base64
    const lines = normalizedPem.split('\n');
    const keyData = lines
      .filter(line => !line.includes('-----') && line.trim())
      .join('');
    
    // For EC keys, we need to extract the actual private key portion
    const keyBuffer = Buffer.from(keyData, 'base64');
    
    // Parse the DER structure to extract the private key
    const keyHex = keyBuffer.toString('hex');
    
    // For secp256k1 keys, the private key is typically 32 bytes
    // Look for the private key in the DER structure
    const privateKeyMatch = keyHex.match(/(?:30740201010420)([a-f0-9]{64})/i);
    
    if (privateKeyMatch && privateKeyMatch[1]) {
      return privateKeyMatch[1];
    }
    
    // Fallback: try to find any 32-byte sequence that could be the key
    const possibleKey = keyHex.match(/([a-f0-9]{64})/i);
    if (possibleKey) {
      return possibleKey[1];
    }
    
    throw new Error('Could not extract private key from PEM');
  } catch (error) {
    console.error('Failed to extract private key:', error);
    throw error;
  }
}

/**
 * Get the public key from the certificate
 */
export function extractPublicKeyFromCert(certPem: string): string {
  try {
    // Handle single-line format from env variables
    const normalizedCert = singleLineToPem(certPem);
    
    // Create a certificate object
    const cert = new crypto.X509Certificate(normalizedCert);
    
    // Get the public key
    const publicKey = cert.publicKey;
    
    // Export as SPKI format
    const publicKeyPem = publicKey.export({
      type: 'spki',
      format: 'pem',
    });
    
    return publicKeyPem as string;
  } catch (error) {
    console.error('Failed to extract public key from certificate:', error);
    throw error;
  }
}

/**
 * Create UMA signing function using the private key
 */
export function createUMASigner(privateKeyPem: string) {
  return async (message: string): Promise<string> => {
    try {
      // Handle single-line format from env variables
      const normalizedKey = singleLineToPem(privateKeyPem);
      
      const sign = crypto.createSign('SHA256');
      sign.update(message);
      sign.end();
      
      const signature = sign.sign(normalizedKey, 'hex');
      return signature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw error;
    }
  };
}

/**
 * Verify UMA signature using the public key
 */
export function createUMAVerifier(publicKeyPem: string) {
  return async (message: string, signature: string): Promise<boolean> => {
    try {
      // Handle single-line format from env variables
      const normalizedKey = singleLineToPem(publicKeyPem);
      
      const verify = crypto.createVerify('SHA256');
      verify.update(message);
      verify.end();
      
      return verify.verify(normalizedKey, signature, 'hex');
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  };
}

/**
 * Helper function to prepare certificates for Vercel environment variables
 * Run this locally to get the values to paste into Vercel dashboard
 */
export function prepareCertificatesForVercel() {
  try {
    const certs = loadUMACertificates();
    if (!certs) {
      console.error('No certificates found');
      return;
    }
    
    const certSingleLine = pemToSingleLine(certs.certificate);
    const keySingleLine = pemToSingleLine(certs.privateKey);
    const keyHex = extractPrivateKeyHex(certs.privateKey);
    
    console.log('\n=== Copy these values to Vercel Environment Variables ===\n');
    console.log('UMA_CERTIFICATE:');
    console.log(certSingleLine);
    console.log('\nUMA_PRIVATE_KEY:');
    console.log(keySingleLine);
    console.log('\nUMA_PRIVATE_KEY_HEX (alternative, shorter):');
    console.log(keyHex);
    console.log('\n=== End of Environment Variables ===\n');
    
    return {
      UMA_CERTIFICATE: certSingleLine,
      UMA_PRIVATE_KEY: keySingleLine,
      UMA_PRIVATE_KEY_HEX: keyHex,
    };
  } catch (error) {
    console.error('Failed to prepare certificates:', error);
  }
}