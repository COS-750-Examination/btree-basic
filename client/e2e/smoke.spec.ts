import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/** Screens 01–09 and the account page load, and have no serious accessibility violations (NFR4: WCAG 2.1 AA). */
const SCREENS = [
  '/',
  '/warm-up',
  '/lessons',
  '/lessons/1',
  '/visualiser',
  '/practice',
  '/quiz/6',
  '/ready',
  '/grove',
  '/account',
];

/**
 * Entrance animations fade text in from transparent, and axe would measure contrast mid-fade.
 * Wait until every finite animation has finished; looping ambient ones (swaying tree, drifting
 * clouds) never touch text opacity, so they are left running.
 */
async function settleAnimations(page: Page) {
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (a) => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity,
      ),
  );
}

for (const path of SCREENS) {
  test(`${path} renders without serious a11y violations`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('main')).toBeVisible();
    await settleAnimations(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test('visualiser steps through a root split', async ({ page }) => {
  await page.goto('/visualiser');
  await page.getByLabel('Example').selectOption('root-splits');
  await page.getByRole('button', { name: 'Insert' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  const next = page.getByRole('button', { name: 'Next step' });
  while (await next.isEnabled()) await next.click();
  await expect(page.getByText(/Every leaf is still on the same level/)).toBeVisible();
});

test('account button opens the account page, where the theme can be changed', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /^account/i }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.getByText('Dusk', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Dusk' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dusk');
  await page.getByText('Day', { exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Day' })).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'day');
});
