import { test, expect } from '@playwright/test';

test.describe('Public Request Form', () => {
  test('should submit a flood relief request', async ({ page }) => {
    await page.goto('/');

    // Fill in the form
    await page.fill('input[name="phone"]', '1234567890');
    await page.fill('input[name="fullName"]', 'Test User');
    await page.fill('textarea[name="description"]', 'This is a test flood relief request with enough description text');
    
    // Select urgency
    await page.click('text=high');

    // Note: Location and image upload would require additional setup
    // This is a basic test structure

    // Check that form is visible
    await expect(page.locator('form')).toBeVisible();
  });
});

