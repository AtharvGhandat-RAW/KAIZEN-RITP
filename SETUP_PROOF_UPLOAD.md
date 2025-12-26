# Setup Guide: Payment Proof Upload System

## Quick Start

This guide walks you through setting up the payment proof upload and verification system.

### Prerequisites
- Supabase project already set up
- Admin access to Supabase dashboard
- Access to the application's admin dashboard

---

## Step 1: Deploy Database Migration

### Via Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to `https://app.supabase.com`
   - Select your project
   - Go to **SQL Editor**

2. **Create New Query**
   - Click **New Query**
   - Copy the entire contents of: [`supabase/migrations/20250126_add_proof_uploads.sql`](./supabase/migrations/20250126_add_proof_uploads.sql)

3. **Execute Migration**
   - Paste the SQL into the editor
   - Click **Run** button
   - Wait for success confirmation

### Via Database Client (Alternative)

```bash
# Using supabase CLI (if installed)
supabase db push
```

---

## Step 2: Verify Migration

In Supabase Dashboard, verify the following:

### Check Tables
1. Go to **Table Editor**
2. Verify these tables exist:
   - ✅ `proof_uploads` - New table for storing proof records
   - ✅ `registrations` - Should have new `proof_status` column

### Check Columns in `registrations`
The `registrations` table should have:
- `proof_status` (TEXT): pending, approved, rejected, not_required

### Check Storage Bucket
1. Go to **Storage**
2. Verify bucket exists:
   - ✅ `proof-uploads` - Private bucket for proof files

### Check RLS Policies
1. Go to **Auth** → **Policies**
2. Verify policies for `proof_uploads`:
   - ✅ Anyone can upload
   - ✅ Admins can update
   - ✅ Anyone can view

---

## Step 3: Deploy Application Code

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Install dependencies** (if needed)
   ```bash
   npm install
   # or
   bun install
   ```

3. **Build the application**
   ```bash
   npm run build
   # or
   bun run build
   ```

4. **Deploy to your hosting**
   - Vercel, Netlify, or your preferred platform
   - No special environment variables needed

---

## Step 4: Test the System

### Test User Registration Flow

1. **Navigate to Registration Page**
   - Go to `/fest-registration`
   - Fill in all required fields

2. **Upload Test Proof**
   - Click "Upload Payment Proof" section
   - Select an image or PDF file (< 5MB)
   - Verify file appears in upload section

3. **Submit Registration**
   - Click "Submit Registration"
   - Wait for success message
   - Note the confirmation message

### Test Admin Verification

1. **Login as Admin**
   - Navigate to `/admin`
   - Login with admin credentials

2. **Access Festival Management**
   - Go to `/admin/fest-management`
   - Click **"Proof Verification"** tab

3. **Review Proof**
   - Filter by **"Pending"** status
   - Click **"Review"** button on a proof
   - Verify user information displays
   - Verify proof preview shows

4. **Test Approval**
   - Add optional notes
   - Click **"Approve"** button
   - Verify status changes to "Approved" (green badge)

5. **Test Rejection** (Optional)
   - Click another **"Review"** button
   - Add rejection reason in notes
   - Click **"Reject"** button
   - Verify status changes to "Rejected" (red badge)

---

## Step 5: Configure Settings (Optional)

### Set Payment UPI Details

Go to **Admin Dashboard** → **Settings** and configure:

- **UPI ID** (`fest_upi_id`): Payment receiving UPI ID
- **QR Code URL** (`fest_qr_code_url`): URL to payment QR code image

These will display on the registration page.

### Enable/Disable Registration

Create settings:
- **Key**: `registration_enabled`
- **Value**: `true` or `false`

---

## File Locations

| File | Purpose |
|------|---------|
| [supabase/migrations/20250126_add_proof_uploads.sql](./supabase/migrations/20250126_add_proof_uploads.sql) | Database schema and function |
| [src/pages/FestRegistration.tsx](./src/pages/FestRegistration.tsx) | User registration form with proof upload |
| [src/components/admin/ProofVerificationPanel.tsx](./src/components/admin/ProofVerificationPanel.tsx) | Admin proof review interface |
| [src/pages/admin/FestManagement.tsx](./src/pages/admin/FestManagement.tsx) | Fest management dashboard |
| [PROOF_UPLOAD_SYSTEM.md](./PROOF_UPLOAD_SYSTEM.md) | Full technical documentation |

---

## Troubleshooting

### Issue: "Could not find function public.register_fest_user"

**Cause**: Migration hasn't been executed  
**Fix**:
1. Go to Supabase SQL Editor
2. Re-run the migration SQL
3. Verify in **Functions** → **Database Functions**

### Issue: "Storage bucket not found"

**Cause**: Bucket creation failed  
**Fix**:
1. Go to Storage in Supabase
2. Manually create bucket named `proof-uploads`
3. Set to **Private**

### Issue: File upload fails

**Cause**: Could be multiple reasons  
**Check**:
- [ ] File size < 5MB?
- [ ] File type is image or PDF?
- [ ] Storage bucket exists?
- [ ] RLS policies configured?

### Issue: Admin can't approve proofs

**Cause**: User doesn't have admin role  
**Fix**:
1. Check `user_roles` table
2. Add role: `super_admin` or `event_manager`
3. Verify `is_admin()` function works

---

## Usage Tips

### For End Users
- ✅ Upload proof immediately after payment
- ✅ Use clear, legible screenshots
- ✅ Include transaction ID if visible
- ✅ Wait for verification email

### For Admins
- ✅ Review proofs daily
- ✅ Add helpful notes for rejected proofs
- ✅ Download file if needed for records
- ✅ Track approval metrics

---

## Security Checklist

- [x] RLS policies configured
- [x] Storage bucket is private
- [x] Only admins can approve/reject
- [x] File size limited
- [x] File type validated
- [x] Audit trail with timestamps

---

## Next Steps

1. **Enable Email Notifications** (Optional)
   - Setup Supabase Functions to email users on approval
   - Send rejection reason to users

2. **Analytics** (Optional)
   - Track approval rate
   - Monitor average verification time
   - Generate reports

3. **Bulk Operations** (Optional)
   - Add batch approval feature
   - Export proofs as CSV

---

## Support & Documentation

For more details, see:
- [PROOF_UPLOAD_SYSTEM.md](./PROOF_UPLOAD_SYSTEM.md) - Technical documentation
- [Supabase Docs](https://supabase.com/docs) - Database and storage guides
- [React Query Docs](https://tanstack.com/query/latest) - Data fetching

---

**Setup Complete!** 🎉

Your payment proof upload and verification system is ready. Start accepting registrations with proof uploads!
