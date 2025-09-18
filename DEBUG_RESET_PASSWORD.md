# Debug Reset Password Email Issues - Updated Guide

If you're experiencing password reset email issues, follow this comprehensive debugging guide:

## 1. **Check Browser Console First**
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for detailed error messages with these prefixes:
   - `🔄` - Process starting
   - `✅` - Success
   - `❌` - Error
   - `🔍` - Debug information

## 2. **Common Error Patterns & Solutions**

### AuthApiError: Error sending recovery email
**Cause**: Supabase email service configuration issue
**Solutions**:
1. **Check Supabase Email Settings**:
   - Go to Authentication → Settings → SMTP Settings
   - Verify SMTP configuration is complete
   - Test with "Send Test Email" button

2. **Verify Site URL**:
   - Go to Authentication → Settings
   - Ensure Site URL matches your domain exactly
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`

3. **Check Redirect URLs**:
   - Add these to Redirect URLs list:
   - `http://localhost:5173/reset-password` (dev)
   - `https://yourdomain.com/reset-password` (prod)

### Rate Limit Errors
**Cause**: Too many requests in short time
**Solutions**:
1. Wait 5-15 minutes between attempts
2. Check if you're hitting Supabase rate limits
3. Consider implementing exponential backoff

### Invalid Email Format
**Cause**: Email validation failing
**Solutions**:
1. Ensure email contains @ and valid domain
2. Check for extra spaces or special characters
3. Try with a different email address

## 3. **Supabase Configuration Checklist**

### A. Authentication Settings
```
✅ Site URL: http://localhost:5173 (dev) or https://yourdomain.com (prod)
✅ Redirect URLs include /reset-password path
✅ Email confirmation: Disabled (unless you want it enabled)
✅ Enable email confirmations: Check your preference
```

### B. Email Template Configuration
1. Go to Authentication → Email Templates → Reset Password
2. **CRITICAL**: Update the reset link to use the correct variable:

**Replace this:**
```html
<a href="{{ .SiteURL }}/reset-password?{{ .TokenHash }}&type=recovery">
```

**With this:**
```html
<a href="{{ .ConfirmationURL }}">
```

### C. SMTP Configuration (Recommended)
**For Production, set up custom SMTP:**

**Gmail Example:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password
SMTP Admin Email: your-email@gmail.com
```

**SendGrid Example:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: YOUR_SENDGRID_API_KEY
SMTP Admin Email: noreply@yourdomain.com
```

## 4. **Enhanced Debug Information**

The updated code now provides detailed debug information in development mode:

### Console Logs to Look For:
```
🔄 Attempting password reset for: user@example.com
🔍 All query parameters: {...}
📋 Using new format (access_token found)
✅ Query validation successful
🔄 Setting session with tokens...
✅ Session established successfully
```

### Error Logs to Watch For:
```
❌ Supabase reset password error: [detailed error]
❌ Query validation failed: [validation issues]
❌ Exchange recovery session failed: [session error]
```

## 5. **Testing the Complete Flow**

### A. Test Email Sending
1. Go to `/forgot-password`
2. Enter a valid email
3. Check browser console for detailed logs
4. Verify email is received (check spam folder)

### B. Test Reset Link
1. Click the reset link from email
2. Check console for token validation logs
3. Verify redirect to `/reset-password` with tokens
4. Complete password reset process

### C. Test Error Scenarios
1. **Invalid Email**: Try with malformed email
2. **Rate Limiting**: Make multiple rapid requests
3. **Expired Token**: Use an old reset link
4. **Invalid Token**: Modify URL parameters

## 6. **Environment Variables Check**

Verify your `.env` file contains:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 7. **Network Issues**

### Check Network Tab:
1. Open Developer Tools → Network
2. Look for failed requests to Supabase
3. Check response status codes:
   - 429: Rate limited
   - 400: Bad request (check email format)
   - 422: Validation error
   - 500: Server error

## 8. **Advanced Debugging**

### Enable Debug Mode:
1. The forgot password page now has enhanced debug info in development
2. Look for "Debug Info (Dev Only)" section
3. Copy logs for detailed analysis

### Manual API Testing:
```javascript
// Test in browser console
const { data, error } = await supabase.auth.resetPasswordForEmail('test@example.com', {
  redirectTo: `${window.location.origin}/reset-password`
});
console.log('Data:', data);
console.log('Error:', error);
```

## 9. **Common Solutions Summary**

1. **Fix Email Template**: Use `{{ .ConfirmationURL }}` in reset password template
2. **Configure SMTP**: Set up custom SMTP for reliable email delivery
3. **Check URLs**: Ensure Site URL and Redirect URLs are correct
4. **Wait for Rate Limits**: Don't make too many requests quickly
5. **Verify Email**: Make sure the email address is valid and confirmed

## 10. **Production Checklist**

Before going live:
- ✅ Custom SMTP configured and tested
- ✅ Production URLs in Supabase settings
- ✅ Email templates updated with correct variables
- ✅ Rate limiting configured appropriately
- ✅ Error monitoring set up
- ✅ Email deliverability tested with multiple providers

## 11. **Getting Help**

If issues persist:
1. Check the enhanced console logs
2. Copy debug information from the debug panel
3. Verify Supabase project status at https://status.supabase.com/
4. Contact support with specific error messages and debug logs

The updated implementation now provides much more detailed error information and better handles edge cases in the password reset flow.