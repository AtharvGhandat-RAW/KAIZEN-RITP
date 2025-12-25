/// <reference types="node" />
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// This test requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to be set
// It will upsert `enable_razorpay_test` setting, perform a fest registration (test mode),
// check the DB for a pending profile, then mark it approved and verify the fest code is set.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

test.describe('Fest registration (test-mode)', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => window.localStorage.setItem('kaizenIntroSeen', 'true'));
    });

    test('register in test mode and approve via service role', async ({ page }) => {
        test.skip(!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required for this test');

        const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

        // Enable test mode setting
        await supabase.from('settings').upsert({ key: 'enable_razorpay_test', value: JSON.stringify(true) }, { onConflict: 'key' });

        // Go to Fest Registration page
        await page.goto('/fest-registration');
        await expect(page.getByText('Fest Registration')).toBeVisible();

        // Fill form
        const email = `testuser+${Date.now()}@example.com`;
        await page.getByLabel('Full Name').fill('Playwright Test');
        await page.getByLabel('Phone Number').fill('9999999999');
        await page.getByLabel('Email Address').fill(email);
        // Fill other fields if present
        await page.locator('button:has-text("Complete Registration")').click();

        // Expect a test success message or submission UI
        await expect(page.getByText(/Test( )?Registration Successful!/i)).toBeVisible({ timeout: 10000 });
        // Wait for DB to reflect pending profile
        const { data: profiles } = await supabase.from('profiles').select('*').eq('email', email);
        expect(profiles && profiles.length > 0).toBeTruthy();
        const profile = profiles![0];
        expect(profile.fest_payment_status).toBe('pending');

        // Approve registration (simulate admin) - generate code
        const festCode = `KZN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const { error: updateErr } = await supabase.from('profiles').update({ fest_payment_status: 'approved', is_fest_registered: true, fest_registration_id: festCode }).eq('id', profile.id);
        expect(updateErr).toBeNull();

        // Also update fest_registrations row
        const { error: regErr } = await supabase.from('fest_registrations').update({ registration_code: festCode, payment_status: 'completed' }).eq('profile_id', profile.id).eq('payment_status', 'pending');
        expect(regErr).toBeNull();

        // Re-fetch profile and assert fest code
        const { data: updatedProfiles } = await supabase.from('profiles').select('*').eq('id', profile.id);
        expect(updatedProfiles && updatedProfiles[0].fest_registration_id).toBe(festCode);
    });
});