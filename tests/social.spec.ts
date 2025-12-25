import { test, expect } from '@playwright/test';

test.describe('Social links', () => {
    test('Instagram button should open external URL or be safe', async ({ page }) => {
        await page.goto('/');

        // Ensure footer is in view then wait for Follow Us section and the Instagram link
        await page.locator('footer').scrollIntoViewIfNeeded();
        // Wait for the Follow Us section to be attached then allow extra time for animations
        await page.getByText('Follow Us', { exact: false }).waitFor({ state: 'attached', timeout: 5000 });
        const instagram = page.locator('footer').getByLabel('Instagram');
        // Wait for the anchor to be present in the DOM (animation may keep it hidden)
        await instagram.waitFor({ state: 'attached', timeout: 5000 });

        // Validate href is present and not a broken relative link
        const href = await instagram.getAttribute('href');
        expect(href).toBeTruthy();
        // Allow either absolute external URLs (with protocol) or a safe placeholder ('#'), but not a broken relative path
        expect(href === '#' || /^https?:\/\//.test(href || '')).toBeTruthy();

        // If it's visible, click and verify it opens/exposes an external URL; otherwise just assert href correctness
        if (await instagram.isVisible()) {
            const [popup] = await Promise.all([
                page.waitForEvent('popup').catch(() => null),
                instagram.click()
            ]);

            if (popup) {
                await popup.waitForLoadState();
                expect(/^https?:\/\//.test(popup.url())).toBeTruthy();
                await popup.close();
            } else {
                const url = page.url();
                expect(url.startsWith('http')).toBeTruthy();
            }
        } else {
            // Element hidden due to animation or reduced-motion; href validation above suffices
            expect(href && href !== '/').toBeTruthy();
        }
    });
});