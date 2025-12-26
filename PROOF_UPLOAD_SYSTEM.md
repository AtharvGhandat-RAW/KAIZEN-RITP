# Festival Payment Proof Upload & Verification System

## Overview
This system allows festival registration participants to upload payment proofs, and enables admins to verify and approve/reject these proofs with status tracking.

## Components

### 1. Database Schema (`supabase/migrations/20250126_add_proof_uploads.sql`)

#### Tables
- **`proof_uploads`**: Stores uploaded proof files with status tracking
  - `id`: UUID primary key
  - `registration_id`: Links to registration
  - `file_path`: Storage path for the file
  - `file_name`: Original file name
  - `proof_status`: pending, approved, rejected
  - `admin_notes`: Notes from admin review
  - `reviewed_by`: Admin user ID
  - `reviewed_at`: When proof was reviewed
  - `uploaded_at`: When file was uploaded

- **`registrations` (updated)**: Added `proof_status` column
  - `proof_status`: pending, approved, rejected, not_required

#### RPC Function
**`register_fest_user()`** - Creates or updates user registration with proof upload support

Parameters:
- `p_full_name`: User's full name
- `p_email`: User's email
- `p_phone`: User's phone number
- `p_education`: Education type (Degree/Diploma)
- `p_college`: College name
- `p_year`: Academic year
- `p_branch`: Course branch
- `p_payment_proof_url`: Optional file path to payment proof

Returns: JSON object with success status, registration_id, and profile_id

#### Storage Bucket
- **`proof-uploads`**: Private storage for payment proof files
  - Files are only visible to uploaders and admins
  - Supports images (JPG, PNG) and PDFs
  - Max size enforced on frontend: 5MB

#### RLS Policies
- **Public**: Can upload proofs
- **Admins**: Can view, approve, reject proofs
- **All**: Can view public information

### 2. Frontend Components

#### Festival Registration Page (`src/pages/FestRegistration.tsx`)

Features:
- Form with personal and academic details
- Payment information display (UPI QR code and ID)
- **Proof Upload Section**:
  - File input with drag-and-drop support
  - File size validation (max 5MB)
  - Accepted formats: Images (JPG, PNG) and PDFs
  - Visual feedback for selected files

Flow:
1. User fills registration form
2. User uploads payment proof screenshot
3. Form submits with proof file
4. File is uploaded to `proof-uploads` storage bucket
5. Registration record created with file path
6. Proof record created in `proof_uploads` table
7. Proof status set to "pending" for admin review

#### Admin Proof Verification Panel (`src/components/admin/ProofVerificationPanel.tsx`)

Features:
- **List View**:
  - Filter by status (pending, approved, rejected)
  - Display user info (name, email, college)
  - Show upload timestamp
  - Quick review button

- **Detail View**:
  - User information summary
  - Proof preview (image or PDF indicator)
  - Admin notes textarea
  - Action buttons:
    - ✅ **Approve**: Sets proof to "approved", payment_status to "completed"
    - ❌ **Reject**: Requires notes, sets proof to "rejected", payment_status to "failed"
    - Download proof file
  - Modal close button

Status Management:
- **Pending** → Shows in yellow badge
- **Approved** → Shows in green badge, registration is marked complete
- **Rejected** → Shows in red badge, admin must provide reason

#### Festival Management Dashboard (`src/pages/admin/FestManagement.tsx`)

Tabbed interface combining:
1. **Payment Approvals Tab**: Shows legacy fest approvals (FestApprovals component)
2. **Proof Verification Tab**: Shows ProofVerificationPanel component

Access: `/admin/fest-management`

### 3. API Integrations

#### File Upload Flow
```typescript
// Step 1: Upload file to storage
const { data, error } = await supabase.storage
  .from('proof-uploads')
  .upload(filePath, file);

// Step 2: Call registration RPC with file path
const { data: result, error } = await supabase.rpc('register_fest_user', {
  p_full_name: formData.fullName,
  // ... other params ...
  p_payment_proof_url: uploadedFilePath,
});
```

#### Proof Verification Flow
```typescript
// Admin reviews proof
const { error } = await supabase
  .from('proof_uploads')
  .update({
    proof_status: 'approved',
    admin_notes: notes,
    reviewed_by: adminUserId,
    reviewed_at: now,
  })
  .eq('id', proofId);

// Registration status updated
const { error } = await supabase
  .from('registrations')
  .update({
    proof_status: 'approved',
    payment_status: 'completed',
  })
  .eq('id', registrationId);
```

## User Journey

### For Participants
1. Navigate to `/fest-registration`
2. Fill registration form
3. Click "Upload Payment Proof" button
4. Select proof image/PDF (max 5MB)
5. Click "Submit Registration"
6. System uploads file and creates registration
7. Admin reviews and approves within 24 hours
8. User receives confirmation email with Fest Code

### For Admins
1. Navigate to `/admin/fest-management`
2. Click "Proof Verification" tab
3. Filter by "Pending" status
4. Click "Review" on a proof
5. View user details and proof preview
6. Add admin notes if needed
7. Click "Approve" or "Reject"
8. If rejected, provide reason in notes
9. Move to next proof

## Error Handling

### Frontend
- File size validation (must be < 5MB)
- File type validation (image or PDF)
- Upload error handling with toast notifications
- Network error handling with retry logic

### Backend
- Email format validation
- Duplicate email handling (update existing)
- Missing column handling (graceful adds)
- Transaction rollback on error
- Detailed error messages in response

## Deployment Instructions

### Step 1: Run Migration
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL from `supabase/migrations/20250126_add_proof_uploads.sql`
4. Execute the migration

### Step 2: Verify Tables
In Supabase Dashboard:
- Check `proof_uploads` table exists
- Check `registrations.proof_status` column exists
- Check `storage/proof-uploads` bucket exists

### Step 3: Test Registration
1. Go to your app's `/fest-registration`
2. Fill form and upload a test proof
3. Check admin dashboard at `/admin/fest-management`
4. Verify proof appears in "Proof Verification" tab
5. Test approve/reject functionality

## Security Features

✅ **RLS Policies**: Users can only see their own data unless admin  
✅ **File Validation**: Size and type checking  
✅ **Storage Privacy**: proof-uploads bucket is private  
✅ **Admin-Only Actions**: Proof approval/rejection requires admin role  
✅ **Audit Trail**: tracked with reviewed_by and reviewed_at timestamps  
✅ **SQL Injection Prevention**: Using parameterized functions  
✅ **Rate Limiting**: Controlled by Supabase built-in limits  

## Troubleshooting

### "Could not find the function public.register_fest_user"
- **Cause**: Migration hasn't been executed
- **Fix**: Run the migration SQL in Supabase SQL Editor

### File upload fails
- Check file size (must be < 5MB)
- Check file type (must be image or PDF)
- Check storage bucket exists and policies are set

### Proof not showing in admin panel
- Verify registration was created
- Check RLS policies are enabled
- Verify admin user has correct role

### Approve/Reject buttons not working
- Check user is logged in as admin
- Verify `is_admin()` function exists
- Check admin user role is set correctly

## Future Enhancements

- [ ] Automatic email notifications on approval/rejection
- [ ] Batch approval/rejection
- [ ] Export proof records as CSV
- [ ] Proof edit/reupload functionality
- [ ] Proof OCR for automatic verification
- [ ] Payment amount verification
- [ ] Duplicate proof detection
- [ ] Analytics dashboard for payment trends

## Support

For issues or questions:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify all RLS policies are correctly configured
4. Review migration execution logs
