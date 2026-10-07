import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@example.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "ChangeMe!123";

test.describe("admin CMS", () => {
  test("admin dashboard is protected — redirects to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 15_000 });
  });

  test("login with wrong password shows an error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", "DefinitelyWrong123!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(/invalid/i);
  });

  test("login → dashboard shows real counts", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/, { timeout: 15_000 });
    await expect(page.locator("body")).toContainText("Projects");
    await expect(page.locator("body")).toContainText("Research");
  });

  test("full CRUD + publishing workflow on projects", async ({ page }) => {
    // login
    await page.goto("/admin/login");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/, { timeout: 15_000 });

    const name = `E2E Project ${Date.now()}`;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    await page.goto("/admin/projects");
    await page.getByRole("button", { name: "+ New Project" }).click();
    await page.fill("#f-name", name);
    await page.fill("#f-short_description", "Created by the Playwright E2E suite.");
    await page.getByRole("button", { name: "Create project" }).click();
    await expect(page.locator('[role="status"]')).toContainText("created as draft", { timeout: 10_000 });
    await expect(page.locator("table")).toContainText(name);

    // draft is NOT visible publicly
    const pub = await page.request.get(`/projects/${slug}`);
    expect(pub.status()).toBe(404);

    // publish
    const row = page.locator("tr", { hasText: name });
    await row.getByRole("button", { name: "Publish" }).click();
    await expect(row.locator("text=published")).toBeVisible({ timeout: 10_000 });

    // now public (allow ISR revalidation)
    await expect(async () => {
      const res = await page.request.get(`/projects/${slug}`);
      expect(res.status()).toBe(200);
    }).toPass({ timeout: 45_000 });

    // edit
    await row.getByRole("button", { name: "Edit" }).click();
    await page.fill("#f-short_description", "Updated by E2E.");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.locator('[role="status"]')).toContainText("updated", { timeout: 10_000 });

    // delete
    page.once("dialog", (d) => void d.accept());
    await row.getByRole("button", { name: "Delete" }).click();
    await expect(page.locator('[role="status"]')).toContainText("deleted", { timeout: 10_000 });
    await expect(page.locator("table")).not.toContainText(name);
  });

  test("education enforces date rules in the UI", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/, { timeout: 15_000 });

    await page.goto("/admin/education");
    await page.getByRole("button", { name: "+ New Education entry" }).click();
    await page.fill("#f-institution_name", "E2E University");
    await page.fill("#f-degree", "BSc");
    await page.selectOption("#f-enrollment_status", "Currently Studying");
    await page.fill("#f-end_date", "2026-01-01");
    await page.getByRole("button", { name: "Create education entry" }).click();
    await expect(page.locator('form [role="alert"]')).toContainText(/end_date|NULL/i, { timeout: 10_000 });
    await page.getByRole("button", { name: "Cancel" }).click();
  });

  test("logout clears the session", async ({ page }) => {
    await page.goto("/admin/login");
    await page.fill("#email", ADMIN_EMAIL);
    await page.fill("#password", ADMIN_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/dashboard$/, { timeout: 15_000 });
    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 15_000 });
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/admin\/login$/, { timeout: 15_000 });
  });
});
