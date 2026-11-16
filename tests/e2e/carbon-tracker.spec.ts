import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const reportingMonth = "2098-04";

async function openTracker(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Understand your carbon footprint." })).toBeVisible();
  await expect(page.getByLabel(/Reporting month/)).toHaveValue(/\d{4}-\d{2}/);
  await expect(page.getByRole("heading", { name: "Monthly activity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your estimate" })).toBeVisible();
}

async function enterTestActivity(page: import("@playwright/test").Page) {
  await page.getByLabel(/Reporting month/).fill(reportingMonth);
  await page.getByLabel("Electricity kWh / month").fill("100");
  await page.getByLabel("Car travel km / month (distance method)").fill("20");
  await page.getByLabel("Public transport km / month").fill("50");
  await page.getByLabel("Waste kg / month").fill("10");
}

test("loads the calculator and database-backed emission factor version", async ({ page }) => {
  await openTracker(page);
  await expect(page.getByText("Emission factor version: illustrative-v1")).toBeVisible();
  await expect(page.getByText(/Run the database setup and seed commands/)).toHaveCount(0);
});

test("switches vehicle methods without exposing both car inputs", async ({ page }) => {
  await openTracker(page);

  await expect(page.getByLabel("Car travel km / month (distance method)")).toBeVisible();
  await expect(page.getByLabel("Vehicle fuel litres / month (fuel method)")).toHaveCount(0);

  await page.getByLabel(/Vehicle calculation method/).selectOption("fuel");

  await expect(page.getByLabel("Vehicle fuel litres / month (fuel method)")).toBeVisible();
  await expect(page.getByLabel("Car travel km / month (distance method)")).toHaveCount(0);

  await page.getByLabel(/Vehicle calculation method/).selectOption("distance");
  await expect(page.getByLabel("Car travel km / month (distance method)")).toBeVisible();
});

test("calculates a footprint and displays the category breakdown", async ({ page }) => {
  await openTracker(page);
  await enterTestActivity(page);

  await page.getByRole("button", { name: "Calculate footprint" }).click();

  await expect(page.locator(".total")).toContainText("82.4");
  await expect(page.getByText("70 kg", { exact: true })).toBeVisible();
  await expect(page.getByText("7.4 kg", { exact: true })).toBeVisible();
  await expect(page.getByText("5 kg", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What to focus on" })).toBeVisible();
});

test("saves a calculation and reloads it from SQLite history", async ({ page }) => {
  await openTracker(page);
  await enterTestActivity(page);
  await page.getByRole("button", { name: "Calculate footprint" }).click();
  await expect(page.locator(".total")).toContainText("82.4");

  await page.getByRole("button", { name: "Save calculation" }).click();
  await expect(page.getByRole("status")).toHaveText("Calculation saved successfully.");
  await expect(page.locator(".history-row").filter({ hasText: "82.4 kg CO₂e" })).toBeVisible();

  await page.reload();
  await expect(page.locator(".history-row").filter({ hasText: "82.4 kg CO₂e" })).toBeVisible();
});

test("downloads CSV and PDF exports from the result panel", async ({ page }) => {
  await openTracker(page);
  await enterTestActivity(page);
  await page.getByRole("button", { name: "Calculate footprint" }).click();

  const [csvDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download CSV" }).click()
  ]);
  expect(csvDownload.suggestedFilename()).toBe(`carbon-footprint-${reportingMonth}.csv`);

  const [pdfDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download PDF" }).click()
  ]);
  expect(pdfDownload.suggestedFilename()).toBe(`carbon-footprint-${reportingMonth}.pdf`);
});

test("shows a useful message when saving fails", async ({ page }) => {
  await openTracker(page);
  await enterTestActivity(page);
  await page.getByRole("button", { name: "Calculate footprint" }).click();

  await page.route("**/api/calculations", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Test save failure." })
      });
      return;
    }
    await route.continue();
  });

  await page.getByRole("button", { name: "Save calculation" }).click();
  await expect(page.getByRole("alert")).toContainText("Test save failure.");
});

test("keeps the mobile layout within the viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile viewport check runs in the mobile project.");
  await openTracker(page);

  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth
  }));

  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  await expect(page.getByRole("button", { name: "Calculate footprint" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saved calculations" })).toBeVisible();
});

test("prevents negative activity values through native form validation", async ({ page }) => {
  await openTracker(page);
  const electricity = page.getByLabel("Electricity kWh / month");
  await electricity.fill("-10");

  const isValid = await electricity.evaluate((element: HTMLInputElement) => element.checkValidity());
  expect(isValid).toBe(false);
});

test("has no WCAG 2.1 A/AA accessibility violations on the calculator and results", async ({ page }) => {
  await openTracker(page);

  const initialAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(initialAudit.violations).toEqual([]);

  await enterTestActivity(page);
  await page.getByRole("button", { name: "Calculate footprint" }).click();
  await expect(page.locator(".total")).toContainText("82.4");

  const resultsAudit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(resultsAudit.violations).toEqual([]);
});
