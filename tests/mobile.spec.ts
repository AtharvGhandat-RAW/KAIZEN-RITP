import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
    test.skip(({ isMobile }) => !isMobile, 'Mobile only tests');

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            window.localStorage.setItem('kaizenIntroSeen', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('Navbar collapses into hamburger menu', async ({ page }) => {
        const menuButton = page.getByLabel('Toggle menu');
        await expect(menuButton).toBeVisible();

        // Use specific locator for mobile menu overlay
        const mobileMenu = page.locator('.fixed.inset-0.z-40');
        await expect(mobileMenu).toBeHidden();

        await menuButton.click();
        await expect(mobileMenu).toBeVisible();

        await expect(mobileMenu.getByRole('link', { name: /events/i })).toBeVisible();

        // Click a link
        await mobileMenu.getByRole('link', { name: /events/i }).click();

        // Menu should close
        await expect(mobileMenu).toBeHidden();

        await expect(page).toHaveURL(/.*#events/);
    });

    test('Registration Modal fits viewport', async ({ page }) => {
        await page.getByLabel('Toggle menu').click();
        const mobileMenu = page.locator('.fixed.inset-0.z-40');

        // Check Register Now button in mobile menu
        await expect(mobileMenu.getByRole('button', { name: /register now/i })).toBeVisible();
    });
});
