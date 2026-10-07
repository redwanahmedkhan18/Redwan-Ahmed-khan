import { chromium } from "@playwright/test";

const shots = [
  { url: "/", file: "home-light.png", dark: false, full: true },
  { url: "/", file: "home-dark.png", dark: true, full: true },
  { url: "/projects/shopmind", file: "project-light.png", dark: false, full: true },
  { url: "/admin", file: "admin-login.png", dark: false, full: false },
];

const browser = await chromium.launch();
for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: s.dark ? "dark" : "light",
  });
  const page = await ctx.newPage();
  await page.addInitScript((dark) => {
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, s.dark);
  await page.goto(`http://localhost:3000${s.url}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `e2e/screenshots/${s.file}`, fullPage: s.full });
  console.log("saved", s.file);
  await ctx.close();
}

// Admin dashboard (logged in)
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/admin/login");
await page.getByLabel("Email").fill("admin@example.com");
await page.getByLabel("Password").fill("ChangeMe!123");
await page.getByRole("button", { name: "Sign in" }).click();
await page.waitForURL(/admin/);
await page.waitForTimeout(1500);
await page.screenshot({ path: "e2e/screenshots/admin-dashboard.png", fullPage: true });
console.log("saved admin-dashboard.png");
await browser.close();
