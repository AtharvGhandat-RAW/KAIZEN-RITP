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

        // Ensure Close menu button is not visible yet (menu closed)
        await expect(page.getByLabel('Close menu')).toBeHidden();

        await menuButton.click();
        // Wait for Close menu to appear (menu open)
        await expect(page.getByLabel('Close menu')).toBeVisible();

        // Scope to the overlay (parent of the Close menu button) to avoid ambiguous matches
        const overlay = page.getByLabel('Close menu').locator('..');
        const eventsLink = overlay.locator('a:has-text("Events")');
        await expect(eventsLink).toBeVisible();
        await eventsLink.click();

        // Menu should close (Close menu becomes hidden)
        await expect(page.getByLabel('Close menu')).toBeHidden();

        await expect(page).toHaveURL(/.*(#events|\/events)/);
    });

    test('Registration Modal fits viewport', async ({ page }) => {
        await page.getByLabel('Toggle menu').click();
        const overlay = page.getByLabel('Close menu').locator('..');
        // Check Register Now button inside the mobile menu
        const registerBtn = overlay.locator('button:has-text("Register Now")');
        await expect(registerBtn).toBeVisible();
    });
});
