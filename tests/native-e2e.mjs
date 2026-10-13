import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173/";
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
    viewport: { width, height: 900 },
  });
  await context.addInitScript(() => {
    // Verify the UI passes the requested English text to browser speech synthesis.
    // Headless browsers do not provide a dependable installed voice.
    window.__spokenPhrases = [];
    window.__utterances = [];
    window.__holdSpeech = false;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        getVoices: () => [],
        cancel: () => {},
        speak: (utterance) => {
          window.__utterances.push(utterance);
          window.__spokenPhrases.push({
            text: utterance.text,
            lang: utterance.lang,
          });
          if (!window.__holdSpeech) {
            setTimeout(() => utterance.onend?.(), 0);
          }
        },
      },
    });
  });
  const page = await context.newPage();
  await page.route("**/api/translate", (route) => route.abort());
  await page.route("https://api.mymemory.translated.net/**", (route) =>
    route.abort(),
  );
  await page.goto(baseURL);
  await page
    .getByRole("button", { name: "Только необходимые", exact: true })
    .click();
  await page.locator(".consent-banner").waitFor({ state: "hidden" });
  return { context, page };
}

async function openNative(page) {
  await page
    .getByRole("button", { name: "Говорить как носитель", exact: true })
    .click();
  await page.locator(".native-situation-card").first().waitFor();
}

async function openCafe(page) {
  await page.locator("#native-situation-cafe").click();
  await page.locator(".native-phrase").nth(9).waitFor();
}

async function noOverflow(page) {
  const metrics = await page.evaluate(() => ({
    viewport: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  assert.ok(metrics.scroll <= metrics.viewport, JSON.stringify(metrics));
}

try {
  const { context, page } = await freshPage();
  await openNative(page);
  await check("Situation library and topic filters are usable", async () => {
    assert.equal(await page.locator(".native-situation-card").count(), 24);
    const filters = page.locator(".native-filter");
    for (let index = 1; index < (await filters.count()); index += 1) {
      await filters.nth(index).click();
      assert.equal(
        await filters.nth(index).getAttribute("aria-pressed"),
        "true",
      );
      const count = await page.locator(".native-situation-card").count();
      assert.ok(count > 0 && count < 24);
    }
    await filters.first().click();
    assert.equal(await page.locator(".native-situation-card").count(), 24);
  });

  await check(
    "English, Russian and Kazakh search open the correct context",
    async () => {
      const search = page.getByRole("searchbox", {
        name: "Поиск ситуаций и фраз",
      });
      for (const query of ["grab a coffee", "без кофеина", "сұлы сүті"]) {
        await search.fill(query);
        await openCafe(page);
        assert.equal(await page.locator(".native-phrase").count(), 10);
        assert.ok((await page.locator(".native-phrase.is-match").count()) > 0);
        await page
          .getByRole("button", { name: "Все ситуации", exact: true })
          .click();
        assert.equal(await search.inputValue(), query);
        await page.waitForFunction(
          () => document.activeElement?.id === "native-situation-cafe",
        );
        assert.equal(
          await page.evaluate(() => document.activeElement?.id),
          "native-situation-cafe",
        );
      }
      await search.fill("zqxv-no-such-phrase");
      assert.equal(await page.locator(".native-situation-card").count(), 0);
      await page
        .getByRole("button", { name: "Показать все ситуации", exact: true })
        .click();
      assert.equal(await search.inputValue(), "");
      assert.equal(await page.locator(".native-situation-card").count(), 24);
    },
  );

  await check(
    "Every situation exposes exactly ten expressions with examples",
    async () => {
      const ids = await page
        .locator(".native-situation-card")
        .evaluateAll((cards) => cards.map((card) => card.id));
      for (const id of ids) {
        await page.locator(`#${id}`).click();
        await page.locator(".native-phrase").nth(9).waitFor();
        assert.equal(await page.locator(".native-phrase").count(), 10, id);
        assert.equal(
          await page.locator(".native-example p[lang=en]").count(),
          10,
          id,
        );
        assert.equal(await page.locator(".native-usage").count(), 10, id);
        await page
          .getByRole("button", { name: "Все ситуации", exact: true })
          .click();
      }
    },
  );

  await openCafe(page);
  const firstPhrase = page.locator(".native-phrase").first();
  await check(
    "Translation defaults to Kazakh and switches to Russian",
    async () => {
      const language = page.getByRole("combobox", {
        name: "Язык перевода фраз",
      });
      assert.equal(await language.inputValue(), "kk");
      assert.equal(
        await firstPhrase.locator(".native-phrase-translation").innerText(),
        "кофе ішіп алу",
      );
      await language.selectOption("ru");
      assert.equal(
        await firstPhrase.locator(".native-phrase-translation").innerText(),
        "выпить кофе",
      );
      await language.selectOption("kk");
    },
  );

  await check(
    "Listen sends each expression to English speech synthesis",
    async () => {
      await firstPhrase
        .getByRole("button", { name: "Послушать: grab a coffee", exact: true })
        .click();
      await page.waitForFunction(() => window.__spokenPhrases.length === 1);
      assert.deepEqual(await page.evaluate(() => window.__spokenPhrases[0]), {
        text: "grab a coffee",
        lang: "en-US",
      });
      await page.evaluate(() => {
        window.__holdSpeech = true;
      });
      await firstPhrase
        .getByRole("button", { name: "Послушать: grab a coffee", exact: true })
        .click();
      await page
        .locator(".native-phrase")
        .nth(1)
        .getByRole("button", {
          name: "Послушать: Could I get a latte, please?",
          exact: true,
        })
        .click();
      assert.equal(
        (await page.evaluate(() => window.__spokenPhrases)).at(-1).text,
        "Could I get a latte, please?",
      );
      await page.evaluate(() => {
        window.__utterances.at(-2).onerror?.({ error: "synthesis-failed" });
        window.__utterances.at(-2).onend?.();
      });
      assert.equal(
        await page
          .getByText(
            "Голос недоступен. Проверьте настройки озвучивания браузера.",
            { exact: true },
          )
          .count(),
        0,
      );
    },
  );

  await firstPhrase
    .getByRole("button", {
      name: "Сохранить в словарь: grab a coffee",
      exact: true,
    })
    .click();
  await check(
    "Saving toggles correctly and feeds dictionary and flashcards",
    async () => {
      const remove = firstPhrase.getByRole("button", {
        name: "Убрать из словаря: grab a coffee",
        exact: true,
      });
      assert.equal(await remove.getAttribute("aria-pressed"), "true");
      await remove.click();
      const save = firstPhrase.getByRole("button", {
        name: "Сохранить в словарь: grab a coffee",
        exact: true,
      });
      assert.equal(await save.getAttribute("aria-pressed"), "false");
      await save.click();
      await page
        .getByRole("button", { name: "Мой словарь", exact: true })
        .click();
      await page.locator(".word-card").waitFor();
      assert.equal(await page.locator(".word-card").count(), 1);
      assert.match(
        await page.locator(".word-card").innerText(),
        /grab a coffee/,
      );
      assert.match(
        await page.locator(".word-card").innerText(),
        /кофе ішіп алу/,
      );
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
      assert.match(
        await page.locator(".flashcard").innerText(),
        /кофе ішіп алу/,
      );
      assert.deepEqual(
        (await context.cookies()).map((cookie) => cookie.name),
        ["lumi_consent"],
      );
    },
  );
  await context.close();

  const { context: preferencesContext, page: preferences } = await freshPage();
  await preferences
    .getByRole("button", { name: "Cookies и приватность", exact: true })
    .click();
  await preferences
    .getByRole("switch", { name: "Мой прогресс и слова", exact: true })
    .click();
  await preferences
    .getByRole("button", { name: "Сохранить мой выбор", exact: true })
    .click();
  await preferences.locator(".consent-dialog").waitFor({ state: "hidden" });
  await openNative(preferences);
  await openCafe(preferences);
  await preferences
    .getByRole("combobox", { name: "Язык перевода фраз" })
    .selectOption("ru");
  await preferences
    .getByRole("button", {
      name: "Сохранить в словарь: grab a coffee",
      exact: true,
    })
    .click();
  await preferences.reload();
  await openNative(preferences);
  await openCafe(preferences);
  await check(
    "Consented cookies restore phrase language and saved state after reload",
    async () => {
      assert.equal(
        await preferences
          .getByRole("combobox", { name: "Язык перевода фраз" })
          .inputValue(),
        "ru",
      );
      assert.equal(
        await preferences
          .getByRole("button", {
            name: "Убрать из словаря: grab a coffee",
            exact: true,
          })
          .getAttribute("aria-pressed"),
        "true",
      );
      await preferences
        .getByRole("button", { name: "Мой словарь", exact: true })
        .click();
      await preferences.locator(".word-card").waitFor();
      assert.match(
        await preferences.locator(".word-card").innerText(),
        /выпить кофе/,
      );
      assert.equal(
        (await preferencesContext.cookies()).some(
          (cookie) => cookie.name === "reader_visitor",
        ),
        false,
      );
    },
  );
  await preferencesContext.close();

  for (const width of [320, 390, 768, 1440]) {
    const { context: responsiveContext, page: responsive } =
      await freshPage(width);
    await openNative(responsive);
    await check(
      `Library and situation at ${width}px keep readable touch controls without overflow`,
      async () => {
        await noOverflow(responsive);
        if (width <= 1100) {
          assert.equal(
            await responsive.locator(".main-nav .nav-item:visible").count(),
            5,
          );
        }
        await openCafe(responsive);
        await noOverflow(responsive);
        const typography = await responsive
          .locator(".native-phrase-translation")
          .first()
          .evaluate((element) =>
            parseFloat(getComputedStyle(element).fontSize),
          );
        assert.ok(typography >= 16, `${typography}px`);
        const targets = await responsive
          .locator(".native-phrase-actions button")
          .evaluateAll((buttons) =>
            buttons.map((button) => ({
              width: button.getBoundingClientRect().width,
              height: button.getBoundingClientRect().height,
            })),
          );
        assert.ok(
          targets.every((target) => target.width >= 44 && target.height >= 44),
          JSON.stringify(targets),
        );
      },
    );
    if (width <= 1100) {
      await check(
        `More menu at ${width}px supports keyboard and secondary categories`,
        async () => {
          const more = responsive.getByRole("button", {
            name: "Другие разделы",
            exact: true,
          });
          await more.click();
          const menu = responsive.getByRole("dialog", {
            name: "Другие разделы",
            exact: true,
          });
          await menu.waitFor();
          await noOverflow(responsive);
          assert.equal(
            await responsive.evaluate(() =>
              document.activeElement?.getAttribute("aria-label"),
            ),
            "Закрыть меню разделов",
          );
          await responsive.keyboard.press("Tab");
          assert.equal(
            await menu.evaluate((dialog) =>
              dialog.contains(document.activeElement),
            ),
            true,
          );
          await responsive.keyboard.press("Tab");
          await responsive.keyboard.press("Escape");
          await menu.waitFor({ state: "hidden" });
          assert.equal(await more.getAttribute("aria-expanded"), "false");
          assert.equal(
            await responsive.evaluate(() =>
              document.activeElement?.getAttribute("aria-label"),
            ),
            "Другие разделы",
          );
          await more.click();
          await menu.getByRole("button", { name: /Аудирование/ }).click();
          await menu.waitFor({ state: "hidden" });
          await responsive
            .getByRole("heading", { name: /Слушай историю/ })
            .waitFor();
          await more.click();
          await menu.getByRole("button", { name: /Моё пространство/ }).click();
          await menu.waitFor({ state: "hidden" });
          await responsive.locator(".overview-stats").waitFor();
          await more.click();
          await responsive.setViewportSize({ width: 1440, height: 900 });
          await menu.waitFor({ state: "hidden" });
          await responsive.waitForFunction(
            () => !document.querySelector(".mobile-more-dialog").open,
          );
          assert.equal(
            await responsive.evaluate(
              () => document.querySelector(".mobile-more-dialog").open,
            ),
            false,
          );
          await responsive
            .getByRole("button", { name: "Говорить как носитель", exact: true })
            .click();
          await responsive.locator(".native-situation-card").first().waitFor();
        },
      );
    }
    await responsiveContext.close();
  }
  console.log(`\n${passed} native-speaking browser checks passed.`);
} finally {
  await browser.close();
}
