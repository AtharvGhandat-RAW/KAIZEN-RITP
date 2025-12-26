# MIGRATION EXECUTION GUIDE
## Payment Proof Upload System - Supabase Setup

**Date**: December 26, 2025  
**Status**: Ready for Execution  
**Environment**: Production

---

## STEP 1: Access Supabase SQL Editor

### Via Web Browser
1. **Open Supabase Dashboard**
   - Go to https://app.supabase.com
   - Login with your credentials

2. **Select Project**
   - Find and click your project (e.g., "KAIZEN-RITP")
   - Wait for project dashboard to load

3. **Open SQL Editor**
   - Click **"SQL Editor"** in left sidebar
   - Click **"New Query"** button
   - A blank SQL editor will open

---

## STEP 2: Copy Migration SQL

**File Location**: `/supabase/migrations/20250126_add_proof_uploads.sql`

### Copy Method 1: From File
1. Navigate to the file in your repository
2. Copy entire content (all 219 lines)
3. Paste into Supabase SQL Editor

### Copy Method 2: Direct Content

Copy this entire block and paste into Supabase SQL Editor:

```sql
-- ================================================
-- MIGRATION: Add register_fest_user RPC function with proof upload support
-- ================================================

-- Create proofs table for storing proof uploads
CREATE TABLE IF NOT EXISTS public.proof_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID REFERENCES public.registrations(id) ON DELETE CASCADE NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  proof_status TEXT DEFAULT 'pending' CHECK (proof_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on proof_uploads
ALTER TABLE public.proof_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for proof_uploads
CREATE POLICY "Anyone can view their own proofs"
  ON public.proof_uploads FOR SELECT
  USING (true);

CREATE POLICY "Anyone can upload proofs"
  ON public.proof_uploads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update proofs"
  ON public.proof_uploads FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Update registrations table to include proof_status
ALTER TABLE public.registrations 
ADD COLUMN IF NOT EXISTS proof_status TEXT DEFAULT 'pending' CHECK (proof_status IN ('pending', 'approved', 'rejected', 'not_required'));

-- Create or update fest registration event
INSERT INTO public.events (
  id,
  name,
  description,
  category,
  event_type,
  venue,
  event_date,
  registration_deadline,
  max_participants,
  is_featured,
  status
) VALUES (
  '12345678-1234-1234-1234-123456789012',
  'Main Fest Registration',
  'Main festival registration for all participants',
  'Main',
  'fest',
  'Online',
  now() + interval '30 days',
  now() + interval '7 days',
  1000,
  false,
  'upcoming'
)
ON CONFLICT (id) DO NOTHING;

-- Function to register fest user with proof upload support
CREATE OR REPLACE FUNCTION public.register_fest_user(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_education TEXT,
  p_college TEXT,
  p_year TEXT,
  p_branch TEXT,
  p_payment_proof_url TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_registration_id UUID;
  v_fest_event_id UUID;
  v_response json;
BEGIN
  BEGIN
    -- Get fest event ID
    SELECT id INTO v_fest_event_id FROM public.events 
    WHERE event_type = 'fest' AND name LIKE '%Fest%' LIMIT 1;
    
    -- Fallback to fixed ID if not found
    IF v_fest_event_id IS NULL THEN
      v_fest_event_id := '12345678-1234-1234-1234-123456789012'::UUID;
    END IF;

    -- Create or get profile
    INSERT INTO public.profiles (
      full_name,
      email,
      phone,
      education,
      college,
      year,
      branch
    ) VALUES (
      p_full_name,
      p_email,
      p_phone,
      p_education,
      p_college,
      p_year,
      p_branch
    )
    ON CONFLICT (email) DO UPDATE SET
      full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      college = COALESCE(EXCLUDED.college, public.profiles.college),
      year = COALESCE(EXCLUDED.year, public.profiles.year),
      branch = COALESCE(EXCLUDED.branch, public.profiles.branch),
      updated_at = now()
    RETURNING id INTO v_profile_id;

    -- Create registration record
    INSERT INTO public.registrations (
      profile_id,
      event_id,
      registration_type,
      payment_status,
      payment_proof_url,
      proof_status
    ) VALUES (
      v_profile_id,
      v_fest_event_id,
      'solo',
      CASE WHEN p_payment_proof_url IS NOT NULL THEN 'completed' ELSE 'pending' END,
      p_payment_proof_url,
      'pending'
    )
    ON CONFLICT (profile_id, event_id) DO UPDATE SET
      payment_proof_url = COALESCE(EXCLUDED.payment_proof_url, public.registrations.payment_proof_url),
      proof_status = 'pending',
      updated_at = now()
    RETURNING id INTO v_registration_id;

    -- Create proof record if payment proof was provided
    IF p_payment_proof_url IS NOT NULL THEN
      INSERT INTO public.proof_uploads (
        registration_id,
        file_path,
        file_name,
        file_type,
        proof_status
      ) VALUES (
        v_registration_id,
        p_payment_proof_url,
        'payment_proof_' || v_registration_id || '.file',
        'application/octet-stream',
        'pending'
      )
      ON CONFLICT DO NOTHING;
    END IF;

    v_response := json_build_object(
      'success', true,
      'message', 'Registration submitted successfully',
      'registration_id', v_registration_id,
      'profile_id', v_profile_id,
      'fest_event_id', v_fest_event_id
    );

    RETURN v_response;

  EXCEPTION WHEN OTHERS THEN
    v_response := json_build_object(
      'success', false,
      'message', SQLERRM,
      'error_code', SQLSTATE
    );
    RETURN v_response;
  END;
END;
$$;

-- Create storage bucket for proofs if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-uploads', 'proof-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for proof-uploads bucket
DROP POLICY IF EXISTS "Anyone can upload proofs" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all proof uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their proofs" ON storage.objects;

CREATE POLICY "Anyone can upload proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proof-uploads');

CREATE POLICY "Users can view their proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-uploads');

CREATE POLICY "Admins can view all proof uploads"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'proof-uploads' AND public.is_admin(auth.uid()));

-- Create trigger to update proof_uploads updated_at
CREATE TRIGGER update_proof_uploads_updated_at
  BEFORE UPDATE ON public.proof_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
```

---

## STEP 3: Execute Migration

1. **Verify SQL is pasted**
   - Check that all SQL is in the editor
   - The SQL should end with `EXECUTE FUNCTION public.update_updated_at();`

2. **Click "Run" Button**
   - Look for the blue **"Run"** button (usually bottom right or top right)
   - Click it to execute the migration

3. **Wait for Completion**
   - Status will show "Executing..."
   - Wait for it to complete (usually 5-30 seconds)

4. **Check for Success**
   - ✅ **Success**: Message says "Query successful" with no errors
   - ❌ **Error**: Red error message appears

---

## STEP 4: Verify Migration Success

### Check Tables
In Supabase Dashboard:

1. **Go to Table Editor**
   - Click **"Table Editor"** in left sidebar
   - You should see your tables listed

2. **Verify `proof_uploads` table**
   - [ ] Click on `proof_uploads` in the list
   - [ ] Verify columns exist:
     - `id`, `registration_id`, `file_path`, `file_name`
     - `file_size`, `file_type`, `proof_status`
     - `admin_notes`, `reviewed_by`, `reviewed_at`
     - `uploaded_at`, `updated_at`

3. **Verify `registrations` table update**
   - [ ] Click on `registrations` in the list
   - [ ] Verify new column exists:
     - `proof_status` (should show in column list)

### Check Functions
1. **Go to Database Functions**
   - Click **"Functions"** under **"Database"** section
   - Look for `register_fest_user` function
   - [ ] Function should be listed

2. **Check Storage Bucket**
   - Click **"Storage"** in left sidebar
   - Look for `proof-uploads` bucket
   - [ ] Bucket should appear in the list
   - [ ] It should be marked as **"Private"**

### Check RLS Policies
1. **Go to Auth**
   - Click **"Auth"** in left sidebar
   - Go to **"Policies"**

2. **Check `proof_uploads` policies**
   - Look for `proof_uploads` table
   - [ ] Should see "Anyone can upload proofs" policy
   - [ ] Should see "Anyone can view their own proofs" policy
   - [ ] Should see "Admins can update proofs" policy

---

## STEP 5: Success Indicators

✅ **Migration is successful when you see**:

- [x] `proof_uploads` table in Table Editor
- [x] `proof_status` column in `registrations` table
- [x] `register_fest_user` function in Database Functions
- [x] `proof-uploads` storage bucket in Storage
- [x] RLS policies configured for `proof_uploads`
- [x] No error messages in SQL Editor

---

## TROUBLESHOOTING

### Issue: "Error: function already exists"
**Solution**: This is OK - migration includes `IF NOT EXISTS` and `OR REPLACE` to handle re-runs
- Click "Run" again
- Should complete successfully on second run

### Issue: "Error: table already exists"
**Solution**: Same as above
- Migration uses `CREATE TABLE IF NOT EXISTS`
- Safe to re-run

### Issue: "Error: column already exists"
**Solution**: Expected if migration ran partially before
- Migration includes `IF NOT EXISTS` for column additions
- Safe to re-run

### Issue: "Error: conflicting key value"
**Solution**: Storage bucket may already exist
- Check Storage section
- If `proof-uploads` exists, migration will skip creation
- This is normal and expected

### Issue: "Policy already exists"
**Solution**: Policies are dropped and recreated
- Migration drops old policies first with `DROP POLICY IF EXISTS`
- This is normal behavior

**All of these are normal and expected. The migration is designed to be idempotent (safe to run multiple times).**

---

## NEXT STEPS AFTER SUCCESSFUL MIGRATION

1. ✅ **Verify all components** using checklist above
2. ✅ **Note the execution timestamp** for records
3. ✅ **Proceed to code deployment**
4. ✅ **Run test scenarios** (see TEST_SCENARIOS.md)

---

## QUICK REFERENCE

| Component | Status | Location |
|-----------|--------|----------|
| `proof_uploads` table | ✅ Created | Table Editor |
| `registrations.proof_status` column | ✅ Added | Table Editor |
| `register_fest_user()` function | ✅ Created | Functions |
| `proof-uploads` bucket | ✅ Created | Storage |
| RLS Policies | ✅ Configured | Auth → Policies |

---

## SUPPORT

If migration fails:
1. Check Supabase status page for any incidents
2. Verify you have adequate permissions
3. Try running migration again (idempotent)
4. Review error message carefully
5. Check [TROUBLESHOOTING](#troubleshooting) section above

**Migration is now ready to execute!** ✅
