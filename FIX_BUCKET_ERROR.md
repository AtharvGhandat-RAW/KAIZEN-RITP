# 🆘 QUICK FIX GUIDE - Storage Bucket Error

## ❌ Current Error
```
Upload error: StorageApiError: Bucket not found
```

## ✅ Root Cause
Migration SQL hasn't been executed in Supabase → `proof-uploads` bucket doesn't exist

## 🚀 Fix in 2 Minutes

### **Option 1: Full Migration (Recommended)**

**1️⃣ Go to Supabase Dashboard**
- URL: https://app.supabase.com
- Login with your credentials
- Select project: **KAIZEN-RITP**

**2️⃣ Open SQL Editor**
- Left sidebar → **"SQL Editor"**
- Click **"New Query"** button
- Blank editor appears

**3️⃣ Copy Full Migration**
- Open file: `supabase/migrations/20250126_add_proof_uploads.sql`
- Copy ALL content (219 lines)
- Paste into SQL editor

**4️⃣ Execute**
- Click **"Run"** button (⏵ play icon)
- Wait for "Query executed successfully"

**5️⃣ Verify**
- Go to **"Storage"** section (left sidebar)
- Confirm you see **"proof-uploads"** bucket
- ✅ Done!

---

### **Option 2: Quick Bucket Creation (If Option 1 Fails)**

**If the full migration fails**, try just creating the bucket:

**1️⃣ Go to Supabase SQL Editor** (same as above)

**2️⃣ Copy This SQL**
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-uploads', 'proof-uploads', false)
ON CONFLICT (id) DO NOTHING;
```

**3️⃣ Execute** → Run button

**4️⃣ Create RLS Policy**
```sql
-- Allow uploads
CREATE POLICY "Anyone can upload proofs"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'proof-uploads');
```

**5️⃣ Verify** → Go to Storage, check for bucket

---

## 🔍 Verify Success

### Check in Supabase Dashboard:
1. Click **"Storage"** (left sidebar)
2. Look for **"proof-uploads"** bucket
3. Should show: Private bucket, 0 objects

### Check in Your App:
1. Refresh browser
2. Go to `/fest-registration`
3. Try uploading a file
4. Should work now! ✅

---

## ❌ Still Getting Error?

### If bucket still not found:

**1. Check Supabase Project**
- Are you in the correct project?
- Is the project active/not paused?

**2. Check SQL Execution**
- Did you see "Query executed successfully"?
- Or did you see errors?

**3. Manual Verification**
Run this query in SQL Editor:
```sql
SELECT id, name, public FROM storage.buckets;
```
Look for `proof-uploads` in results.

**4. Refresh Your App**
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Wait 30 seconds
- Try upload again

---

## 📋 Complete Checklist

Before claiming success:

- [ ] Logged into Supabase dashboard
- [ ] Selected correct project (KAIZEN-RITP)
- [ ] Opened SQL Editor
- [ ] Pasted migration SQL
- [ ] Clicked Run
- [ ] Saw "Query executed successfully"
- [ ] Went to Storage section
- [ ] Saw "proof-uploads" bucket
- [ ] Refreshed browser
- [ ] Tried uploading file
- [ ] File uploaded without "Bucket not found" error

---

## 🎯 Expected Result After Fix

✅ No more "StorageApiError: Bucket not found"  
✅ File upload should work  
✅ Admin can view uploaded proofs  
✅ Payment proof system functional  

---

## ⏱️ Time Required
- Full migration: **3-5 minutes**
- Quick bucket creation: **1-2 minutes**
- Testing: **2-3 minutes**
- **Total: ~5-10 minutes**

---

## 💡 Pro Tips

1. **Copy entire migration** - Don't try to run it in chunks
2. **One query at a time** - Run full migration, not individual sections
3. **Wait for completion** - See "Query executed successfully" before proceeding
4. **Clear browser cache** - If still issues, do hard refresh
5. **Check permissions** - Make sure logged-in user is project owner/admin

---

## 🆘 Need Help?

**If migration fails**, you'll see an error message. Common errors:

1. **"relation does not exist"** → Tables not created yet (normal, create them)
2. **"column already exists"** → Column was added before (safe to ignore)
3. **"bucket already exists"** → Bucket created (good!)
4. **"function already exists"** → Function created (good!)

**All errors are non-fatal** - the migration is idempotent (safe to re-run).

---

**🚀 Ready? Start with Option 1 above!**

Once done, refresh your app and try uploading a proof file. It should work!
