# 🚀 KAIZEN Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. **Connect Repository**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub/GitLab repository
   - Vercel auto-detects Vite configuration

2. **Environment Variables**
   Add these in Vercel dashboard → Settings → Environment Variables:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

### Option 2: Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start)

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository

2. **Build Settings** (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Environment Variables**
   Add in Site Settings → Environment Variables

---

## Pre-Deployment Checklist

### 1. Environment Setup ✅
- [ ] Copy `.env.example` to `.env.local`
- [ ] Fill in Supabase credentials
- [ ] Set `NODE_ENV=production`

### 2. Supabase Configuration ✅
- [ ] Enable Row Level Security (RLS) on all tables
- [ ] Test all RLS policies
- [ ] Set up database backups
- [ ] Configure authentication providers
- [ ] Set up email templates

### 3. Build Verification ✅
```bash
# Run production build locally
npm run build

# Preview production build
npm run preview
```

### 4. Performance Check ✅
- [ ] Run Lighthouse audit (aim for 90+ scores)
- [ ] Test on mobile devices
- [ ] Check Core Web Vitals
- [ ] Verify lazy loading works

### 5. Security Verification ✅
- [ ] No sensitive data in client code
- [ ] HTTPS only
- [ ] Security headers configured
- [ ] Admin routes protected

---

## Custom Domain Setup

### Vercel
1. Go to Project Settings → Domains
2. Add your domain (e.g., `kaizen.rit.edu`)
3. Update DNS records:
   - CNAME: `www` → `cname.vercel-dns.com`
   - A: `@` → `76.76.19.19`

### Netlify
1. Go to Site Settings → Domain Management
2. Add custom domain
3. Update DNS records as shown

### SSL Certificate
- Both platforms provide free SSL automatically
- Ensure HTTPS is enforced

---

## Post-Deployment

### 1. Verify Deployment
- [ ] Visit production URL
- [ ] Test registration flow
- [ ] Test admin login
- [ ] Check all pages load correctly
- [ ] Verify mobile responsiveness

### 2. Monitor Performance
- [ ] Set up Vercel/Netlify Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Monitor Core Web Vitals

### 3. SEO Verification
- [ ] Submit sitemap to Google Search Console
- [ ] Verify robots.txt is accessible
- [ ] Test social sharing previews

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `VITE_GA_MEASUREMENT_ID` | ❌ | Google Analytics 4 ID |
| `VITE_SENTRY_DSN` | ❌ | Sentry error tracking |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ❌ | Stripe payments |

---

## Rollback Procedure

### Vercel
1. Go to Deployments tab
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Netlify
1. Go to Deploys tab
2. Find previous deployment
3. Click "Publish deploy"

---

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Supabase Docs**: https://supabase.com/docs
- **Vite Docs**: https://vitejs.dev

---

## Common Issues & Solutions

### Build Fails
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Environment Variables Not Loading
- Ensure variables start with `VITE_`
- Redeploy after adding variables
- Check for typos in variable names

### 404 on Page Refresh
- Verify SPA rewrites are configured
- Check `vercel.json` or `netlify.toml`

### Images Not Loading
- Check image paths are relative to public folder
- Verify CDN configuration if using external CDN
