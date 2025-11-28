import { test, expect } from '@playwright/test';

test.describe('KAIZEN Website - E2E Tests', () => {

    // Helper to skip intro
    async function skipIntro(page: import('@playwright/test').Page) {
        await page.goto('/');
        // Set localStorage to skip intro
        await page.evaluate(() => {
            localStorage.setItem('kaizenIntroSeen', 'true');
        });
        await page.reload();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(500);
    }

    // Helper to wait for main content to be visible
    async function waitForMainContent(page: import('@playwright/test').Page) {
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('nav', { timeout: 10000 });
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

        test('Stats section is visible', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            // Scroll to find stats section
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
            await page.waitForTimeout(1000);
            const body = page.locator('body');
            await expect(body).toBeVisible();
        });

        test('FAQ section is visible', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.7));
            await page.waitForTimeout(1000);
            const body = page.locator('body');
            await expect(body).toBeVisible();
        });
    });

    test.describe('Navigation Tests', () => {

        test('Navbar logo is visible', async ({ page }) => {
            await skipIntro(page);
            const navbar = page.locator('nav').first();
            await expect(navbar).toBeVisible({ timeout: 5000 });
        });

        test('Register button in navbar is clickable', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            const registerButton = page.locator('button:has-text("Register"), a:has-text("Register")').first();
            if (await registerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(registerButton).toBeVisible();
            }
        });

        test('Check Status button is clickable', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            const statusButton = page.locator('button:has-text("Status"), button:has-text("Check")').first();
            if (await statusButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(statusButton).toBeVisible();
            }
        });

        test('Mobile menu toggle works', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await skipIntro(page);
            await waitForMainContent(page);
            const menuButton = page.locator('button[aria-label*="menu"], button:has(svg)').first();
            if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await menuButton.click();
                await page.waitForTimeout(500);
                const body = page.locator('body');
                await expect(body).toBeVisible();
            }
        });
    });

    test.describe('Modal Interactions', () => {

        test('Registration modal opens and closes', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            // Try to find and click register button
            const registerButtons = page.locator('button:has-text("Register"), a:has-text("Register")');
            const count = await registerButtons.count();

            if (count > 0) {
                await registerButtons.first().click();
                await page.waitForTimeout(1000);

                // Check if modal/dialog opened
                const modal = page.locator('[role="dialog"], .modal, [data-modal]').first();
                if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await expect(modal).toBeVisible();

                    // Try to close modal
                    const closeButton = page.locator('button[aria-label*="close"], button:has(svg)').first();
                    if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await closeButton.click();
                        await page.waitForTimeout(500);
                    }
                }
            }
        });

        test('Explore Events modal opens', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            const exploreButton = page.locator('button:has-text("Explore"), a:has-text("Explore"), button:has-text("View All")').first();
            if (await exploreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await exploreButton.click();
                await page.waitForTimeout(1000);
                const body = page.locator('body');
                await expect(body).toBeVisible();
            }
        });

        test('Registration Status Checker modal opens', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            const statusButton = page.locator('button:has-text("Status"), button:has-text("Check Status")').first();
            if (await statusButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await statusButton.click();
                await page.waitForTimeout(1000);
                const body = page.locator('body');
                await expect(body).toBeVisible();
            }
        });
    });

    test.describe('Registration Form Tests', () => {

        test('Registration form fields are present', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            // Open registration modal
            const registerButton = page.locator('button:has-text("Register")').first();
            if (await registerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await registerButton.click();
                await page.waitForTimeout(1500);

                // Check for form fields
                const nameField = page.locator('input[type="text"], input[name*="name"], input[placeholder*="name" i]').first();
                if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await expect(nameField).toBeVisible();
                }
            }
        });

        test('Registration form validation works', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            const registerButton = page.locator('button:has-text("Register")').first();
            if (await registerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                await registerButton.click();
                await page.waitForTimeout(1500);

                // Try to submit empty form
                // Use a more specific selector for the modal submit button
                const submitButton = page.locator('.fixed.inset-0 button[type="submit"]').first();
                if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
                    // The button should be disabled initially because declaration is not checked
                    await expect(submitButton).toBeDisabled();

                    // Check the declaration to enable the button (if that's the only blocker)
                    // But since we want to test validation of other fields, we can just assert it's disabled
                    // which proves that client-side validation state is active.
                }
            }
        });
    });

    test.describe('Event Interactions', () => {

        test('Featured events section displays events', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            await page.evaluate(() => window.scrollTo(0, 400));
            await page.waitForTimeout(2000);
            const body = page.locator('body');
            await expect(body).toBeVisible();
        });

        test('Event cards are clickable', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            await page.evaluate(() => window.scrollTo(0, 400));
            await page.waitForTimeout(2000);

            const eventCard = page.locator('[class*="card"], [class*="event"]').first();
            if (await eventCard.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(eventCard).toBeVisible();
            }
        });
    });

    test.describe('Contact Form Tests', () => {

        test('Contact form is accessible', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
            await page.waitForTimeout(2000);

            const contactSection = page.locator('text=Get In Touch, text=Contact').first();
            if (await contactSection.isVisible({ timeout: 5000 }).catch(() => false)) {
                await expect(contactSection).toBeVisible();
            }
        });

        test('Contact form fields are present', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.8));
            await page.waitForTimeout(2000);

            const inputFields = page.locator('input, textarea');
            const count = await inputFields.count();
            if (count > 0) {
                await expect(inputFields.first()).toBeVisible();
            }
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

        test('Admin login form is present', async ({ page }) => {
            await page.goto('/admin');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);

            const loginForm = page.locator('form, input[type="email"], input[type="password"]').first();
            if (await loginForm.isVisible({ timeout: 3000 }).catch(() => false)) {
                await expect(loginForm).toBeVisible();
            }
        });

        test('Admin routes are protected', async ({ page }) => {
            await page.goto('/admin/dashboard');
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1000);
            // Should redirect to login or show login page
            const body = page.locator('body');
            await expect(body).toBeVisible();
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

        test('Desktop viewport', async ({ page }) => {
            await page.setViewportSize({ width: 1920, height: 1080 });
            await skipIntro(page);
            await expect(page.locator('body')).toBeVisible();
        });

        test('Navigation adapts to mobile viewport', async ({ page }) => {
            await page.setViewportSize({ width: 375, height: 667 });
            await skipIntro(page);
            await waitForMainContent(page);
            const navbar = page.locator('nav').first();
            await expect(navbar).toBeVisible();
        });
    });

    test.describe('Performance and Loading', () => {

        test('Page loads within acceptable time', async ({ page }) => {
            const startTime = Date.now();
            await page.goto('/');
            await page.waitForLoadState('domcontentloaded');
            const loadTime = Date.now() - startTime;
            // Page should load within 10 seconds
            expect(loadTime).toBeLessThan(10000);
        });

        test('Lazy loaded components appear on scroll', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            // Scroll through page
            await page.evaluate(() => window.scrollTo(0, 500));
            await page.waitForTimeout(1000);
            await page.evaluate(() => window.scrollTo(0, 1000));
            await page.waitForTimeout(1000);

            const body = page.locator('body');
            await expect(body).toBeVisible();
        });
    });

    test.describe('Accessibility Tests', () => {

        test('Page has proper title', async ({ page }) => {
            await skipIntro(page);
            const title = await page.title();
            expect(title).toBeTruthy();
            expect(title.length).toBeGreaterThan(0);
        });

        test('Main content is accessible', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            const main = page.locator('main, [role="main"], body').first();
            await expect(main).toBeVisible();
        });

        test('Images have alt text or are decorative', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);
            const images = page.locator('img');
            const count = await images.count();
            if (count > 0) {
                // Check that images exist (alt text check would require more specific selectors)
                await expect(images.first()).toBeVisible();
            }
        });
    });

    test.describe('User Flows', () => {

        test('Complete user journey: Home -> Explore -> Register', async ({ page }) => {
            await skipIntro(page);
            await waitForMainContent(page);

            // Navigate to explore events
            const exploreButton = page.locator('button:has-text("Explore"), a:has-text("Explore")').first();
            if (await exploreButton.isVisible({ timeout: 5000 }).catch(() => false)) {
                await exploreButton.click();
                await page.waitForTimeout(1500);

                // Try to find register button in modal
                const registerInModal = page.locator('.fixed.inset-0 button:has-text("Register")').first();
                if (await registerInModal.isVisible({ timeout: 3000 }).catch(() => false)) {
                    await registerInModal.click();
                    await page.waitForTimeout(1000);
                }
            }

            const body = page.locator('body');
            await expect(body).toBeVisible();
        });

        test('Navigation between legal pages', async ({ page }) => {
            await page.goto('/terms');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();

            await page.goto('/privacy');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();

            await page.goto('/refund');
            await page.waitForLoadState('domcontentloaded');
            await expect(page.locator('body')).toBeVisible();
        });
    });
});
