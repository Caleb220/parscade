# DEBUG: Supabase Reset Password Configuration

## 🚨 **Your Current Issue**

Based on your error logs, Supabase is redirecting you to your reset-password page but **without the necessary tokens**. This is a configuration issue.

## 🔧 **CRITICAL Supabase Settings to Check**

### **1. Site URL Configuration**
Go to Supabase Dashboard → Authentication → Settings

**Set Site URL to:**
```
https://parscade.com
```
(Must match exactly where your app is hosted)

### **2. Redirect URLs Configuration**
Add these to your Redirect URLs list:
```
https://parscade.com/reset-password
https://parscade.com/
http://localhost:5173/reset-password
http://localhost:5173/
```

### **3. Email Template Fix (CRITICAL)**
Go to Authentication → Email Templates → Reset Password

**❌ WRONG (causes token issues):**
```html
<a href="{{ .SiteURL }}/reset-password?{{ .TokenHash }}&type=recovery">
```

**✅ CORRECT:**
```html
<a href="{{ .ConfirmationURL }}">Reset Your Password</a>
```

**Complete working template:**
```html
<h2>Reset Your Password</h2>
<p>Click the button below to reset your password:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
    Reset Password
  </a>
</p>
<p>This link expires in 24 hours.</p>
<p>If you didn't request this, please ignore this email.</p>
```

## 🔍 **What's Happening**

1. **You request reset** → Email sent ✅
2. **You click email link** → Redirects to your site ✅  
3. **Tokens missing** → Reset page shows "Invalid" ❌

This means Supabase is redirecting but not including the auth tokens.

## 🚀 **Testing Steps**

After updating Supabase settings:

1. **Wait 3-5 minutes** for Supabase to update
2. **Request new reset email**
3. **Check email link format** - should be different now
4. **Try reset flow again**

## 💡 **Quick Diagnostic**

Add this to your browser console when on the reset-password page:
```javascript
console.log('Full URL:', window.location.href);
console.log('Has tokens:', window.location.href.includes('access_token') || window.location.hash.includes('access_token'));
```

The URL should contain `access_token` or similar tokens for the reset to work.

## ⚡ **Most Common Fix**

**99% of the time this is fixed by updating the email template to use `{{ .ConfirmationURL }}`** instead of manually constructing the URL.