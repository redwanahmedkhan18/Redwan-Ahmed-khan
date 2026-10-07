import { expect, test } from "@playwright/test";

test.describe("public site", () => {
  test("homepage renders identity, hero CTAs and curated sections", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Redwan Ahmed Khan");
    await expect(page.locator("body")).toContainText("Artificial Intelligence Engineer");

    // primary + secondary CTAs
    await expect(page.getByRole("link", { name: "View My Work" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Contact Me" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Download CV" }).first()).toBeVisible();

    // seeded featured projects appear
    await expect(page.locator("body")).toContainText("ShopMind AI");
    await expect(page.locator("body")).toContainText("Mediflow AI");
    // research with preserved status
    await expect(page.locator("body")).toContainText("CARE-RAG");
    await expect(page.locator("body")).toContainText("Working");
    // footer year is dynamic
    const year = new Date().getFullYear();
    await expect(page.locator("footer")).toContainText(`© ${year} Redwan Ahmed Khan`);
  });

  test("no fabricated statistics on homepage", async ({ page }) => {
    await page.goto("/");
    const body = await page.locator("body").innerText();
    for (const fake of ["100+ projects", "50K users", "99.99% uptime", "1M downloads", "world's best", "10x engineer"]) {
      expect(body.toLowerCase()).not.toContain(fake.toLowerCase());
    }
  });

  test("project navigation: list → case study", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("link", { name: /Mediflow AI/ }).first().click();
    await expect(page).toHaveURL(/\/projects\/mediflow-ai$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Mediflow AI");
    // honest results framing
    await expect(page.locator("body")).toContainText("Not publicly disclosed");
    // no GitHub button when no URL is configured
    await expect(page.locator("main").getByRole("link", { name: /^GitHub$/ })).toHaveCount(0);
  });

  test("research navigation: list → paper with exact authors/status", async ({ page }) => {
    await page.goto("/research");
    await expect(page.locator("body")).toContainText("Under Review");
    await page.getByRole("link", { name: /CARE-RAG/ }).first().click();
    await expect(page).toHaveURL(/\/research\/care-rag$/);
    await expect(page.locator("body")).toContainText("Khan, R.A.");
    await expect(page.locator("body")).toContainText("Working");

    await page.goto("/research/supervised-ensemble-learning-cardiac-arrhythmia");
    await expect(page.locator("body")).toContainText("Nishy, F.E.");
  });

  test("experience shows seeded facts only", async ({ page }) => {
    await page.goto("/experience");
    await expect(page.locator("body")).toContainText("Shadhin Lab LLC");
    await expect(page.locator("body")).toContainText("Intern AI Engineer");
    await expect(page.locator("body")).toContainText("CircleCI");
    await expect(page.locator("body")).toContainText("Present");
    await expect(page.locator("body")).toContainText("IUBAT");
    await expect(page.locator("body")).toContainText("3.60 / 4.00");
  });

  test("skills render categories without percentage bars", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText("Programming Languages");
    await expect(page.locator("body")).toContainText("PyTorch");
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/Python\s*9\d%/);
  });

  test("contact form validates and submits", async ({ page }) => {
    await page.goto("/contact");
    // HTML5 validation blocks empty submit
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.locator("#cf-name")).toBeVisible();

    await page.fill("#cf-name", "Playwright Tester");
    await page.fill("#cf-email", "e2e@example.com");
    await page.fill("#cf-subject", "E2E contact subject");
    await page.fill("#cf-message", "This message was submitted by the Playwright end-to-end test suite.");
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.locator('[role="status"], [aria-live="polite"]').first()).toContainText(/thanks|sent|reply/i, { timeout: 15_000 });
  });

  test("hire form submits", async ({ page }) => {
    await page.goto("/hire-me");
    await expect(page.locator("body")).toContainText("RAG systems");
    await page.fill("#hf-name", "E2E Founder");
    await page.fill("#hf-email", "founder@example.com");
    await page.selectOption("#hf-type", { index: 1 });
    await page.fill("#hf-desc", "End-to-end test project description with enough characters to pass validation rules.");
    await page.getByRole("button", { name: "Send Hire Request" }).click();
    await expect(page.locator('[aria-live="polite"]').first()).toContainText(/received|review/i, { timeout: 15_000 });
  });

  test("CV page shows honest empty state (no CV uploaded by default)", async ({ page }) => {
    await page.goto("/cv");
    const body = await page.locator("body").innerText();
    expect(body).toMatch(/not available|Download CV/i);
  });

  test("empty states for unpublished collections", async ({ page }) => {
    await page.goto("/machine-learning");
    await expect(page.locator("body")).toContainText("No machine learning projects published yet");
    await page.goto("/blog");
    await expect(page.locator("body")).toContainText("No articles published yet");
    await page.goto("/open-source");
    await expect(page.locator("body")).toContainText("No open-source contributions published yet");
  });

  test("404 page offers exploration paths", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await expect(page.locator("body")).toContainText("This route does not exist");
    await page.getByRole("navigation", { name: "Suggested destinations" }).getByRole("link", { name: "Projects" }).click();
    await expect(page).toHaveURL(/\/projects$/);
  });

  test("dark mode toggle persists", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("button", { name: "Dark theme" });
    await toggle.click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Light theme" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("mobile navigation works", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile-only");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.locator("#mobile-menu").getByRole("link", { name: "Research", exact: true }).click();
    await expect(page).toHaveURL(/\/research$/);
  });

  test("no horizontal overflow at common widths", async ({ page }) => {
    for (const width of [320, 375, 768, 1024, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });

  test("SEO artifacts are served", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    const xml = await sitemap.text();
    expect(xml).toContain("/projects/shopmind");
    expect(xml).toContain("/research/care-rag");
    expect(xml).not.toContain("/admin");

    const robots = await request.get("/robots.txt");
    const robotsText = await robots.text();
    expect(robotsText).toContain("Disallow: /admin");
    expect(robotsText).toContain("sitemap");
  });
});
