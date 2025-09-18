# CRITICAL: Supabase URL Configuration Fix

## 🚨 **Your Issue Identified**

The reset password URL shows:
```
redirect_to=https://parscade.com/reset-password
```

But your app is actually hosted at:
```
https://parscade-o4i365.js.org
```

This URL mismatch is causing the "Invalid or expired password reset link" error.

## 🔧 **IMMEDIATE FIXES REQUIRED**

### 1. **Update Supabase Site URL**
Go to your Supabase Dashboard → Authentication → Settings

**Change Site URL from:**
```
https://parscade.com
```

**To:**
```
https://parscade-o4i365.js.org
```

### 2. **Update Redirect URLs**
In the same settings page, update your Redirect URLs list:

**Remove:**
```
https://parscade.com/reset-password
```

**Add:**
```
https://parscade-o4i365.js.org/reset-password
https://parscade-o4i365.js.org/
```

For development, also add:
```
http://localhost:5173/reset-password
http://localhost:5173/
```

### 3. **Clear Supabase Auth Cache**
After making these changes:
1. Wait 2-3 minutes for Supabase to propagate the changes
2. Clear your browser cache/cookies for the site
3. Try the password reset flow again

## 🔍 **Why This Happens**

1. Supabase generates reset links using the configured Site URL
2. When you click the link, Supabase validates the redirect URL
3. If there's a mismatch, it rejects the token as "invalid"
4. Your configured Site URL must match your actual domain

## 📋 **Verification Steps**

After updating Supabase settings:

1. **Test Password Reset Request**: 
   - Go to `/forgot-password`
   - Enter your email
   - Check the reset link in the email

2. **Verify URL Format**:
   The reset email should now contain:
   ```
   redirect_to=https://parscade-o4i365.js.org/reset-password
   ```

3. **Test Reset Flow**:
   - Click the reset link from email
   - Should redirect to your reset password page
   - Complete the password change

## ⚡ **Quick Fix Summary**

1. ✅ **Update Site URL** in Supabase to match your actual domain
2. ✅ **Update Redirect URLs** to include your reset-password path  
3. ✅ **Wait 2-3 minutes** for changes to propagate
4. ✅ **Clear browser cache** before testing
5. ✅ **Test the complete flow** from forgot password to reset

This should resolve the "Invalid or expired password reset link" error immediately!

## 🛠️ **Additional Notes**

- The code now dynamically uses the correct redirect URL based on environment
- Enhanced token validation handles multiple URL formats from Supabase
- Better error logging to diagnose future issues

After making these Supabase configuration changes, your reset password flow should work perfectly!