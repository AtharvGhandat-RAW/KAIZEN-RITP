# Admin Setup & User Guide

## 🔐 Initial Setup

### Creating Admin Accounts

Admins are managed through the `user_roles` table in Supabase. To create an admin:

1. **Go to Supabase Dashboard** → Authentication → Users
2. **Create a new user** with email/password
3. **Copy the User ID** from the user details
4. **Go to SQL Editor** and run:

```sql
-- Create Super Admin (Full Access)
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_HERE', 'super_admin');

-- Create Event Manager (Events & Registrations)
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_HERE', 'event_manager');

-- Create Finance Manager (Payments & Reports)
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_HERE', 'finance');

-- Create Viewer (Read-Only)
INSERT INTO user_roles (user_id, role) 
VALUES ('USER_ID_HERE', 'viewer');
```

### Role Permissions

| Feature | Super Admin | Event Manager | Finance | Viewer |
|---------|------------|---------------|---------|--------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Events | ✅ | ✅ | ❌ | ✅ View |
| Registrations | ✅ | ✅ | ✅ | ✅ View |
| Queries | ✅ | ✅ | ❌ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ View |
| Sponsors | ✅ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ |

---

## 📚 Admin Panel Features

### 1. 📊 Dashboard
**What it does:**
- Real-time overview of registrations, events, payments
- Recent registrations list
- Quick stats at a glance

**How to use:**
- View live data that updates automatically
- Monitor payment statuses
- Track upcoming events

---

### 2. 📅 Events Management
**What it does:**
- Create, edit, and delete events
- Set event as "Featured" to display on homepage
- Manage event details (date, venue, fee, participants)

**How to use:**
1. Click **"Create Event"** to add new event
2. Fill in all details:
   - Name, Category, Event Type (Individual/Team)
   - Date, Venue, Registration Fee
   - Max participants, Prize pool, Rules
3. Click **eye icon** to toggle Featured status
4. Use **Edit** to update or **Delete** to remove

**💡 Tips:**
- Featured events appear prominently on homepage
- Set registration deadline before event date
- Update status to "completed" after event ends

---

### 3. 📝 Registrations Management
**What it does:**
- View all student registrations in real-time
- Update payment status (Pending → Verified/Rejected)
- Search and filter registrations
- Export data to CSV

**How to use:**
1. **Search:** Type name, email, phone, or event name
2. **Filter:** Select payment status from dropdown
3. **Update Payment:** Click dropdown in payment column
4. **Export:** Click "Export CSV" for spreadsheet

**Payment Statuses:**
- 🟡 **Pending:** Waiting for payment verification
- 🟢 **Verified:** Payment confirmed, registration complete
- 🔴 **Rejected:** Payment failed or cancelled

**💡 Tips:**
- Verify payments daily during registration period
- Export data before event for attendance sheets
- Check email field for communication

---

### 4. 📧 Queries Management
**What it does:**
- View contact form submissions
- Mark queries as "Seen" or "Resolved"
- Delete resolved queries

**How to use:**
1. New queries show with red border
2. Click **Eye icon** to mark as seen
3. Click **Delete** after resolving

**💡 Tips:**
- Respond to new queries within 24 hours
- Keep track via email provided in query

---

### 5. 🎯 Sponsors Management
**What it does:**
- Add/edit/delete sponsors
- Control visibility on website
- Set sponsor tiers (Title, Gold, Silver, Associate)
- Manage display order

**How to use:**
1. Click **"Add Sponsor"**
2. Fill details:
   - Name, Tier, Website URL
   - Upload logo (recommended: 500x200px PNG)
3. Use **Eye icon** to show/hide on website
4. Drag to reorder (use display_order field)

**💡 Tips:**
- Title sponsors appear largest
- Hide sponsors until partnership is confirmed
- Update logos to maintain consistent size

---

### 6. 📊 Reports & Analytics
**What it does:**
- Generate comprehensive reports
- Export data for analysis
- View payment statistics
- Download attendance sheets

**Report Types:**

**📝 Registration Report:**
- Complete student details
- Event information
- Team names (if applicable)
- Registration dates

**💰 Payment Report:**
- Payment status per student
- Payment IDs
- Revenue calculations

**📅 Event Summary:**
- Stats per event
- Registration counts
- Revenue per event
- Payment completion rates

**📋 Attendance Sheet:**
- Ready-to-print format
- Verified payments only
- Signature columns
- Event details

**How to use:**
1. Select "All Events" or specific event
2. Click respective "Export" button
3. Open CSV in Excel/Google Sheets

**💡 Tips:**
- Export reports daily during peak registration
- Use Event Summary for sponsor reporting
- Print Attendance Sheets before events

---

### 7. ⚙️ Settings
**What it does:**
- Control website behavior
- Update homepage content
- Manage registration settings
- Configure contact information
- Customize theme

**Website Settings:**
- **Enable Intro Animation:** Show/hide opening animation
- **Fest Coordinator:** Update coordinator name
- **Unit Name:** College/organization name
- **Year:** Current fest year
- **Theme Tagline:** Main theme text

**Homepage Settings:**
- **Hero Title:** Main headline
- **Hero Subtitle:** Supporting text
- **CTA Buttons:** Call-to-action button text
- **Countdown Target:** Event start date/time

**Registration Settings:**
- **Enable Registration:** Turn registration on/off globally
- **Notice Banner:** Urgent messages (e.g., "Last day to register!")

**Contact Settings:**
- **Support Email:** Primary contact email
- **Support Phone:** Contact number with WhatsApp
- **Show Sponsors:** Toggle sponsors section

**Theme Settings:**
- **Glow Intensity:** Adjust neon glow (0-1)
- **Neon Effects:** Enable/disable glow effects
- **Background Animations:** Control atmospheric effects

**💡 Tips:**
- Test changes in preview before saving
- Update countdown target before fest
- Use notice banner for urgent announcements
- Disable registration after deadline

---

## 🚀 Daily Admin Workflow

### Morning Routine:
1. ✅ Check **Dashboard** for new registrations
2. ✅ Verify payments in **Registrations**
3. ✅ Respond to **Queries**
4. ✅ Update event participant counts

### During Registration Period:
1. ✅ Monitor **Registrations** multiple times daily
2. ✅ Update payment statuses promptly
3. ✅ Export daily reports for backup

### Before Event:
1. ✅ Export **Attendance Sheets**
2. ✅ Verify all payments are completed
3. ✅ Update event status to "ongoing"

### After Event:
1. ✅ Update event status to "completed"
2. ✅ Generate final **Event Summary Report**
3. ✅ Archive data for future reference

---

## 🆘 Common Issues & Solutions

### Problem: Can't login to admin panel
**Solution:** Check if your user has a role in `user_roles` table

### Problem: Real-time updates not working
**Solution:** Refresh the page, check internet connection

### Problem: Can't update payment status
**Solution:** Ensure you have Event Manager or Super Admin role

### Problem: CSV export shows no data
**Solution:** Check if filters are applied, clear filters and retry

### Problem: Settings not saving
**Solution:** Must have Super Admin role to modify settings

---

## 📱 Mobile Admin Access

The admin panel is responsive and works on tablets/phones:
- Use landscape mode for better table views
- Export reports on desktop for easier analysis
- Dashboard works perfectly on mobile

---

## 🔒 Security Best Practices

1. ✅ Never share admin credentials
2. ✅ Use strong passwords (12+ characters)
3. ✅ Log out after use on shared computers
4. ✅ Regularly backup data using Reports
5. ✅ Monitor unusual registration patterns
6. ✅ Verify payment screenshots/IDs before confirming

---

## 📞 Need Help?

For technical support:
- Check PRODUCTION_CHECKLIST.md for deployment info
- Review Supabase dashboard for database issues
- Contact technical team for critical problems

---

**Last Updated:** 2025
**Version:** 1.0
