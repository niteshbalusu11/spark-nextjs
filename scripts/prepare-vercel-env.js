#!/usr/bin/env node

/**
 * Script to prepare certificate files for Vercel deployment
 * Run this locally to get the environment variable values
 */

const fs = require('fs');
const path = require('path');

function pemToSingleLine(pem) {
  return pem.replace(/\n/g, '\\n');
}

function extractPrivateKeyHex(pemKey) {
  // Remove PEM headers and decode base64
  const lines = pemKey.split('\n');
  const keyData = lines
    .filter(line => !line.includes('-----') && line.trim())
    .join('');
  
  // For EC keys, extract the actual private key portion
  const keyBuffer = Buffer.from(keyData, 'base64');
  const keyHex = keyBuffer.toString('hex');
  
  // Look for the private key in the DER structure
  const privateKeyMatch = keyHex.match(/(?:30740201010420)([a-f0-9]{64})/i);
  
  if (privateKeyMatch && privateKeyMatch[1]) {
    return privateKeyMatch[1];
  }
  
  // Fallback: try to find any 32-byte sequence
  const possibleKey = keyHex.match(/([a-f0-9]{64})/i);
  if (possibleKey) {
    return possibleKey[1];
  }
  
  throw new Error('Could not extract private key from PEM');
}

function main() {
  console.log('\n🔐 Preparing UMA Certificates for Vercel Deployment\n');
  console.log('=' .repeat(60));
  
  try {
    // Check if certificate files exist
    const certPath = path.join(process.cwd(), 'ec_crt.crt');
    const keyPath = path.join(process.cwd(), 'ec_key.pem');
    
    if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
      console.error('❌ Certificate files not found!');
      console.error('   Make sure ec_crt.crt and ec_key.pem are in the project root.');
      process.exit(1);
    }
    
    // Read certificate files
    const certificate = fs.readFileSync(certPath, 'utf8');
    const privateKey = fs.readFileSync(keyPath, 'utf8');
    
    // Convert to single-line format for environment variables
    const certSingleLine = pemToSingleLine(certificate);
    const keySingleLine = pemToSingleLine(privateKey);
    
    // Extract hex format of private key (more compact)
    let keyHex;
    try {
      keyHex = extractPrivateKeyHex(privateKey);
    } catch (error) {
      console.warn('⚠️  Could not extract hex format of private key');
      keyHex = null;
    }
    
    // Output instructions
    console.log('\n📋 INSTRUCTIONS FOR VERCEL:\n');
    console.log('1. Go to your Vercel project dashboard');
    console.log('2. Navigate to Settings → Environment Variables');
    console.log('3. Add the following environment variables:\n');
    
    console.log('=' .repeat(60));
    console.log('\n🔑 OPTION 1: Using Full Certificate and Key (Recommended)\n');
    console.log('Variable Name: UMA_CERTIFICATE');
    console.log('Value:');
    console.log('-'.repeat(60));
    console.log(certSingleLine);
    console.log('-'.repeat(60));
    
    console.log('\nVariable Name: UMA_PRIVATE_KEY');
    console.log('Value:');
    console.log('-'.repeat(60));
    console.log(keySingleLine);
    console.log('-'.repeat(60));
    
    if (keyHex) {
      console.log('\n🔑 OPTION 2: Using Hex Format (Shorter, if Option 1 is too long)\n');
      console.log('Variable Name: UMA_PRIVATE_KEY_HEX');
      console.log('Value:');
      console.log('-'.repeat(60));
      console.log(keyHex);
      console.log('-'.repeat(60));
      
      console.log('\nVariable Name: UMA_CERTIFICATE');
      console.log('Value: (same as Option 1)');
      console.log('-'.repeat(60));
      console.log(certSingleLine);
      console.log('-'.repeat(60));
    }
    
    console.log('\n=' .repeat(60));
    console.log('\n📝 ADDITIONAL VERCEL ENVIRONMENT VARIABLES:\n');
    console.log('Don\'t forget to also add these if you have them:\n');
    console.log('LIGHTSPARK_CLIENT_ID=your_client_id');
    console.log('LIGHTSPARK_CLIENT_SECRET=your_client_secret');
    console.log('LIGHTSPARK_NODE_ID=your_node_id');
    console.log('UMA_VASP_DOMAIN=spark-wallet.com');
    console.log('NEXT_PUBLIC_APP_URL=https://your-app.vercel.app');
    
    console.log('\n=' .repeat(60));
    console.log('\n✅ Done! Copy the values above to your Vercel environment variables.\n');
    
    // Save to file for convenience
    const envContent = `# Vercel Environment Variables for UMA
# Generated on ${new Date().toISOString()}

UMA_CERTIFICATE=${certSingleLine}

UMA_PRIVATE_KEY=${keySingleLine}

${keyHex ? `# Alternative: Use hex format if the above is too long
# UMA_PRIVATE_KEY_HEX=${keyHex}` : ''}

# Add your Lightspark credentials
LIGHTSPARK_CLIENT_ID=
LIGHTSPARK_CLIENT_SECRET=
LIGHTSPARK_NODE_ID=

# UMA Configuration
UMA_VASP_DOMAIN=spark-wallet.com
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
`;
    
    const outputPath = '.env.vercel';
    fs.writeFileSync(outputPath, envContent);
    console.log(`💾 Environment variables also saved to ${outputPath}`);
    console.log('   (DO NOT commit this file to git!)\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();