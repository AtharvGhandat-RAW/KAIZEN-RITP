import { test, expect } from '@playwright/test';

test.describe('Admin Interface', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin');
        await page.evaluate(() => {
            window.localStorage.setItem('kaizenIntroSeen', 'true');
        });
    });

    test('Login page loads correctly', async ({ page }) => {
        await expect(page).toHaveURL(/.*\/admin/);
        await expect(page.getByRole('heading', { name: 'KAIZEN', level: 1 })).toBeVisible();
        await expect(page.getByText('Admin Portal')).toBeVisible();
        await expect(page.getByLabel('Email Address')).toBeVisible();
        await expect(page.getByLabel('Password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Access Dashboard' })).toBeVisible();
    });

    test('Failed login shows error', async ({ page }) => {
        await page.getByLabel('Email Address').fill('wrong@example.com');
        await page.getByLabel('Password').fill('wrongpassword');
        await page.getByRole('button', { name: 'Access Dashboard' }).click();

        await expect(page.getByText('Login failed').first()).toBeVisible({ timeout: 10000 });
    });
});
