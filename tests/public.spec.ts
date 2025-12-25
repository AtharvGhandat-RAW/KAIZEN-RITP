import { test, expect } from '@playwright/test';

test.describe('Public Interface', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => {
            window.localStorage.setItem('kaizenIntroSeen', 'true');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');
    });

    test('Hero section is visible', async ({ page }) => {
        const heroTitle = page.locator('.kaizen-title');
        await expect(heroTitle).toBeVisible({ timeout: 10000 });
        await expect(heroTitle).toHaveText(/KAIZEN/i);
    });

    test('Navigation works', async ({ page, isMobile }) => {
        if (isMobile) {
            const menuButton = page.getByLabel('Toggle menu');
            await expect(menuButton).toBeVisible();
            await menuButton.click();

            // Wait for close button to ensure menu opened
            await expect(page.getByLabel('Close menu')).toBeVisible();
            const overlay = page.getByLabel('Close menu').locator('..');
            const eventsLink = overlay.locator('a:has-text("Events")');
            await expect(eventsLink).toBeVisible();
            await eventsLink.click();
        } else {
            const eventsLink = page.locator('nav .hidden.lg\\:flex').getByRole('link', { name: 'Events' });
            await expect(eventsLink).toBeVisible();
            await eventsLink.click();
        }

        await expect(page).toHaveURL(/.*(#events|\/events)/);

        await expect(page.locator('#events')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();

        // Footer check: ensure the footer heading with the site name is present
        await expect(page.locator('footer').getByRole('heading', { name: /KAIZEN/i })).toBeVisible();
    });

    test('Footer is present', async ({ page }) => {
        await expect(page.locator('footer')).toBeVisible();
        // Ensure footer heading with site name is present
        await expect(page.locator('footer').getByRole('heading', { name: /KAIZEN/i })).toBeVisible();
    });
});
