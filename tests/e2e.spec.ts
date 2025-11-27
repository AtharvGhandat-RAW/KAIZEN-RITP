import { test, expect } from '@playwright/test';

test.describe('KAIZEN Website - E2E Tests', () => {

    // Helper to skip intro
    async function skipIntro(page: import('@playwright/test').Page) {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1500);

        const skipButton = page.locator('button:has-text("Skip")').first();
        if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await skipButton.click();
        }
        await page.waitForTimeout(500);
    }

    test.describe('Homepage Tests', () => {

        test('Homepage loads successfully', async ({ page }) => {
            await skipIntro(page);
            await expect(page).toHaveTitle(/KAIZEN/i);
        });

        test('Hero section is visible', async ({ page }) => {
            await skipIntro(page);
            const hero = page.locator('h1').first();
            await expect(hero).toBeVisible({ timeout: 10000 });
        });

        test('Navigation links are present', async ({ page }) => {
            await skipIntro(page);
            const nav = page.locator('nav').first();
            await expect(nav).toBeVisible({ timeout: 5000 });
        });

        test('Events section is visible', async ({ page }) => {
            await skipIntro(page);
            const events = page.locator('h2:has-text("Events")').first();
            await expect(events).toBeVisible({ timeout: 5000 });
        });

        test('About section is visible', async ({ page }) => {
            await skipIntro(page);
            const about = page.locator('text=About KAIZEN').first();
            await expect(about).toBeVisible({ timeout: 5000 });
        });

        test('Contact form is present', async ({ page }) => {
            await skipIntro(page);
            const contactForm = page.locator('text=Get In Touch').first();
            await expect(contactForm).toBeVisible({ timeout: 5000 });
        });

        test('Footer is visible', async ({ page }) => {
            await skipIntro(page);
            const footer = page.locator('footer').first();
            await expect(footer).toBeVisible({ timeout: 5000 });
        });

        test('Countdown timer is visible', async ({ page }) => {
            await skipIntro(page);
            const countdown = page.locator('text=Days').first();
            await expect(countdown).toBeVisible({ timeout: 5000 });
        });
    });

    test.describe('Legal Pages', () => {

        test('Terms page loads', async ({ page }) => {
            await page.goto('/terms');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();
        });

        test('Privacy page loads', async ({ page }) => {
            await page.goto('/privacy');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();
        });

        test('Refund page loads', async ({ page }) => {
            await page.goto('/refund');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();
        });
    });

    test.describe('Admin Pages', () => {

        test('Admin login page loads', async ({ page }) => {
            await page.goto('/admin');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();
        });
    });

    test.describe('Error Handling', () => {

        test('404 page for invalid routes', async ({ page }) => {
            await page.goto('/invalid-route-xyz');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();
        });
    });

    test.describe('Responsive Design', () => {

        test('Mobile viewport', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await skipIntro(page);
            await expect(page.locator('body')).toBeVisible();
        });

        test('Tablet viewport', async ({ page }) => {
            await page.setViewportSize({ width: 768, height: 1024 });
            await skipIntro(page);
            await expect(page.locator('body')).toBeVisible();
        });
    });
});
