# Debug Reset Password Email Issues

If you're not receiving password reset emails, follow this systematic debugging guide:

## 1. **Check Supabase Logs First**
1. Go to your Supabase Dashboard
2. Navigate to **Logs** in the sidebar
3. Look for recent entries related to email sending
4. Check for any error messages or warnings

## 2. **Verify Email Address**
- Make sure the email address is **exactly** as registered in your account
- Check if the user exists: Go to **Authentication → Users** in Supabase dashboard
- Try with a different email address that you know is registered

## 3. **Check Your Email**
- **Inbox**: Look for emails from your Supabase project
- **Spam/Junk folder**: Check thoroughly
- **Promotions tab**: If using Gmail, check the Promotions tab
- **Wait 5-10 minutes**: Sometimes emails are delayed

## 4. **Supabase Configuration Check**

### Authentication Settings
```
Site URL: http://localhost:5173 (for development)
Redirect URLs: 
- http://localhost:5173/reset-password
- http://localhost:5173/
```

### Email Template Check
1. Go to **Authentication → Email Templates → Reset Password**
2. Verify the template contains: `{{ .SiteURL }}/reset-password?{{ .TokenHash }}&type=recovery`
3. Make sure the template is enabled

## 5. **SMTP Configuration Issues**

### Using Supabase Default SMTP
- Supabase's default SMTP has rate limits and may not be reliable
- Default SMTP often gets flagged as spam
- **Recommendation**: Set up custom SMTP

### Set Up Custom SMTP (Recommended)
Go to **Authentication → Settings → SMTP Settings**:

**Gmail SMTP Example:**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your-email@gmail.com
SMTP Pass: your-app-password (not regular password)
SMTP Admin Email: your-email@gmail.com
SMTP Sender Name: Your App Name
```

**SendGrid Example:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Pass: YOUR_SENDGRID_API_KEY
SMTP Admin Email: noreply@yourdomain.com
SMTP Sender Name: Your App Name
```

## 6. **Rate Limiting Check**
- Supabase has rate limits on email sending
- Try waiting 5-10 minutes between attempts
- Check if you've exceeded daily email limits

## 7. **Debug Steps with Console Logs**

The updated code now includes debug logging. Check your browser console for:
- `🔄 Attempting password reset for: email@example.com`
- `✅ Password reset email request completed successfully`
- `❌ Supabase reset password error:` (if there's an error)

## 8. **Test with Supabase API Directly**

You can test the reset password API directly:

```javascript
// Open browser console on your site and run:
const { data, error } = await supabase.auth.resetPasswordForEmail('your-email@example.com', {
  redirectTo: `${window.location.origin}/reset-password`
});
console.log('Data:', data);
console.log('Error:', error);
```

## 9. **Common Issues & Solutions**

### Issue: "Invalid email" error
**Solution**: Make sure the email format is correct and the user exists

### Issue: "Email rate limit exceeded"
**Solution**: Wait 5-10 minutes, then try again

### Issue: "Invalid redirect URL"
**Solution**: Check that your redirect URLs in Supabase match exactly

### Issue: Emails go to spam
**Solution**: Set up custom SMTP with a verified domain

### Issue: "User not found"
**Solution**: The email address might not be registered. Create account first.

## 10. **Production Checklist**

Before going to production:
- ✅ Custom SMTP configured and tested
- ✅ Domain verification completed
- ✅ SPF/DKIM records set up
- ✅ Test with multiple email providers
- ✅ Monitor email delivery rates

## 11. **Alternative Testing Method**

If emails still don't work, you can test the reset flow by manually creating a reset URL:

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user and copy the User ID
3. Create a password reset link manually for testing (not for production)

## Still Not Working?

If none of the above works:
1. **Check Supabase Status**: Visit https://status.supabase.com/
2. **Try Different Email Provider**: Test with Gmail, Outlook, etc.
3. **Contact Supabase Support**: Provide your project ID and error details
4. **Use Alternative Method**: Implement SMS-based reset or admin-assisted reset

## Debug Output

The forgot password page now shows debug information in development mode. Use this to see:
- What email address is being sent
- Whether the request succeeds or fails
- Detailed error messages
- Network request information

This should help you identify exactly where the issue is occurring.