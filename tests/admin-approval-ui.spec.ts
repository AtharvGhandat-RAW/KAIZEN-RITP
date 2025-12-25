/// <reference types="node" />
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const HAS_SERVICE_ROLE = Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

// Small helper types to avoid using `any` in tests
type SupabaseCreateUserResult = { user?: { id: string } | null; users?: { id: string }[] };
interface SupabaseAdminApi {
    createUser(opts: { email: string; password: string; email_confirm?: boolean }): Promise<SupabaseCreateUserResult>;
    listUsers(opts: { search: string }): Promise<{ data?: { id: string }[] }>;
}

type EmailPayload = {
    type?: string;
    body?: Record<string, unknown>;
    data?: Record<string, unknown>;
};

test.describe('Admin approval UI (with mocked email)', () => {

    test('admin can approve a pending fest registration and trigger email (mocked)', async ({ page }) => {
        if (HAS_SERVICE_ROLE) {
            const svc = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

            // 1) Create or ensure an admin user
            const adminEmail = `admin+test+${Date.now()}@example.com`;
            const adminPass = 'TestPass123!';

            // Try creating an admin user via the admin API
            let adminUser: { id: string } | null = null;
            const adminApi = (svc as unknown as { auth: { admin: SupabaseAdminApi } }).auth.admin;
            try {
                const createRes = await adminApi.createUser({
                    email: adminEmail,
                    password: adminPass,
                    email_confirm: true,
                });
                if (createRes?.user) adminUser = createRes.user;
                else if (createRes?.users && Array.isArray(createRes.users) && createRes.users.length > 0) adminUser = createRes.users[0];
            } catch (e) {
                const listRes = await adminApi.listUsers({ search: adminEmail }).catch(() => ({ data: [] }));
                if (Array.isArray(listRes?.data) && listRes.data.length > 0) adminUser = listRes.data[0];
            }

            if (!adminUser) throw new Error('Failed to create/find admin user');

            // Assign super_admin role in user_roles table
            await svc.from('user_roles').upsert([{ user_id: adminUser.id, role: 'super_admin' }], { onConflict: 'user_id' });

            // 2) Create a pending profile and fest_registration
            const testEmail = `ui-test+${Date.now()}@example.com`;
            const { data: profileData, error: profileErr } = await svc.from('profiles').insert({
                full_name: 'UI Test User',
                email: testEmail,
                phone: '9999999999',
                college: 'Test College',
                is_fest_registered: false,
                fest_payment_status: 'pending'
            }).select().single();

            if (profileErr) throw profileErr;

            await svc.from('fest_registrations').insert({
                profile_id: profileData.id,
                payment_status: 'pending',
                payment_proof_url: null
            });

            // 3) Intercept email function call and capture payload
            let emailRequestBody: EmailPayload | null = null;
            await page.route('**/functions/v1/send-registration-email', async (route, request) => {
                if (request.method() === 'POST') {
                    const body = await request.postData();
                    try {
                        emailRequestBody = JSON.parse(body || '{}') as EmailPayload;
                    } catch {
                        emailRequestBody = { body: { raw: body } };
                    }
                    await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
                } else {
                    await route.continue();
                }
            });

            // 4) Log in via UI as admin
            await page.goto('/admin');
            await page.getByLabel('Email Address').fill(adminEmail);
            await page.getByLabel('Password').fill(adminPass);
            await Promise.all([
                page.waitForNavigation({ url: /.*\/admin\/dashboard|.*\/admin\/fest-approvals/ }),
                page.getByRole('button', { name: 'Access Dashboard' }).click(),
            ]);

            // If we didn't land directly on fest approvals, navigate there
            if (!page.url().includes('/admin/fest-approvals')) {
                await page.goto('/admin/fest-approvals');
            }

            // Accept confirm dialog automatically
            page.on('dialog', async (dialog) => { await dialog.accept(); });

            // 5) Find the pending row by email and click Approve
            await page.getByPlaceholder('Search by name, email, college...').fill(testEmail);
            await page.getByRole('button', { name: 'Refresh' }).click();

            // Wait for row
            const row = page.locator('table').getByText(testEmail).first();
            await expect(row).toBeVisible({ timeout: 5000 });

            // Click approve for that row (scroll into view first) with fallback
            const approveButton = row.locator('..').locator('button:has-text("Approve")');
            try {
                await approveButton.scrollIntoViewIfNeeded({ timeout: 5000 });
                await expect(approveButton).toBeVisible({ timeout: 5000 });
                await approveButton.click();
            } catch (e) {
                // If scrolling/visibility fails (mobile), try force click and finally DOM click as a last resort
                try {
                    await approveButton.click({ force: true });
                } catch (ef) {
                    await page.evaluate((email) => {
                        const rows = Array.from(document.querySelectorAll('table tr'));
                        const row = rows.find(r => r.textContent && r.textContent.includes(email));
                        if (!row) throw new Error('Row not found for email');
                        const btn = row.querySelector('button');
                        if (!btn) throw new Error('Approve button not found');
                        (btn as HTMLElement).click();
                    }, testEmail);
                }
            }

            // 6) Assert email function was called with fest_code_approval
            await expect.poll(() => Promise.resolve(emailRequestBody !== null), { timeout: 5000 }).toBeTruthy();
            expect(emailRequestBody).not.toBeNull();
            expect(emailRequestBody!.type).toBe('fest_code_approval');
            expect((emailRequestBody!.body as Record<string, unknown>)?.['to']).toBe(testEmail);

            // 7) Confirm DB updated: profile fest_registration_id should be set and fest_registrations payment_status = 'completed'
            const { data: updatedProfile } = await svc.from('profiles').select('*').eq('email', testEmail).single();
            expect((updatedProfile as Record<string, unknown>)['fest_registration_id']).toBeTruthy();

            const { data: reg } = await svc.from('fest_registrations').select('*').eq('profile_id', profileData.id).single();
            expect((reg as Record<string, unknown>)['payment_status']).toBe('completed');
        } else {
            // UI-only fallback mode: intercept REST UI requests and emulate a backend in-memory
            const testProfiles: Array<Record<string, unknown>> = [];
            const testRegs: Array<Record<string, unknown>> = [];
            let emailRequestBody: EmailPayload | null = null;

            // Intercept profiles REST endpoint
            await page.route('**/rest/v1/profiles**', async (route, request) => {
                const method = request.method();
                if (method === 'GET') {
                    // Return all profiles (simulate admin fetch)
                    await route.fulfill({ status: 200, body: JSON.stringify(testProfiles), headers: { 'content-type': 'application/json' } });
                    return;
                }
                if (method === 'POST') {
                    const body = await request.postData();
                    const parsed = body ? JSON.parse(body) : {};
                    const newProfile = { id: `${Date.now()}`, ...parsed };
                    testProfiles.push(newProfile);
                    await route.fulfill({ status: 201, body: JSON.stringify(newProfile), headers: { 'content-type': 'application/json' } });
                    return;
                }
                if (method === 'PATCH') {
                    const body = await request.postData();
                    const parsed = body ? JSON.parse(body) : {};
                    // extract id from query string
                    const url = new URL(request.url());
                    const idParam = url.searchParams.get('id');
                    let targetId = null;
                    if (idParam && idParam.startsWith('eq.')) targetId = idParam.replace('eq.', '');
                    const idx = testProfiles.findIndex(p => p.id === targetId);
                    if (idx !== -1) {
                        testProfiles[idx] = { ...testProfiles[idx], ...parsed };
                        await route.fulfill({ status: 200, body: JSON.stringify(testProfiles[idx]), headers: { 'content-type': 'application/json' } });
                        return;
                    }
                    await route.fulfill({ status: 404, body: JSON.stringify({ error: 'not found' }) });
                    return;
                }
                await route.continue();
            });

            // Intercept fest_registrations REST endpoint
            await page.route('**/rest/v1/fest_registrations**', async (route, request) => {
                const method = request.method();
                if (method === 'POST') {
                    const body = await request.postData();
                    const parsed = body ? JSON.parse(body) : {};
                    const newReg = { id: `${Date.now()}`, ...parsed };
                    testRegs.push(newReg);
                    await route.fulfill({ status: 201, body: JSON.stringify(newReg), headers: { 'content-type': 'application/json' } });
                    return;
                }
                if (method === 'PATCH') {
                    const body = await request.postData();
                    const parsed = body ? JSON.parse(body) : {};
                    const url = new URL(request.url());
                    const profileIdParam = url.searchParams.get('profile_id');
                    // naive match: update first pending reg
                    const idx = testRegs.findIndex(r => r.profile_id === profileIdParam || true);
                    if (idx !== -1) {
                        testRegs[idx] = { ...testRegs[idx], ...parsed };
                        await route.fulfill({ status: 200, body: JSON.stringify(testRegs[idx]), headers: { 'content-type': 'application/json' } });
                        return;
                    }
                    await route.fulfill({ status: 404, body: JSON.stringify({ error: 'not found' }) });
                    return;
                }
                if (method === 'GET') {
                    await route.fulfill({ status: 200, body: JSON.stringify(testRegs), headers: { 'content-type': 'application/json' } });
                    return;
                }
                await route.continue();
            });

            // Intercept email function call and capture payload
            await page.route('**/functions/v1/send-registration-email', async (route, request) => {
                if (request.method() === 'POST') {
                    const body = await request.postData();
                    try {
                        emailRequestBody = JSON.parse(body || '{}') as EmailPayload;
                    } catch {
                        // Store raw body in a consistent typed shape so tests can inspect it
                        emailRequestBody = { body: { raw: body } };
                    }
                    await route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) });
                } else {
                    await route.continue();
                }
            });

            // Create admin session by directly writing to localStorage (bypass auth)
            const adminEmail = `admin+ui+${Date.now()}@example.com`;
            await page.addInitScript(() => {
                // simulate an admin session flag recognized by app (if any) - otherwise rely on UI login path
                (window as unknown as { __TEST_ADMIN?: boolean }).__TEST_ADMIN = true;
            });

            // Inject a pending profile to the test DB (simulate creation step)
            const testEmail = `ui-test+${Date.now()}@example.com`;
            testProfiles.push({ id: 'p1', full_name: 'UI Test User', email: testEmail, phone: '9999999999', college: 'Test College', fest_payment_status: 'pending', is_fest_registered: false });
            testRegs.push({ id: 'r1', profile_id: 'p1', payment_status: 'pending', payment_proof_url: null });

            // Now visit admin UI
            await page.goto('/admin/fest-approvals');

            // Accept confirm dialog automatically
            page.on('dialog', async (dialog) => { await dialog.accept(); });

            // Search and click approve
            await page.getByPlaceholder('Search by name, email, college...').fill(testEmail);
            await page.getByRole('button', { name: 'Refresh' }).click();

            const row = page.locator('table').getByText(testEmail).first();
            await expect(row).toBeVisible({ timeout: 5000 });
            const approveButton = row.locator('button:has-text("Approve")');
            try {
                await approveButton.scrollIntoViewIfNeeded({ timeout: 5000 });
                await expect(approveButton).toBeVisible({ timeout: 5000 });
                await approveButton.click();
            } catch (e) {
                try {
                    await approveButton.click({ force: true });
                } catch (ef) {
                    await page.evaluate((email) => {
                        const rows = Array.from(document.querySelectorAll('table tr'));
                        const row = rows.find(r => r.textContent && r.textContent.includes(email));
                        if (!row) throw new Error('Row not found for email');
                        const btn = row.querySelector('button');
                        if (!btn) throw new Error('Approve button not found');
                        (btn as HTMLElement).click();
                    }, testEmail);
                }
            }

            // Wait for email to be captured and assert it contains the fest code that was sent by the UI
            await expect.poll(() => Promise.resolve(emailRequestBody !== null), { timeout: 5000 }).toBeTruthy();
            expect(emailRequestBody).not.toBeNull();
            expect(emailRequestBody!.type).toBe('fest_code_approval');
            // Some payloads put 'to' in different places; use a helper for safe extraction
            const getToFrom = (p: unknown): string | undefined => {
                if (!p) return undefined;
                const payload = p as EmailPayload;
                const body = payload?.body as Record<string, unknown> | undefined;
                if (body && typeof body['to'] === 'string') return body['to'] as string;
                if (typeof (p as Record<string, unknown>)?.['to'] === 'string') return (p as Record<string, unknown>)['to'] as string;
                const bodyData = body?.['data'] as Record<string, unknown> | undefined;
                if (bodyData && typeof bodyData['to'] === 'string') return bodyData['to'] as string;
                const topData = (p as Record<string, unknown>)?.['data'] as Record<string, unknown> | undefined;
                if (topData && typeof topData['to'] === 'string') return topData['to'] as string;
                return undefined;
            };
            const toVal = getToFrom(emailRequestBody);
            expect(toVal).toBe(testEmail);

            // festCode should exist in payload data — use helper to safely obtain the data object
            const getDataObject = (p: unknown): Record<string, unknown> | undefined => {
                if (!p) return undefined;
                const payload = p as EmailPayload;
                const bd = payload?.body as Record<string, unknown> | undefined;
                if (bd && typeof bd['data'] === 'object') return bd['data'] as Record<string, unknown>;
                const td = (p as Record<string, unknown>)?.['data'] as Record<string, unknown> | undefined;
                if (td && typeof td === 'object') return td;
                return undefined;
            };
            const dataObj = getDataObject(emailRequestBody);
            expect(dataObj?.['festCode']).toBeTruthy();

            // Additionally, confirm our in-memory DB got updated (profile got a fest_registration_id and reg marked completed)
            const updatedProfile = testProfiles.find(p => p['email'] === testEmail);
            expect(updatedProfile && updatedProfile['fest_registration_id']).toBeTruthy();
            const updatedReg = testRegs.find(r => r['profile_id'] === updatedProfile!['id']);
            expect(updatedReg && updatedReg['payment_status']).toBe('completed');
        }
    });
});