# Deploying UMA to Vercel

This guide explains how to deploy your UMA implementation to Vercel with proper certificate configuration.

## 📋 Prerequisites

- Vercel account
- Your certificate files (`ec_crt.crt` and `ec_key.pem`)
- Lightspark account (optional, for production)

## 🚀 Quick Start

### Step 1: Prepare Environment Variables

Run the preparation script to convert your certificates to environment variables:

```bash
node scripts/prepare-vercel-env.js
```

This will:
- Convert your certificates to single-line format
- Generate a `.env.vercel` file with all values
- Display the values in the terminal

### Step 2: Add to Vercel Dashboard

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**
4. Add the following variables:

#### Required Variables

| Variable Name | Description | Source |
|--------------|-------------|--------|
| `UMA_CERTIFICATE` | Your X.509 certificate | Copy from script output |
| `UMA_PRIVATE_KEY` | Your private key | Copy from script output |

#### Optional Variables (for Production)

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `LIGHTSPARK_CLIENT_ID` | Lightspark API client ID | - |
| `LIGHTSPARK_CLIENT_SECRET` | Lightspark API secret | - |
| `LIGHTSPARK_NODE_ID` | Your Lightning node ID | - |
| `UMA_VASP_DOMAIN` | Your VASP domain | spark-wallet.com |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL | https://your-app.vercel.app |

### Step 3: Deploy

Deploy using one of these methods:

#### Option A: Vercel CLI
```bash
vercel --prod
```

#### Option B: Git Push
```bash
git add .
git commit -m "Deploy UMA to Vercel"
git push origin main
```

#### Option C: Import from GitHub
1. Go to [Vercel New Project](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-deploy on every push

## 🔐 Certificate Format Details

### Single-Line Format
Vercel environment variables don't support multi-line values, so certificates must be converted:

- Original: Multi-line PEM format
- Converted: Single-line with `\n` replacing newlines

Example:
```
-----BEGIN CERTIFICATE-----\nMIICRjCCAey...\n-----END CERTIFICATE-----\n
```

### Private Key Options

You have two options for storing the private key:

1. **Full PEM Format** (Recommended)
   - Use `UMA_PRIVATE_KEY` with the full PEM in single-line format
   - More standard and compatible

2. **Hex Format** (If PEM is too long)
   - Use `UMA_PRIVATE_KEY_HEX` with just the hex string
   - Shorter, but requires conversion in the app

## 🏗️ How It Works

### Local Development
```javascript
// Loads from files if they exist
const certs = loadUMACertificates();
// Checks: ec_crt.crt and ec_key.pem files
```

### Vercel Production
```javascript
// Loads from environment variables
const certs = loadUMACertificates();
// Checks: UMA_CERTIFICATE and UMA_PRIVATE_KEY env vars
```

The `loadUMACertificates()` function in `src/utils/umaCertificates.ts` automatically:
1. First checks for environment variables (Vercel)
2. Falls back to local files (development)
3. Handles both single-line and multi-line formats

## 🧪 Testing Your Deployment

### 1. Verify Environment Variables
After deployment, check that variables are loaded:
- Go to your Vercel project
- Check the Functions tab for any errors
- View Function Logs for certificate loading messages

### 2. Test UMA Endpoints
```bash
# Test LNURLP endpoint
curl https://your-app.vercel.app/api/uma/lnurlp?receiver=$test@spark-wallet.com

# Should return a JSON response with callback URL
```

### 3. Test the UMA Interface
1. Visit `https://your-app.vercel.app/uma`
2. Create a test UMA account
3. Try sending a mock payment
4. Check the Activity Log

## 🐛 Troubleshooting

### Certificate Not Loading

**Error**: "No UMA certificates found"

**Solutions**:
1. Verify environment variables are set in Vercel
2. Check variable names match exactly
3. Ensure no extra spaces in values

### Invalid Certificate Format

**Error**: "Failed to load UMA certificates"

**Solutions**:
1. Re-run `node scripts/prepare-vercel-env.js`
2. Copy the entire value including `-----BEGIN` and `-----END`
3. Make sure `\n` characters are preserved

### API Route Errors

**Error**: 500 errors on `/api/uma/*` routes

**Solutions**:
1. Check Vercel Function Logs
2. Verify all required environment variables are set
3. Test locally with same environment variables

### Build Failures

**Error**: Build fails on Vercel

**Solutions**:
1. Ensure all dependencies are in `package.json`
2. Check for any hardcoded file paths
3. Verify Node.js version compatibility

## 📊 Monitoring

### Vercel Analytics
- Monitor API route performance
- Track error rates
- View real-time logs

### Function Logs
Access logs for debugging:
1. Go to Functions tab in Vercel
2. Select an API route
3. View real-time and historical logs

## 🔒 Security Considerations

### Environment Variable Security
- Vercel encrypts environment variables at rest
- Variables are only accessible to your deployment
- Use different keys for development/staging/production

### Certificate Rotation
1. Generate new certificates periodically
2. Update Vercel environment variables
3. Redeploy (automatic with env var changes)

### Access Control
- Set up Vercel Authentication if needed
- Use API rate limiting
- Implement proper CORS policies

## 📚 Additional Resources

- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Vercel Deployment](https://vercel.com/docs/deployments)
- [UMA Protocol Docs](https://www.uma.me/docs)
- [Lightspark Documentation](https://docs.lightspark.com)

## 💡 Tips

1. **Use Preview Deployments**: Test changes in preview before production
2. **Environment Scopes**: Set different variables for Development/Preview/Production
3. **Secrets Rotation**: Regularly update your certificates and API keys
4. **Monitoring**: Set up alerts for API errors

## 🆘 Getting Help

If you encounter issues:
1. Check Vercel Function Logs
2. Review this documentation
3. Test locally with production environment variables
4. Check the UMA implementation in `/src/utils/umaCertificates.ts`

---

**Note**: Remember to never commit your `.env.vercel` file or actual certificates to version control!