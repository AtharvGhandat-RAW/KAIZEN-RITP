# TEST SCENARIOS & VERIFICATION GUIDE
## Payment Proof Upload & Verification System

**Purpose**: Comprehensive testing of registration and admin verification flows  
**Duration**: ~30-45 minutes for full test  
**Environment**: Production after deployment  

---

## PRE-TEST CHECKLIST

Before running tests, verify:

- [ ] Migration executed successfully in Supabase
- [ ] Application deployed to production
- [ ] Browser console shows no critical errors
- [ ] Admin is logged in with proper role
- [ ] Test user account available (or create new)

---

## TEST CASE 1: User Registration with Proof Upload

### Objective
Verify users can register with payment proof upload

### Steps

#### 1.1: Access Registration Page
1. Open browser and navigate to `/fest-registration`
2. **Expected Result**: Registration form loads with all fields visible

✅ **Verification Points**:
- [ ] Page title shows "Fest Registration"
- [ ] Personal details section visible
- [ ] Academic details section visible
- [ ] Payment section with UPI QR code visible
- [ ] Proof upload section visible

#### 1.2: Fill Registration Form
1. Fill in the following test data:
   ```
   Full Name: Test User Demo
   Email: testuser123@example.com
   Phone: 9876543210
   Education: Degree
   College: Institute of Technology
   Year: 2nd Year
   Branch: CSE
   ```

2. **Expected Result**: All fields accept input

✅ **Verification Points**:
- [ ] Name field accepts text
- [ ] Email field validates format
- [ ] Phone field accepts numbers
- [ ] Dropdowns work and selections save
- [ ] Branch field accepts text

#### 1.3: Upload Payment Proof
1. Click **"Upload Payment Proof"** section
2. Click file upload area or drag-and-drop
3. Select a test file:
   - **Valid**: JPG image (< 5MB), PNG image (< 5MB), PDF (< 5MB)
   - **Test with**: Screenshot of UPI payment

4. **Expected Result**: File appears in upload section

✅ **Verification Points**:
- [ ] File selector dialog opens
- [ ] Selected file shows filename
- [ ] File size displays correctly
- [ ] "Remove file" button appears
- [ ] Can remove and re-select file

#### 1.4: Test File Validation
1. Try uploading invalid files:
   - **Test A**: File > 5MB (should show error)
   - **Test B**: EXE or script file (should show error)
   - **Test C**: Corrupted file (should show error)

2. **Expected Result**: Appropriate error messages appear

✅ **Verification Points**:
- [ ] Error toast appears for oversized files
- [ ] Error message for invalid file types
- [ ] Upload is blocked for invalid files
- [ ] Can still retry with valid file

#### 1.5: Submit Registration
1. Click **"Submit Registration"** button
2. Wait for processing (shows "Processing..." state)
3. **Expected Result**: Success screen appears

✅ **Verification Points**:
- [ ] Button shows loading state during upload
- [ ] Success screen appears after submission
- [ ] Confirmation message displays
- [ ] "Back to Home" button available
- [ ] No console errors appear

#### 1.6: Verify in Admin Backend
1. Login as admin
2. Go to **Admin Dashboard**
3. Check database directly (optional):
   ```sql
   SELECT * FROM proof_uploads ORDER BY uploaded_at DESC LIMIT 1;
   SELECT * FROM registrations WHERE registration_type = 'solo' ORDER BY created_at DESC LIMIT 1;
   ```

4. **Expected Result**: Registration and proof records exist

✅ **Verification Points**:
- [ ] New proof record created in `proof_uploads` table
- [ ] New registration record created
- [ ] `proof_status` = 'pending'
- [ ] `payment_status` = 'pending' or 'completed'
- [ ] File path stored correctly
- [ ] `uploaded_at` timestamp set

---

## TEST CASE 2: Admin Proof Verification Panel

### Objective
Verify admin can access and interact with proof verification interface

### Steps

#### 2.1: Access Proof Verification Dashboard
1. Login as admin user
2. Navigate to `/admin/fest-management`
3. **Expected Result**: Dashboard loads with two tabs

✅ **Verification Points**:
- [ ] Page title: "Festival Management"
- [ ] Two tabs visible: "Payment Approvals" and "Proof Verification"
- [ ] "Proof Verification" tab clickable
- [ ] No 403 or permission errors

#### 2.2: View Proof List
1. Click **"Proof Verification"** tab
2. Wait for page to load
3. **Expected Result**: List of proofs appears with filters

✅ **Verification Points**:
- [ ] Proofs load (may take 2-5 seconds)
- [ ] Filter dropdown shows status options
- [ ] Records display user information
- [ ] Status badges show (pending=yellow, approved=green, rejected=red)
- [ ] Record count displays
- [ ] Loading spinner shows while fetching

#### 2.3: Test Filtering
1. Filter by status:
   - **Test A**: Click "Pending" filter
   - **Test B**: Click "Approved" filter
   - **Test C**: Click "Rejected" filter
   - **Test D**: Click "All Statuses" filter

2. **Expected Result**: List updates for each filter

✅ **Verification Points**:
- [ ] Pending shows yellow badges only
- [ ] Approved shows green badges only
- [ ] Rejected shows red badges only
- [ ] All shows all statuses
- [ ] Record count updates

#### 2.4: Open Proof Detail View
1. Click **"Review"** button on a pending proof
2. Modal dialog should open
3. **Expected Result**: Detail view shows all information

✅ **Verification Points**:
- [ ] Modal title: "Review Proof"
- [ ] User information displays:
  - [ ] Name
  - [ ] Email
  - [ ] College
  - [ ] Phone (if available)
- [ ] Proof preview displays (image or PDF indicator)
- [ ] Admin notes textarea visible and editable
- [ ] Three action buttons: Approve, Reject, Close

#### 2.5: Test Proof Preview
1. In the proof detail modal, view the proof preview
2. **Expected Result**: Correct preview type displays

✅ **Verification Points**:
- [ ] Images display with proper rendering
- [ ] PDFs show "PDF File" indicator (not full render)
- [ ] Image is sized appropriately
- [ ] Preview is clear and readable
- [ ] No broken image errors

#### 2.6: Test Admin Notes
1. In the proof detail modal:
   - Click admin notes textarea
   - Type test message: "Test verification note - checking UPI transaction ID"
   - **Expected Result**: Text appears in field

✅ **Verification Points**:
- [ ] Textarea accepts input
- [ ] Text displays correctly
- [ ] No character limit issues
- [ ] Formatting preserved

---

## TEST CASE 3: Approve Proof

### Objective
Verify admin can approve payment proofs

### Steps

#### 3.1: Click Approve Button
1. Open a pending proof detail modal
2. Add test note (optional): "Payment verified from UPI"
3. Click **"Approve"** button
4. **Expected Result**: Processing state shows

✅ **Verification Points**:
- [ ] Button shows loading state
- [ ] Button text changes to "Approving..."
- [ ] Spinner icon appears
- [ ] Button is disabled during processing

#### 3.2: Verify Approval Completed
1. Wait for processing to complete (2-5 seconds)
2. **Expected Result**: Modal closes and list updates

✅ **Verification Points**:
- [ ] Modal closes automatically
- [ ] Success toast appears: "Proof approved successfully"
- [ ] Proof moves to approved status in list
- [ ] Badge changes to green "Approved"

#### 3.3: Check Backend Updates
1. Go back to proof list
2. Filter by "Approved"
3. **Expected Result**: Approved proof appears

✅ **Verification Points**:
- [ ] Proof appears in approved list
- [ ] Status badge is green
- [ ] Review button disabled or grayed out
- [ ] Admin notes are saved and visible

#### 3.4: Verify Database Changes
1. Query database (optional):
   ```sql
   SELECT proof_status, payment_status, admin_notes, reviewed_at 
   FROM proof_uploads 
   WHERE id = '<test_proof_id>';
   
   SELECT proof_status, payment_status 
   FROM registrations 
   WHERE id = '<test_registration_id>';
   ```

2. **Expected Result**: Records show updated status

✅ **Verification Points**:
- [ ] `proof_uploads.proof_status` = 'approved'
- [ ] `proof_uploads.admin_notes` saved correctly
- [ ] `proof_uploads.reviewed_at` timestamp set
- [ ] `registrations.proof_status` = 'approved'
- [ ] `registrations.payment_status` = 'completed'

---

## TEST CASE 4: Reject Proof

### Objective
Verify admin can reject payment proofs with required notes

### Steps

#### 4.1: Attempt Reject Without Notes
1. Open a pending proof detail modal
2. **Do NOT** add any notes
3. Click **"Reject"** button
4. **Expected Result**: Error message appears

✅ **Verification Points**:
- [ ] Toast error appears: "Please provide a reason for rejection"
- [ ] Reject action does NOT proceed
- [ ] Modal remains open
- [ ] Button returns to normal state

#### 4.2: Reject With Notes
1. Click admin notes textarea
2. Type rejection reason: "Transaction ID not matching. Requested resubmission with correct proof."
3. Click **"Reject"** button
4. **Expected Result**: Processing begins

✅ **Verification Points**:
- [ ] Notes are entered successfully
- [ ] Button shows loading state
- [ ] Button text changes to "Rejecting..."
- [ ] Spinner icon appears

#### 4.3: Verify Rejection Completed
1. Wait for processing to complete
2. **Expected Result**: Modal closes and list updates

✅ **Verification Points**:
- [ ] Modal closes automatically
- [ ] Success toast appears: "Proof rejected successfully"
- [ ] Proof moves to rejected status
- [ ] Badge changes to red "Rejected"

#### 4.4: Check Database Updates
1. Query database (optional):
   ```sql
   SELECT proof_status, admin_notes, reviewed_at 
   FROM proof_uploads 
   WHERE proof_status = 'rejected' 
   LIMIT 1;
   
   SELECT proof_status, payment_status 
   FROM registrations 
   WHERE proof_status = 'rejected' 
   LIMIT 1;
   ```

2. **Expected Result**: Records show rejected status

✅ **Verification Points**:
- [ ] `proof_uploads.proof_status` = 'rejected'
- [ ] `proof_uploads.admin_notes` contains rejection reason
- [ ] `registrations.proof_status` = 'rejected'
- [ ] `registrations.payment_status` = 'failed'

---

## TEST CASE 5: Download Proof File

### Objective
Verify admin can download proof files for offline records

### Steps

#### 5.1: Open Proof List
1. Go to `/admin/fest-management`
2. Click "Proof Verification" tab
3. Ensure proofs are loaded

#### 5.2: Click Download Button
1. Find a proof record with status
2. Click **"Download"** button next to "Review"
3. **Expected Result**: File downloads to computer

✅ **Verification Points**:
- [ ] Download dialog appears (browser dependent)
- [ ] File size reasonable
- [ ] Filename correct
- [ ] Download completes successfully
- [ ] No CORS or permission errors

#### 5.3: Verify Downloaded File
1. Check Downloads folder
2. Open downloaded file
3. **Expected Result**: File is valid and readable

✅ **Verification Points**:
- [ ] Image displays correctly
- [ ] PDF opens in viewer
- [ ] File is not corrupted
- [ ] File content matches preview

---

## TEST CASE 6: Multi-Step Registration Flow

### Objective
Test complete end-to-end workflow

### Steps

#### 6.1: Register Multiple Users
1. Repeat TEST CASE 1 with three different test users:
   - User A: Valid proof (will be approved)
   - User B: Unclear proof (will be rejected)
   - User C: Valid proof (will be approved)

2. **Expected Result**: Three registrations created

✅ **Verification Points**:
- [ ] All three uploads succeed
- [ ] All three appear in admin list
- [ ] All show "Pending" status

#### 6.2: Admin Reviews All Proofs
1. Go to admin dashboard
2. Approve User A and C
3. Reject User B with detailed notes
4. **Expected Result**: All processed

✅ **Verification Points**:
- [ ] 2 Approved (green), 1 Rejected (red)
- [ ] All have admin notes
- [ ] Timestamps recorded

#### 6.3: Verify Status Changes
1. Check each registration status in database
2. **Expected Result**: All statuses correct

✅ **Verification Points**:
- [ ] User A: proof_status=approved, payment_status=completed
- [ ] User B: proof_status=rejected, payment_status=failed
- [ ] User C: proof_status=approved, payment_status=completed

---

## TEST CASE 7: Error Handling

### Objective
Test error scenarios and recovery

### Steps

#### 7.1: Test Network Error Simulation
1. Open registration page
2. Go to DevTools (F12) → Network tab
3. Click offline or throttle connection
4. Try to upload file
5. **Expected Result**: Error handling

✅ **Verification Points**:
- [ ] Helpful error message shown
- [ ] Can retry after connection restored
- [ ] No silent failures
- [ ] Console has informative errors

#### 7.2: Test Large File
1. Try uploading file > 5MB
2. **Expected Result**: Rejected before upload

✅ **Verification Points**:
- [ ] Error message appears immediately
- [ ] No upload attempt made
- [ ] Can select different file

#### 7.3: Test Invalid File Type
1. Try uploading .exe, .zip, or .txt file
2. **Expected Result**: Rejected

✅ **Verification Points**:
- [ ] File type validation works
- [ ] Error message clear
- [ ] Can retry with valid file

#### 7.4: Test Missing Proof
1. Try submitting registration without uploading proof
2. **Expected Result**: Submission succeeds (proof is optional)

✅ **Verification Points**:
- [ ] Form submits successfully
- [ ] Proof status = 'pending' (not rejected)
- [ ] Registration created

---

## TEST CASE 8: Performance & Scale

### Objective
Verify system handles multiple proofs efficiently

### Steps

#### 8.1: Create 10+ Test Registrations
1. Register 10 different users with proofs
2. **Expected Result**: All succeed

✅ **Verification Points**:
- [ ] No timeout errors
- [ ] All proofs appear in admin list
- [ ] Page performance acceptable
- [ ] Database queries fast

#### 8.2: Test Admin List Loading
1. With 10+ proofs, go to admin dashboard
2. Filter by different statuses
3. **Expected Result**: List loads quickly

✅ **Verification Points**:
- [ ] List loads in < 2 seconds
- [ ] Filtering is responsive
- [ ] No lag or UI freezing
- [ ] Scroll performance smooth

#### 8.3: Bulk Operations
1. Approve 5 proofs sequentially
2. Reject 3 proofs sequentially
3. **Expected Result**: All operations complete

✅ **Verification Points**:
- [ ] No conflicts or errors
- [ ] Each operation independent
- [ ] Status updates correctly
- [ ] No database locks

---

## TEST CASE 9: User Experience

### Objective
Verify UI/UX quality and clarity

### Steps

#### 9.1: Visual Design
1. Open registration page
2. Check visual elements:
   - [ ] Color scheme consistent
   - [ ] Font readable
   - [ ] Buttons clearly clickable
   - [ ] Form well-organized
   - [ ] Error messages visible

#### 9.2: Mobile Responsiveness
1. Open registration page on mobile (or use DevTools)
2. Test layout:
   - [ ] Form fields stack properly
   - [ ] Upload area visible and usable
   - [ ] Buttons appropriately sized
   - [ ] No horizontal scrolling
   - [ ] Touch-friendly

#### 9.3: Accessibility
1. Test keyboard navigation:
   - [ ] Tab through form fields
   - [ ] Can submit with Enter key
   - [ ] File dialog keyboard accessible
   - [ ] Modal keyboard trappable

#### 9.4: Clarity of Messages
1. Review all user-facing messages:
   - [ ] Success messages clear
   - [ ] Error messages helpful
   - [ ] Status badges obvious
   - [ ] Instructions understandable
   - [ ] No technical jargon

---

## FINAL VERIFICATION CHECKLIST

✅ **All tests passed when**:

- [x] User registration works with file upload
- [x] File validation prevents invalid uploads
- [x] Admin can access proof verification dashboard
- [x] Admin can view proof details and preview
- [x] Approval workflow works correctly
- [x] Rejection workflow requires notes
- [x] Database updates reflect actions
- [x] Download functionality works
- [x] Multiple users and proofs work
- [x] Error handling is graceful
- [x] Performance is acceptable
- [x] UI/UX is clear and intuitive
- [x] Mobile responsiveness works
- [x] No console errors

---

## TEST SUMMARY TEMPLATE

```
Test Run Date: __________
Tested By: __________
Environment: [ ] Development [ ] Production
Browser: __________
Total Tests: 9
Passed: __________
Failed: __________
Issues Found: __________

Overall Status: [ ] ✅ PASSED [ ] ⚠️ PARTIAL [ ] ❌ FAILED

Notes:
_________________________________________________________________
_________________________________________________________________
```

---

## NEXT STEPS

- [ ] Complete all test cases
- [ ] Document any issues found
- [ ] Fix issues if any
- [ ] Get sign-off from QA/Team Lead
- [ ] Proceed to admin training
- [ ] Deploy to production

---

**Testing is complete when all test cases pass!** ✅
