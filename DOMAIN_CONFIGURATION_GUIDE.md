# Domain Configuration Guide for Supabase Reset Password

## 🔍 **Current Situation Analysis**

You mentioned your domain is `https://parscade.com`, but the app is currently accessible at `https://parscade-o4i365.js.org`. Here are the possible scenarios and solutions:

## 📋 **Scenario 1: parscade.com is Your Main Domain**

If `https://parscade.com` is your actual domain and should be working:

### **Check Domain Status:**
1. Visit `https://parscade.com` in your browser
2. Does it redirect to `https://parscade-o4i365.js.org`?
3. Does it show your app directly?
4. Does it show an error or blank page?

### **If parscade.com Works Correctly:**
**Update Supabase Settings:**
- Site URL: `https://parscade.com`
- Redirect URLs: 
  ```
  https://parscade.com/reset-password
  https://parscade.com/
  http://localhost:5173/reset-password (for dev)
  ```

## 📋 **Scenario 2: Temporary Hosting Situation**

If you're currently using `parscade-o4i365.js.org` temporarily while setting up `parscade.com`:

### **For Current Temporary Domain:**
**Update Supabase Settings to:**
- Site URL: `https://parscade-o4i365.js.org`
- Redirect URLs:
  ```
  https://parscade-o4i365.js.org/reset-password
  https://parscade-o4i365.js.org/
  ```

### **When You Switch to parscade.com:**
Update Supabase settings again to use the new domain.

## 🔧 **Quick Diagnosis Steps**

### **Step 1: Test Your Domain**
```bash
# In terminal or browser console
fetch('https://parscade.com')
  .then(response => console.log('parscade.com status:', response.status))
  .catch(error => console.log('parscade.com error:', error));

fetch('https://parscade-o4i365.js.org')
  .then(response => console.log('js.org status:', response.status))
  .catch(error => console.log('js.org error:', error));
```

### **Step 2: Check Current App Location**
1. Open your app
2. Look at the URL bar - which domain is actually showing?
3. That's the domain you should use in Supabase settings

## 🚀 **Recommended Fix Process**

### **Option A: If parscade.com is working**
1. **Update Supabase Site URL** to `https://parscade.com`
2. **Update Redirect URLs** to include `https://parscade.com/reset-password`
3. **Test reset password** flow

### **Option B: If using temporary domain**
1. **Update Supabase Site URL** to `https://parscade-o4i365.js.org`
2. **Update Redirect URLs** to include `https://parscade-o4i365.js.org/reset-password`
3. **Plan migration** to parscade.com later

## 🔍 **Current URL Detection**

I've updated the code to automatically use `window.location.origin` for the redirect URL, which means:
- If accessed via `https://parscade.com` → uses `https://parscade.com/reset-password`
- If accessed via `https://parscade-o4i365.js.org` → uses `https://parscade-o4i365.js.org/reset-password`

## ⚡ **Immediate Action**

**Right now, do this:**

1. **Check which URL your app actually loads at** (look at browser address bar)
2. **Use THAT domain** in your Supabase Site URL setting
3. **Make sure Redirect URLs match**

For example:
- If your app loads at `https://parscade.com` → use `https://parscade.com` in Supabase
- If your app loads at `https://parscade-o4i365.js.org` → use `https://parscade-o4i365.js.org` in Supabase

The key is **consistency** - whatever domain your users actually access the app from should match the Supabase configuration exactly.

## 🛠️ **Domain Setup Issues?**

If `parscade.com` should work but doesn't:
1. **Check DNS settings** - does parscade.com point to your hosting?
2. **Check hosting configuration** - is the site deployed to parscade.com?
3. **Check SSL certificate** - is HTTPS working on parscade.com?

Let me know which domain actually works when you visit your app, and I'll help you configure Supabase correctly!