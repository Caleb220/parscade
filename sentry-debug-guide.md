# Sentry 403 Error Debugging Guide

## 🔍 Current Issue
Your self-hosted Sentry is returning 403 errors when the frontend sends events to `/api/2/envelope/`. This guide provides debugging steps and fixes.

## 🛠️ Step 1: Enable Enhanced Debug Logging

### Environment Variables
Add these to your `.env` file:
```bash
VITE_SENTRY_DEBUG=true
VITE_SENTRY_DSN=http://3a277508b33447ba9f4f97d01a95498b@sentry-logging.cdubz-hub.com/2
```

### Debug Console Output
With debug enabled, you'll see detailed logs:
```
🔧 Initializing Sentry logger...
🚀 Initializing Sentry with DSN: http://3a277508b33447ba9f4f97d01a95498b@sentry...
✅ Sentry initialized successfully
🧪 Running Sentry connection tests...
📤 Test message sent to Sentry
📤 Test exception sent to Sentry
```

### Manual Testing Functions
In development, test Sentry from browser console:
```javascript
// Test message
window.testSentry.testMessage();

// Test error
window.testSentry.testError();

// Test exception (will be caught by global handler)
window.testSentry.testException();
```

## 🔍 Step 2: Check Sentry Relay Configuration

### Generate Relay Credentials
```bash
# In your Sentry relay container or local relay installation
relay credentials generate --stdout

# Output will be:
# RELAY_ID=12345678-1234-1234-1234-123456789012
# PUBLIC_KEY=abcd1234...
# SECRET_KEY=xyz789...
```

### Update relay-config.yml
Replace the placeholder keys in `relay-config.yml`:
```yaml
relay:
  public_key: "YOUR_ACTUAL_PUBLIC_KEY_FROM_GENERATION"
  secret_key: "YOUR_ACTUAL_SECRET_KEY_FROM_GENERATION"
  upstream: "http://sentry-web:9000/"  # Point to your Sentry web service
```

### Approve Relay in Sentry UI
1. Go to your Sentry web interface
2. Navigate to Settings → Relays
3. Add your relay's public key
4. Set status to "Active"

## 🔍 Step 3: Check CapRover Container Logs

### Relay Logs
```bash
# Check relay logs for 403 details
docker logs sentry-relay --tail=100 -f

# Look for:
# - "upstream returned 403"
# - "authentication failed"
# - "public key not found"
```

### Sentry Web Logs
```bash
# Check Sentry web service logs
docker logs sentry-web --tail=100 -f

# Look for:
# - Relay authentication errors
# - Whitelist errors
# - Rate limiting
```

### Network Connectivity Test
```bash
# Test connectivity from relay to Sentry web
docker exec sentry-relay curl -v http://sentry-web:9000/api/0/

# Should return Sentry API response, not 403
```

## 🔍 Step 4: Common 403 Causes & Fixes

### Cause 1: Relay Not Registered
**Problem**: Relay public key not added to Sentry
**Fix**: 
1. Get relay public key from logs or credentials generation
2. Add to Sentry UI → Settings → Relays
3. Set status to "Active"

### Cause 2: Wrong Upstream URL
**Problem**: Relay pointing to wrong Sentry instance
**Fix**: Update `relay-config.yml` upstream to point to correct Sentry web service

### Cause 3: Network Issues
**Problem**: Relay can't reach Sentry web service
**Fix**: 
1. Verify CapRover internal networking
2. Check service names match docker-compose
3. Test with `docker exec` commands

### Cause 4: Authentication Headers
**Problem**: Missing or wrong auth headers
**Fix**: Verify DSN format and public key match

## 🔍 Step 5: CapRover Specific Debugging

### Check Service Status
```bash
# In CapRover UI or CLI
caprover service ps sentry-relay
caprover service logs sentry-relay --tail 50
```

### Network Inspection
```bash
# Check internal network connectivity
docker network ls
docker network inspect caprover-network
```

### Environment Variables
Verify in CapRover app settings:
```
SENTRY_RELAY_WHITELIST_PK=YOUR_RELAY_PUBLIC_KEY
SENTRY_USE_RELAY=true
```

## 🧪 Step 6: End-to-End Testing

### Frontend Event Test
```javascript
// In browser console
Sentry.captureMessage("E2E Test Message", "info");
Sentry.captureException(new Error("E2E Test Error"));
```

### Check Event Flow
1. **Frontend** → Sends event to relay (`/api/2/envelope/`)
2. **Relay** → Forwards to Sentry web service
3. **Sentry** → Processes and stores event
4. **UI** → Event appears in project dashboard

### Success Indicators
- ✅ No 403 errors in browser network tab
- ✅ Events appear in Sentry project dashboard
- ✅ Debug logs show successful transport
- ✅ Relay logs show successful upstream forwarding

## 🚨 If Still Getting 403

### Temporary Bypass Test
Update DSN to point directly to Sentry web (bypass relay):
```javascript
// Change DSN from relay URL to direct Sentry web URL
const directDsn = "http://3a277508b33447ba9f4f97d01a95498b@sentry-web:9000/2"
```

If this works, issue is with relay configuration.
If this fails, issue is with Sentry web service.

### Contact Points
1. **Relay Issues**: Check relay documentation and GitHub issues
2. **Sentry Issues**: Check Sentry self-hosted documentation
3. **CapRover Issues**: Check CapRover networking documentation

## ✅ Expected Results
After following this guide:
- 🔧 Enhanced debug logging shows event lifecycle
- 📡 Events successfully reach Sentry dashboard
- 🚫 No more 403 errors in network tab
- ✅ Both manual and automatic error reporting works