import { test, expect } from "@playwright/test";

test.describe("ليجند شوكولا — site", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("RTL + Arabic + title", async ({ page }) => {
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page).toHaveTitle(/ليجند شوكولا/);
  });

  test("hero + primary CTAs render", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("هدية");
    await expect(page.getByRole("link", { name: /اطلب الآن/ }).first()).toBeVisible();
  });

  test("all content images resolve (no broken)", async ({ page }) => {
    // Force-eager every lazy image so off-screen assets load, then wait.
    await page.evaluate(() => {
      Array.from(document.images).forEach((el) => {
        el.loading = "eager";
        // Re-trigger fetch for any that hadn't started.
        const src = el.getAttribute("src");
        if (src) el.setAttribute("src", src);
      });
      window.scrollTo(0, document.body.scrollHeight);
    });
    // Exclude the lightbox <img> which intentionally starts with an empty src.
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            Array.from(document.images)
              .filter((el) => !el.closest("[data-lightbox]"))
              .filter((el) => !(el.complete && el.naturalWidth > 0))
              .map((el) => el.currentSrc || el.src)
          ),
        { timeout: 10000 }
      )
      .toEqual([]);
    const total = await page.evaluate(
      () => Array.from(document.images).filter((el) => !el.closest("[data-lightbox]")).length
    );
    expect(total).toBeGreaterThan(0);
  });

  test("no horizontal scroll at 390px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1
    );
    expect(overflow).toBeFalsy();
  });

  test("full-screen mobile menu opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    const burger = page.locator("[data-burger]");
    await burger.click();
    const menu = page.locator("[data-mobile-menu]");
    await expect(menu).toHaveAttribute("data-open", "true");
    const box = await menu.boundingBox();
    expect(box?.width).toBeGreaterThan(360);
    await page.locator("[data-menu-close]").click();
    await expect(menu).toHaveAttribute("data-open", "false");
  });

  test("order form validates required fields", async ({ page }) => {
    await page.locator('#order button[type="submit"]').click();
    await expect(page.locator('.field[data-invalid="true"]').first()).toBeVisible();
  });

  test("order form fills and stores to localStorage", async ({ page, context }) => {
    await context.grantPermissions([]);
    await page.fill("#f-name", "نورة");
    await page.fill("#f-phone", "0501234567");
    await page.selectOption("#f-item", "صندوق / علبة هدايا");
    const popupPromise = page.waitForEvent("popup").catch(() => null);
    await page.locator('#order button[type="submit"]').click();
    await expect(page.locator("[data-toast]")).toHaveAttribute("data-show", "true");
    const stored = await page.evaluate(() => localStorage.getItem("legend_orders"));
    expect(stored).toContain("نورة");
    await popupPromise;
  });

  test("JSON-LD has honest rating 4.3 / 421", async ({ page }) => {
    const ld = await page.locator('script[type="application/ld+json"]').textContent();
    expect(ld).toContain("4.3");
    expect(ld).toContain("421");
  });

  test("404 page is branded", async ({ page }) => {
    await page.goto("/404.html");
    await expect(page.locator(".nf__code")).toHaveText("404");
    await expect(page.getByRole("link", { name: /العودة للرئيسية/ })).toBeVisible();
  });
});
