import { expect, test } from "@playwright/test";

test("latent card core flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("button", { name: "Sign in with Apple" })).toBeVisible();
  await page.getByRole("button", { name: "Sign in with Apple" }).click();

  await page.getByRole("button", { name: /Create Card \(Private card\)/ }).click();
  await expect(page.getByText("Frames:")).toBeVisible();

  await page.getByRole("button", { name: "Capture Frame" }).click();
  await expect(page.getByText("1 / 24")).toBeVisible();

  await expect(page.getByText("Frames stay hidden until development.")).toBeVisible();
});
