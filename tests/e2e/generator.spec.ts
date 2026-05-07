import { expect, test } from "@playwright/test";

test("save without an image shows an error", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /^save$/i }).click();

  await expect(page.getByText("error: no image to save yet")).toBeVisible();
});

test("local generated image stays contained in the output frame for every ratio", async ({ page }) => {
  await page.goto("/");

  await page.locator("textarea").fill("penguin launch energy");

  for (const ratio of ["1:1", "16:9", "9:16", "21:9"]) {
    await page.getByRole("button", { name: ratio }).click();
    await page.locator('form button[type="submit"]').click();

    const image = page.getByAltText("Generated SLAPR output");
    await expect(image).toBeVisible();

    const isContained = await image.evaluate((element) => {
      const imageRect = element.getBoundingClientRect();
      const frameRect = element.parentElement?.getBoundingClientRect();
      const objectFit = window.getComputedStyle(element).objectFit;

      return Boolean(
        frameRect &&
          objectFit === "contain" &&
          imageRect.width <= frameRect.width + 1 &&
          imageRect.height <= frameRect.height + 1
      );
    });

    expect(isContained).toBe(true);
  }
});
