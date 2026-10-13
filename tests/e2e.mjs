import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173";
const executablePath =
  process.env.CHROMIUM_EXECUTABLE ||
  process.env.CHROMIUM_PATH ||
  (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox"],
});
let passed = 0;

async function check(name, operation) {
  await operation();
  console.log(`✓ ${name}`);
  passed += 1;
}

async function freshPage(width = 1440) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
  });
  const page = await context.newPage();
  // Smoke tests exercise bundled translations and never depend on an external service.
  await page.route("**/api/translate", (route) => route.abort());
  await page.goto(baseURL);
  await page
    .getByRole("button", { name: "Только необходимые", exact: true })
    .click();
  await page.locator(".consent-banner").waitFor({ state: "hidden" });
  return { context, page };
}

async function openReader(page) {
  await page
    .getByRole("button", { name: /^(Начать путешествие|Продолжить чтение)$/ })
    .click();
  await page.locator(".book-text").waitFor();
}

async function translateChildhood(page) {
  await page
    .locator(".reader-word")
    .filter({ hasText: /^Childhood$/ })
    .first()
    .click();
  await page.locator(".translated-text").waitFor();
  assert.equal(
    await page.locator(".translated-text").innerText(),
    "балалық шақ",
  );
}

async function noOverflow(page) {
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
}

try {
  const { context, page } = await freshPage();
  await check("Refusal stores only the consent decision", async () => {
    assert.deepEqual(
      (await context.cookies()).map((cookie) => cookie.name),
      ["lumi_consent"],
    );
  });
  await openReader(page);
  await check("Word and sentence context translate into Kazakh", async () => {
    assert.equal(
      await page.getByRole("combobox", { name: "Язык перевода" }).inputValue(),
      "kk",
    );
    await translateChildhood(page);
    assert.match(
      await page.locator(".context-box").innerText(),
      /Балалық шақ адамға ерекше зейін береді/,
    );
  });
  await page
    .getByRole("button", { name: "В мой словарь", exact: true })
    .click();
  await page.getByRole("button", { name: /Мой словарь/ }).click();
  await check(
    "Saved session word appears in dictionary and practice",
    async () => {
      await page.locator(".word-card").waitFor();
      assert.equal(await page.locator(".word-card").count(), 1);
      await page
        .getByRole("button", { name: "Повторить слова", exact: true })
        .click();
      await page
        .getByRole("button", {
          name: "Показать или скрыть перевод",
          exact: true,
        })
        .click();
      await page.locator(".flashcard.revealed").waitFor();
      assert.match(await page.locator(".flashcard").innerText(), /балалық шақ/);
      assert.deepEqual(
        (await context.cookies()).map((cookie) => cookie.name),
        ["lumi_consent"],
      );
    },
  );
  await page.reload();
  await page.getByRole("button", { name: /Мой словарь/ }).click();
  await check(
    "Refused persistence resets saved words after reload",
    async () => {
      await page.locator(".large-empty").waitFor();
      assert.equal(await page.locator(".word-card").count(), 0);
    },
  );
  await context.close();

  const { context: preferencesContext, page: preferencesPage } =
    await freshPage();
  await preferencesPage
    .getByRole("button", { name: "Cookies и приватность", exact: true })
    .click();
  await preferencesPage
    .getByRole("switch", { name: "Мой прогресс и слова", exact: true })
    .click();
  await preferencesPage
    .getByRole("button", { name: "Сохранить мой выбор", exact: true })
    .click();
  await preferencesPage.locator(".consent-dialog").waitFor({ state: "hidden" });
  await openReader(preferencesPage);
  await translateChildhood(preferencesPage);
  await preferencesPage
    .getByRole("button", { name: "В мой словарь", exact: true })
    .click();
  await preferencesPage
    .getByRole("button", { name: "Тема: тёмная", exact: true })
    .click();
  await preferencesPage
    .getByRole("button", { name: "Отметить прочитанной", exact: true })
    .click();
  await preferencesPage
    .getByRole("button", { name: "Следующая", exact: true })
    .click();
  await preferencesPage
    .locator(".chapter-toggle")
    .filter({ hasText: "Глава II" })
    .waitFor();
  await preferencesPage.reload();
  await openReader(preferencesPage);
  await check(
    "Preference consent restores chapter and reader theme",
    async () => {
      await preferencesPage.locator(".app-shell.theme-dark").waitFor();
      assert.equal(
        await preferencesPage.locator(".app-shell.theme-dark").count(),
        1,
      );
      assert.match(
        await preferencesPage.locator(".chapter-toggle").innerText(),
        /II/,
      );
      assert.equal(
        (await preferencesContext.cookies()).some(
          (cookie) => cookie.name === "reader_visitor",
        ),
        false,
      );
    },
  );
  await preferencesPage.getByRole("button", { name: /Мой словарь/ }).click();
  await check(
    "Preference consent restores the personal dictionary",
    async () => {
      await preferencesPage.locator(".word-card").waitFor();
      assert.equal(await preferencesPage.locator(".word-card").count(), 1);
      assert.match(
        await preferencesPage.locator(".word-card").innerText(),
        /балалық шақ/,
      );
    },
  );
  await preferencesContext.close();

  for (const width of [320, 390]) {
    const { context: mobileContext, page: mobile } = await freshPage(width);
    await check(`Mobile library at ${width}px has no overflow`, () =>
      noOverflow(mobile),
    );
    await openReader(mobile);
    await translateChildhood(mobile);
    await check(
      `Mobile translation at ${width}px sits above navigation`,
      async () => {
        await noOverflow(mobile);
        const geometry = await mobile
          .locator(".reader-aside")
          .evaluate((element) => ({
            bottom: element.getBoundingClientRect().bottom,
            viewport: innerHeight,
          }));
        assert.ok(
          Math.abs(geometry.viewport - geometry.bottom - 67) < 2,
          JSON.stringify(geometry),
        );
      },
    );
    await mobileContext.close();
  }
  console.log(`\n${passed} browser checks passed.`);
} finally {
  await browser.close();
}
