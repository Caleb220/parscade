# Supabase Email Configuration Fix - 500 Internal Server Error

## 🚨 **Your Error Analysis**
You're getting a **500 Internal Server Error** when Supabase tries to send the recovery email. This is a server-side configuration issue, not a code problem.

## 🔧 **Immediate Fixes Required**

### 1. **Check Email Template Configuration**
The most common cause of 500 errors is an invalid email template.

**Go to Supabase Dashboard → Authentication → Email Templates → Reset Password**

**❌ WRONG Template (causes 500 error):**
```html
<a href="{{ .SiteURL }}/reset-password?{{ .TokenHash }}&type=recovery">
```

**✅ CORRECT Template:**
```html
<a href="{{ .ConfirmationURL }}">Reset Your Password</a>
```

**Complete Fixed Template:**
```html
<h2>Reset Your Password</h2>

<p>Hi there,</p>

<p>You recently requested to reset your password for your Parscade account. Click the button below to reset it.</p>

<p><a href="{{ .ConfirmationURL }}" 
   style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
   Reset Your Password
</a></p>

<p><strong>This link will expire in 24 hours.</strong></p>

<p>If you didn't request a password reset, please ignore this email.</p>

<p>Thanks,<br>
The Parscade Team</p>

<hr>
<p style="font-size: 12px; color: #666;">
If the button above doesn't work, copy and paste this link into your browser:<br>
{{ .ConfirmationURL }}
</p>
```

### 2. **Verify Site URL Configuration**
**Go to Supabase Dashboard → Authentication → Settings**

Based on your error URL, set:
```
Site URL: https://parscade-o4i365.js.org
```

### 3. **Add Redirect URLs**
**In the same Settings page, add to Redirect URLs:**
```
https://parscade-o4i365.js.org/reset-password
https://parscade-o4i365.js.org/
```

### 4. **Check SMTP Configuration**
**Go to Authentication → Settings → SMTP Settings**

**If you see "Use Supabase SMTP" or no SMTP configured:**
- This might be causing the 500 error
- Set up custom SMTP (recommended)

**Quick SMTP Setup with Gmail:**
```
Enable Custom SMTP: ON
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password (not regular password!)
SMTP Admin Email: your-email@gmail.com
SMTP Sender Name: Parscade
```

**To get Gmail App Password:**
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate new
4. Use that password in SMTP settings

### 5. **Alternative SMTP Providers**

**SendGrid (Recommended for production):**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: [Your SendGrid API Key]
SMTP Admin Email: noreply@parscade.com
```

**Mailgun:**
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: [Your Mailgun SMTP username]
SMTP Pass: [Your Mailgun SMTP password]
```

## 🔍 **Diagnostic Steps**

### Step 1: Test Email Template
1. Go to Email Templates
2. Click "Reset Password"
3. Use the "Send Test Email" button
4. If this fails with 500 error, the template is wrong

### Step 2: Test SMTP Configuration
1. Go to SMTP Settings
2. Click "Send Test Email"
3. If this fails, SMTP configuration is wrong

### Step 3: Check Supabase Logs
1. Go to Supabase Dashboard
2. Logs → Auth Logs
3. Look for detailed error messages about email sending

## 🚀 **Quick Fix Checklist**

1. ✅ **Update email template** to use `{{ .ConfirmationURL }}`
2. ✅ **Set correct Site URL**: `https://parscade-o4i365.js.org`
3. ✅ **Add redirect URL**: `https://parscade-o4i365.js.org/reset-password`
4. ✅ **Configure SMTP** (Gmail/SendGrid/Mailgun)
5. ✅ **Test with "Send Test Email"** button
6. ✅ **Try password reset** again

## 🐛 **If Still Getting 500 Error**

### Check These Common Issues:

1. **Invalid Template Variables**: Make sure you're only using valid Supabase template variables
2. **SMTP Authentication**: Verify SMTP credentials are correct
3. **Email Provider Limits**: Some providers have daily sending limits
4. **Supabase Service Issues**: Check https://status.supabase.com/

### Enable Better Error Logging:
Add this to your reset password function to get more details:

```javascript
try {
  await resetPassword(email);
} catch (error) {
  console.error('Detailed error:', {
    name: error?.name,
    message: error?.message,
    status: error?.status,
    details: error?.details,
    stack: error?.stack?.split('\n').slice(0, 3)
  });
}
```

## 📧 **Test Email Delivery**

After making changes:

1. **Wait 2-3 minutes** for Supabase to update
2. Try password reset with a real email address
3. Check spam/junk folder
4. Look for detailed error logs in browser console

## 🆘 **Emergency Workaround**

If emails still don't work, you can temporarily:
1. Use a different email provider
2. Set up a webhook to handle password resets
3. Contact Supabase support with your project reference

The 500 error almost always indicates a configuration issue on the Supabase side, not your application code.