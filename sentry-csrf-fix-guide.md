# Sentry CSRF Verification Failed - Complete Fix Guide

## 🚨 **Current Issue Analysis**
You're getting "CSRF Verification Failed" errors when sending events to your self-hosted Sentry at `sentry-logging.cdubz-hub.com`. This is a common authentication issue with self-hosted Sentry instances.

## 🔧 **Fixes Applied**

### 1. **Updated DSN to HTTPS**
```javascript
// Changed from HTTP to HTTPS
const sentryDsn = 'https://3a277508b33447ba9f4f97d01a95498b@sentry-logging.cdubz-hub.com/2';
```

### 2. **Added Self-Hosted Sentry Configuration**
```javascript
Sentry.init({
  dsn,
  // Self-hosted specific options
  tunnel: undefined, // Don't use tunnel for self-hosted
  normalizeDepth: 6,
  
  // Custom transport headers for authentication
  transportOptions: {
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${apiKey}, sentry_client=sentry.javascript.react/7.120.4`,
    },
  },
});
```

### 3. **Enhanced Debug Tools**
- Added DSN format validation
- Added connection status checker
- Added direct Sentry testing functions
- Enhanced error logging for troubleshooting

## 🔍 **Troubleshooting Steps**

### Step 1: Verify DSN Format
In browser console, run:
```javascript
window.testSentry.checkConnection();
```

Should show:
```
✅ isInitialized: true
✅ dsn: https://[key]@sentry-logging.cdubz-hub.com/2
✅ currentHub: [object]
```

### Step 2: Test Direct Connection
```javascript
window.testSentry.testMessage();
```

Check network tab for:
- ✅ Request to `sentry-logging.cdubz-hub.com/api/2/envelope/`
- ✅ Status 200 (not 403 or CSRF error)
- ✅ Proper authentication headers

### Step 3: Check Sentry Server Configuration

In your CapRover Sentry setup, verify these settings:

#### **Environment Variables**
```bash
# In your Sentry web app settings
SENTRY_USE_SSL=1
SENTRY_SERVER_EMAIL=noreply@sentry-logging.cdubz-hub.com
SENTRY_URL_PREFIX=https://sentry-logging.cdubz-hub.com
CSRF_TRUSTED_ORIGINS=https://sentry-logging.cdubz-hub.com
```

#### **CSRF Settings**
```python
# In your Sentry configuration
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

### Step 4: Update Project DSN

1. Go to your Sentry project settings
2. Navigate to **Client Keys (DSN)**
3. Verify the DSN matches: `https://3a277508b33447ba9f4f97d01a95498b@sentry-logging.cdubz-hub.com/2`
4. If not, update your environment variables

## 🛠️ **Common CSRF Fixes**

### Fix 1: SSL Redirect Issue
```nginx
# In your reverse proxy (if using nginx)
proxy_set_header X-Forwarded-Proto https;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header Host $http_host;
```

### Fix 2: Sentry Web Configuration
```bash
# Update Sentry environment
SENTRY_USE_SSL=1
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
```

### Fix 3: Project Configuration
In Sentry UI → Project Settings → Client Keys:
- Verify the DSN uses HTTPS
- Check that the project ID is `2`
- Ensure the key matches your DSN

## ✅ **Expected Results After Fix**

### Browser Console (Debug Mode):
```
🔍 Sentry DSN format check: ✅ All valid
🚀 Initializing Sentry with DSN: https://3a277508...
✅ Sentry initialized successfully
📤 Test message sent to Sentry
📤 Test exception sent to Sentry
```

### Network Tab:
```
POST https://sentry-logging.cdubz-hub.com/api/2/envelope/
Status: 200 OK
Response: Event accepted
```

### Sentry Dashboard:
- ✅ Test events appear in project
- ✅ No CSRF verification errors
- ✅ Events processed successfully

## 🚨 **If Still Getting CSRF Errors**

### Check Server Logs:
```bash
# In CapRover, check Sentry web logs
docker service logs sentry-web --tail=50

# Look for:
# - CSRF verification failed
# - Forbidden access attempts
# - SSL/HTTPS related errors
```

### Alternative DSN Test:
Try with the internal DSN format:
```javascript
// Test with internal network DSN
const internalDsn = 'http://3a277508b33447ba9f4f97d01a95498b@sentry-web:9000/2';
```

## 📞 **Contact Points**

If issues persist:
1. **Sentry Logs**: Check for detailed CSRF errors
2. **Network Analysis**: Verify headers and SSL setup
3. **Project Settings**: Confirm DSN and security settings
4. **Server Configuration**: Review SSL and proxy settings

The updated configuration should resolve CSRF verification issues by using proper HTTPS endpoints and authentication headers for your self-hosted Sentry instance.