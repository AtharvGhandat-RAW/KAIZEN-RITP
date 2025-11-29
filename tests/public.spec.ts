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

            const mobileMenu = page.locator('.fixed.inset-0.z-40');
            const eventsLink = mobileMenu.getByRole('link', { name: 'Events' });
            await expect(eventsLink).toBeVisible();
            await eventsLink.click();
        } else {
            const eventsLink = page.locator('nav .hidden.lg\\:flex').getByRole('link', { name: 'Events' });
            await expect(eventsLink).toBeVisible();
            await eventsLink.click();
        }

        await expect(page).toHaveURL(/.*#events/);

        await expect(page.locator('#events')).toBeVisible();
        await expect(page.getByRole('heading', { name: /Events/i })).toBeVisible();
    });

    test('Footer is present', async ({ page }) => {
        await expect(page.locator('footer')).toBeVisible();
        await expect(page.getByText(/KAIZEN 2025/i)).toBeVisible();
    });
});
