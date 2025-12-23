# KAIZEN Project Setup Guide

I have fixed the code issues related to the Fest Registration flow, Admin Settings, and Email Templates.

## How to Run the Project

Since `npm` was not working in your terminal, I have created a script to help you set everything up.

1.  **Open the Project Folder**: Go to `C:\Users\Admin\Desktop\KAIZEN\KAIZEN-RITP` in File Explorer.
2.  **Run the Setup Script**: Double-click on **`setup_project.bat`**.
    *   This script will attempt to install Node.js if it's missing.
    *   It will install all project dependencies (`npm install`).
    *   It will start the development server (`npm run dev`).

## Manual Setup (If the script fails)

1.  **Install Node.js**: Download and install the LTS version from [nodejs.org](https://nodejs.org/).
2.  **Restart**: Restart your computer or VS Code to ensure the installation is recognized.
3.  **Run Commands**:
    Open a terminal in VS Code and run:
    ```bash
    npm install
    npm run dev
    ```

## Code Fixes Applied

*   **Fest Registration**: Added `education` field to the registration form and database logic.
*   **Admin Approvals**: Fixed the generated Fest Code to use the correct year prefix (`KZN26`).
*   **Event Form**: Fixed the Admin Event Form to correctly save `Registration Start Date` and `Registration End Date`.
*   **Database**: Created a migration file `supabase/migrations/20250102_add_education.sql` to update your database schema.

## Database Update

To ensure the new features work, you need to apply the database changes.
If you have the Supabase CLI configured, run:
```bash
supabase db push
```
Otherwise, copy the SQL from `supabase/migrations/20250102_add_education.sql` and run it in your Supabase Dashboard's SQL Editor.
