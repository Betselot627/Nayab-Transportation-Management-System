# Deployment Guide - Nayab Transportation Management System

## Current Deployment

- **Frontend:** https://nayab-transportation-management-sys.vercel.app (Vercel)
- **Backend:** https://nayab-transportation-management-system-2.onrender.com (Render)

---

## Backend Deployment (Render)

### Environment Variables to Set on Render:

1. **Database:**

   ```
   MONGO_URI=mongodb+srv://betsi:vBITkgSJCwKrl4NV@cluster0.rzdwmpx.mongodb.net/ntms?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **Server:**

   ```
   PORT=5000
   NODE_ENV=production
   ```

3. **JWT:**

   ```
   JWT_SECRET=ntms_secure_jwt_secret_key_2024_change_this_in_production
   JWT_EXPIRE=30d
   ```

4. **CORS - IMPORTANT:**

   ```
   FRONTEND_URL=https://nayab-transportation-management-sys.vercel.app
   ```

5. **Cloudinary (if using file uploads):**
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Steps to Update Render:

1. Go to your Render dashboard
2. Select your backend service
3. Go to **Environment** tab
4. Add/Update these environment variables
5. Click **Save Changes**
6. Service will auto-redeploy

---

## Frontend Deployment (Vercel)

### Environment Variables to Set on Vercel:

1. **API URL:**
   ```
   VITE_API_URL=https://nayab-transportation-management-system-2.onrender.com/api
   ```

### Steps to Update Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the variable above
5. Go to **Deployments**
6. Click **...** on latest deployment → **Redeploy**

---

## Quick Fix - Backend CORS Update

The backend code has been updated to allow multiple origins:

```javascript
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    "https://nayab-transportation-management-sys.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
```

**Action Required:** Push this change to your Git repository and Render will auto-deploy.

---

## Deployment Checklist

### ✅ Backend (Render)

- [ ] Environment variables set
- [ ] `FRONTEND_URL` points to Vercel URL
- [ ] `NODE_ENV=production`
- [ ] MongoDB connection working
- [ ] Service is running
- [ ] Check logs for errors

### ✅ Frontend (Vercel)

- [ ] `VITE_API_URL` points to Render backend
- [ ] Environment variable saved
- [ ] Redeployed after setting env var
- [ ] Check browser console for errors
- [ ] Test API calls

---

## Testing the Connection

### 1. Test Backend is Running

```bash
curl https://nayab-transportation-management-system-2.onrender.com
```

Should return:

```json
{
  "message": "Nayab Transportation Management System API",
  "version": "1.0.0",
  "status": "Running"
}
```

### 2. Test Frontend Can Reach Backend

Open browser console on your Vercel site and run:

```javascript
fetch(
  "https://nayab-transportation-management-system-2.onrender.com/api/auth/me",
)
  .then((r) => r.json())
  .then(console.log);
```

### 3. Test Login Flow

- Go to your Vercel URL
- Try to login with test credentials
- Check browser Network tab for API calls
- Should see requests to your Render backend

---

## Common Issues & Solutions

### Issue 1: CORS Error

**Symptom:** "Access to fetch blocked by CORS policy"

**Solution:**

1. Add Vercel URL to Render environment variables: `FRONTEND_URL=https://nayab-transportation-management-sys.vercel.app`
2. Redeploy backend
3. Clear browser cache

---

### Issue 2: 404 on API Calls

**Symptom:** API calls return 404

**Solution:**

1. Verify `VITE_API_URL` includes `/api` at the end
2. Should be: `https://nayab-transportation-management-system-2.onrender.com/api`
3. Redeploy frontend after fixing

---

### Issue 3: Environment Variables Not Working

**Symptom:** Still using localhost URLs

**Solution - Vercel:**

1. Go to Settings → Environment Variables
2. Make sure variable name is exactly `VITE_API_URL` (case-sensitive)
3. Add to Production environment
4. Redeploy from Deployments tab

**Solution - Render:**

1. Go to Environment tab
2. Click "Add Environment Variable"
3. Enter key-value pairs
4. Save and wait for auto-redeploy

---

### Issue 4: Backend Sleeping (Render Free Tier)

**Symptom:** First request takes 30+ seconds

**Solution:**

- Render free tier spins down after 15 minutes of inactivity
- First request wakes it up (slow)
- Subsequent requests are fast
- Consider upgrading to paid tier for always-on service

**Workaround:**

- Use a cron job or uptime monitor to ping your backend every 10 minutes
- Example: https://uptimerobot.com (free)

---

## Git Push Workflow

After making changes:

```bash
# Commit backend changes
cd backend
git add .
git commit -m "Update CORS configuration for production"

# Commit frontend changes
cd ../frontend
git add .
git commit -m "Update API URL for production"

# Push to main branch
git push origin main
```

Both Vercel and Render will auto-deploy when you push to your connected repository.

---

## Security Notes for Production

### ⚠️ IMPORTANT: Change These Before Production

1. **JWT_SECRET**: Generate a strong random secret

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **MongoDB**: Create production database user with limited permissions

3. **CORS**: Restrict to only your frontend domain (remove localhost URLs)

4. **Rate Limiting**: Already configured in server.js (100 requests per 10 min)

5. **Environment Variables**: Never commit `.env` files to Git

---

## Monitoring & Debugging

### Backend Logs (Render)

1. Go to Render dashboard
2. Click on your service
3. View **Logs** tab
4. Look for startup messages and errors

### Frontend Console (Vercel)

1. Open your Vercel site
2. Open browser DevTools (F12)
3. Check Console tab for errors
4. Check Network tab for API call failures

---

## Render Configuration File

Create `render.yaml` in your project root for easier deployment:

```yaml
services:
  - type: web
    name: ntms-backend
    env: node
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: FRONTEND_URL
        value: https://nayab-transportation-management-sys.vercel.app
      - key: MONGO_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_EXPIRE
        value: 30d
```

---

## Support & Troubleshooting

If issues persist:

1. **Check Render Logs:**
   - Render Dashboard → Your Service → Logs
   - Look for startup errors or crash messages

2. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Deployments → Function Logs

3. **Test API Directly:**

   ```bash
   curl -X POST https://nayab-transportation-management-system-2.onrender.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123"}'
   ```

4. **Browser Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try login
   - Look at request/response details

---

## Quick Commands

### Test Backend Health

```bash
curl https://nayab-transportation-management-system-2.onrender.com
```

### Test Backend API

```bash
curl https://nayab-transportation-management-system-2.onrender.com/api
```

### Check Frontend Env Variables (in browser console)

```javascript
console.log(import.meta.env.VITE_API_URL);
```

---

## Next Steps

1. ✅ Push updated backend code to Git
2. ✅ Verify Render auto-deploys
3. ✅ Set environment variables on Render
4. ✅ Set environment variables on Vercel
5. ✅ Redeploy Vercel frontend
6. ✅ Test login on production site
7. ✅ Monitor logs for any errors

---

## Contact & Support

- **Frontend URL:** https://nayab-transportation-management-sys.vercel.app
- **Backend URL:** https://nayab-transportation-management-system-2.onrender.com
- **API Docs:** /api endpoint on backend

**Deployment Status:** ✅ Ready to Deploy
