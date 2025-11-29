# Product Requirements Document KAIZEN - RITP Tech Fest Website

## 1. Project Overview
KAIZEN is the official website for the RIT Polytechnic Tech Fest. It is a cinematic, Stranger Things themed web application that allows students to explore events, register for competitions, and view the festival schedule. It also includes an Admin Panel for organizers to manage the event.

## 2. Design Aesthetic
- Theme Stranger Things  80s Horror  Dark Cinematic.
- Key Elements Red neon glows, floating particles, glitch effects, Upside Down alternate dimension visuals.
- Intro A cinematic intro animation that plays on first load (can be skipped).

## 3. User Roles
- Public User (Student) Can view events, register, and see the schedule.
- Admin Can manage events, registrations, and the schedule.

## 4. Key Features & User Flows

### A. Public Interface
1.  Landing Page
    - Displays a Stranger Things style intro.
    - Hero section with a countdown timer.
    - About and Stats sections.
    - Footer with a Newsletter Subscription form.
2.  Events Section
    - Explore Events button opens a modal listing all events.
    - Clicking an event shows details (Rules, Prize Pool, Venue).
    - Register Now button leads to the Registration form.
3.  Registration
    - A multi-step form (Personal Info - Academic Info - Payment).
    - Users upload a payment screenshot.
    - Real-time validation for required fields.
4.  Schedule
    - View Schedule button opens a timeline view.
    - Events are grouped by Day (Day 1, Day 2).

### B. Admin Panel (Protected Route admin)
1.  Dashboard Shows total registrations, revenue, and event counts.
2.  Events Management Add, edit, or delete events (Title, Image, Fee, Rules).
3.  Registrations View list of students, approvereject payments, export to CSV.
4.  Schedule Builder A drag-and-drop or list interface to create the event timeline.

## 5. Technical Stack
- Frontend React, Vite, Tailwind CSS, Framer Motion.
- Backend Supabase (PostgreSQL, Auth, Storage, Edge Functions).
- Routing React Router DOM.

## 6. Success Criteria for Testing
- The Intro animation should play and be skippable.
- Registration form should successfully submit data to Supabase.
- Admin login should redirect to the Dashboard.
- Mobile menu should work on smaller screens.
- No Black Screens or crashes during navigation.