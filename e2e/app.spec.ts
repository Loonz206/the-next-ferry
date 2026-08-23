import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Mock the weather API so e2e runs are deterministic and offline-safe.
  await page.route('https://api.open-meteo.com/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        current: {
          temperature_2m: 58.3,
          apparent_temperature: 55.1,
          wind_speed_10m: 12.4,
          weather_code: 2,
        },
      }),
    });
  });
});

test('renders app header', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /The Next Ferry/i })).toBeVisible();
  await expect(page.getByText(/Bremerton ↔ Seattle/i)).toBeVisible();
});

test('loads and renders the ferry schedule', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /Passenger fares/i })).toBeVisible();
  await expect(page.getByText(/Kitsap Fast Ferry/i).first()).toBeVisible();

  const departureTimes = page.getByText(/^\d{1,2}:\d{2} (AM|PM)$/);
  await expect(departureTimes.first()).toBeVisible();
  expect(await departureTimes.count()).toBeGreaterThan(0);
});

test('toggles direction to westbound departures', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Passenger fares/i })).toBeVisible();

  await page.getByRole('button', { name: /Seattle → Bremerton/i }).click();
  await expect(page.getByRole('button', { name: /Seattle → Bremerton/i })).toHaveClass(/active/);
});

test('shows weather widget with mocked data', async ({ page }) => {
  await page.goto('/');
  const widget = page.getByRole('region', { name: /Current weather at ferry terminals/i });
  await expect(widget).toBeVisible();
  await expect(widget).toContainText('58°F');
});
