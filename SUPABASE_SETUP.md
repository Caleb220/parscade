# Supabase Reset Password Setup Guide

This guide covers all the Supabase configuration needed for the reset password functionality to work properly.

## 1. Authentication Settings

### Navigate to Authentication → Settings in your Supabase Dashboard

#### A. Site URL Configuration
```
Site URL: https://your-domain.com
```
- For development: `http://localhost:5173` (or your dev port)
- For production: Your actual domain

#### B. Redirect URLs
Add these URLs to your **Redirect URLs** list:
```
# Development
http://localhost:5173/reset-password
http://localhost:5173/

# Production
https://your-domain.com/reset-password
https://your-domain.com/
```

#### C. Additional Redirect URLs (Optional)
```
# If you want to support different environments
https://staging.your-domain.com/reset-password
https://preview.your-domain.com/reset-password
```

## 2. Email Templates Configuration

### Navigate to Authentication → Email Templates

#### A. Reset Password Template
1. Click on **"Reset Password"** template
2. Update the template with professional styling:

```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>You recently requested to reset your password for your Parscade account. Click the button below to reset it.</p>

<p><a href="{{ .SiteURL }}/reset-password?{{ .TokenHash }}&type=recovery" 
   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
   Reset Your Password
</a></p>

<p><strong>This link will expire in 24 hours.</strong></p>

<p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>

<p>Thanks,<br>
The Parscade Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
If the button above doesn't work, copy and paste this link into your browser:<br>
{{ .SiteURL }}/reset-password?{{ .TokenHash }}&type=recovery
</p>
```

#### B. Confirm Signup Template (Optional Enhancement)
Update the signup confirmation template:

```html
<h2>Welcome to Parscade!</h2>

<p>Hi {{ .Name }},</p>

<p>Welcome to the Parscade beta program! Please confirm your email address to get started.</p>

<p><a href="{{ .ConfirmationURL }}" 
   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
   Confirm Your Email
</a></p>

<p>This link will expire in 24 hours.</p>

<p>Thanks,<br>
The Parscade Team</p>
```

## 3. SMTP Configuration (Recommended for Production)

### For Production, Configure Custom SMTP:

#### A. Navigate to Authentication → Settings → SMTP Settings

#### B. Configure Your Email Provider:

**Example with SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
SMTP Admin Email: noreply@your-domain.com
SMTP Sender Name: Parscade
```

**Example with AWS SES:**
```
SMTP Host: email-smtp.[region].amazonaws.com
SMTP Port: 587
SMTP User: [Your SES SMTP Username]
SMTP Pass: [Your SES SMTP Password]
SMTP Admin Email: noreply@your-domain.com
SMTP Sender Name: Parscade
```

#### C. Test Email Configuration
Use the "Send Test Email" button to verify your SMTP setup works.

## 4. Security Configuration

### Navigate to Authentication → Settings

#### A. Password Requirements
Enable these security settings:
- ✅ **Minimum password length**: 12 characters
- ✅ **Require special characters**
- ✅ **Require numbers**
- ✅ **Require uppercase letters**
- ✅ **Require lowercase letters**

#### B. Session Configuration
```
JWT expiry: 3600 (1 hour)
Refresh token rotation: Enabled
```

#### C. Rate Limiting (if available)
```
Password reset requests: 5 per hour per email
Login attempts: 10 per hour per IP
```

## 5. Database Policies (If Using RLS)

If you have Row Level Security enabled, ensure these policies exist:

```sql
-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" ON auth.users
FOR SELECT USING (auth.uid() = id);

-- Allow password updates for authenticated users
CREATE POLICY "Users can update own password" ON auth.users
FOR UPDATE USING (auth.uid() = id);
```

## 6. Environment Variables Verification

Ensure your `.env` file has the correct values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 7. Testing the Complete Flow

### A. Test Forgot Password
1. Go to `/forgot-password`
2. Enter a valid email address
3. Check that email is received
4. Verify the reset link format

### B. Test Reset Password
1. Click the reset link from email
2. Verify you're redirected to `/reset-password` with proper tokens
3. Set a new password
4. Verify success redirect to dashboard
5. Test login with new password

### C. Test Error Scenarios
1. **Expired Token**: Use an old reset link (should show error)
2. **Invalid Token**: Modify the URL token (should show error)
3. **Weak Password**: Try passwords that don't meet requirements
4. **Rate Limiting**: Make multiple requests quickly

## 8. Common Issues & Solutions

### Issue: "Invalid login credentials" after password reset
**Solution**: Clear browser local storage and cookies, then try again.

### Issue: Reset emails not being sent
**Solutions**:
1. Check SMTP configuration
2. Verify redirect URLs are correct
3. Check spam folder
4. Test with different email providers

### Issue: "Auth session missing" error
**Solution**: Ensure the redirect URLs in Supabase match your application URLs exactly.

### Issue: Token validation fails
**Solution**: 
1. Check that Site URL matches your application domain
2. Verify redirect URLs include the reset-password path
3. Ensure tokens aren't being modified in transit

## 9. Production Checklist

Before going live:
- ✅ Custom SMTP provider configured
- ✅ Production domain in Site URL
- ✅ All redirect URLs updated for production
- ✅ Email templates tested and professional
- ✅ Rate limiting enabled
- ✅ Strong password requirements enforced
- ✅ Error handling tested
- ✅ Analytics/monitoring configured

## 10. Monitoring & Maintenance

### Set up monitoring for:
- Password reset request rates
- Email delivery success rates
- Reset completion rates
- Error rates and types

### Regular maintenance:
- Review failed reset attempts
- Update email templates as needed
- Monitor for suspicious activity
- Update security settings as requirements change