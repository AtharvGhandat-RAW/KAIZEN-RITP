import { test, expect } from '@playwright/test';

test.describe('Admin Panel Tests', () => {

    // Mock data
    const mockEvents = [
        { id: '1', name: 'Hackathon 2025', event_date: '2025-11-28', registration_fee: 500, category: 'Technical' },
        { id: '2', name: 'Code Sprint', event_date: '2025-12-01', registration_fee: 200, category: 'Coding' }
    ];

    const mockRegistrations = Array.from({ length: 55 }, (_, i) => ({
        id: `${i + 1}`,
        event_id: '1',
        full_name: `Student ${i + 1}`,
        email: `student${i + 1}@example.com`,
        payment_status: i % 2 === 0 ? 'completed' : 'pending',
        created_at: new Date().toISOString(),
        events: { name: 'Hackathon 2025', registration_fee: 500 },
        profiles: { full_name: `Student ${i + 1}`, email: `student${i + 1}@example.com`, phone: '1234567890' }
    }));

    test.beforeEach(async ({ page }) => {
        // Mock Supabase Auth
        await page.route('**/auth/v1/user', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'admin-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@kaizen.com',
                    app_metadata: { provider: 'email', providers: ['email'] },
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                })
            });
        });

        // Mock Admin Role Check (if applicable, usually via a table query)
        await page.route('**/rest/v1/user_roles*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ role: 'super_admin' }])
            });
        });

        // Mock Events
        await page.route('**/rest/v1/events*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(mockEvents)
            });
        });

        // Mock Registrations (with pagination support in mind)
        await page.route('**/rest/v1/registrations*', async route => {
            const url = route.request().url();
            const headers = route.request().headers();
            const preferHeader = headers['prefer'] || '';

            if (url.includes('count=exact') || preferHeader.includes('count=exact')) {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    headers: { 'Content-Range': `0-49/${mockRegistrations.length}` },
                    body: JSON.stringify(mockRegistrations.slice(0, 50)) // Return first page
                });
            } else {
                // Check Range header
                const range = headers['range'];
                let start = 0;
                let end = 50;
                if (range) {
                    const parts = range.replace('bytes=', '').split('-');
                    start = parseInt(parts[0], 10);
                    end = parseInt(parts[1], 10) + 1; // +1 because slice is exclusive
                }

                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockRegistrations.slice(start, end))
                });
            }
        });        // Mock Queries
        await page.route('**/rest/v1/queries*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: '1', name: 'John Doe', email: 'john@example.com', subject: 'Help', message: 'Need help', status: 'new', created_at: new Date().toISOString() }
                ])
            });
        });

        // Mock Profiles for Dashboard
        await page.route('**/rest/v1/profiles*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{ id: 'admin-user-id', full_name: 'Admin User' }])
            });
        });

        // Inject Supabase Session
        await page.goto('/'); // Go to home first to set local storage
        await page.evaluate(() => {
            const session = {
                access_token: 'fake-access-token',
                refresh_token: 'fake-refresh-token',
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600,
                token_type: 'bearer',
                user: {
                    id: 'admin-user-id',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: 'admin@kaizen.com',
                    app_metadata: { provider: 'email', providers: ['email'] },
                    user_metadata: {},
                    created_at: new Date().toISOString(),
                }
            };
            localStorage.setItem('sb-paennpspolcskncxsxyp-auth-token', JSON.stringify(session));
        });

        await page.goto('/admin/dashboard');
    });

    test('Dashboard loads and displays stats', async ({ page }) => {
        await expect(page).toHaveURL(/\/admin\/dashboard/);
        // The greeting depends on time of day, so just check for "Admin"
        await expect(page.locator('h1')).toContainText('Admin');
        // Check for stats cards
        await expect(page.locator('text=Total Registrations')).toBeVisible();
        await expect(page.locator('text=Revenue Collected')).toBeVisible();
    });

    test('Events page loads and lists events', async ({ page }) => {
        await page.goto('/admin/events');
        await expect(page).toHaveURL(/\/admin\/events/);
        await expect(page.locator('h1')).toContainText('Events Management');
        await expect(page.locator('text=Hackathon 2025')).toBeVisible();
        await expect(page.locator('text=Code Sprint')).toBeVisible();
    });

    test('Registrations page loads and shows pagination', async ({ page }) => {
        await page.goto('/admin/registrations');
        await expect(page).toHaveURL(/\/admin\/registrations/);
        await expect(page.locator('h1')).toContainText('Registrations');

        // Check if table is populated - use exact match to avoid strict mode violation
        await expect(page.getByText('Student 1', { exact: true })).toBeVisible();

        // Check pagination controls
        const prevBtn = page.locator('button:has-text("Previous")');
        const nextBtn = page.locator('button:has-text("Next")');

        await expect(prevBtn).toBeVisible();
        await expect(nextBtn).toBeVisible();
    }); test('Queries page loads', async ({ page }) => {
        await page.goto('/admin/queries');
        await expect(page).toHaveURL(/\/admin\/queries/);
        await expect(page.locator('h1')).toContainText('Contact Queries');
        await expect(page.locator('text=John Doe')).toBeVisible();
    });

    test('Reports page loads', async ({ page }) => {
        await page.goto('/admin/reports');
        await expect(page).toHaveURL(/\/admin\/reports/);
        await expect(page.locator('h1')).toContainText('Reports & Analytics');
        await expect(page.locator('text=Total Registrations')).toBeVisible();
    }); test('Mobile Sidebar Toggle', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.reload(); // Reload to apply mobile view logic

        // Sidebar should be hidden initially on mobile
        const sidebar = page.locator('aside');
        await expect(sidebar).toBeHidden();

        // Click menu button
        await page.click('button:has(svg.lucide-menu)');

        // Sidebar (Sheet) should be visible
        await expect(page.locator('[role="dialog"]')).toBeVisible();
        await expect(page.locator('[role="dialog"] a[href="/admin/dashboard"]')).toBeVisible();
    });

});
