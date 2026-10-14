import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";

const baseURL = process.env.BASE_URL || "http://127.0.0.1:5173/";
const screenshotDirectory = process.env.SCREENSHOTS_DIR;
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

async function assertHiddenAnswers(page) {
  assert.equal(await page.locator(".native-answer h3[lang=en]").count(), 0);
  assert.equal(await page.locator(".native-phrase-translation").count(), 0);
  assert.equal(await page.locator(".native-example").count(), 0);
  assert.equal(await page.locator(".native-memory-tip").count(), 0);
  assert.equal(await page.locator(".native-phrase-actions button").count(), 0);
  assert.equal(await page.locator(".native-simple-english").count(), 10);
  assert.equal(await page.locator(".native-simple-translation").count(), 10);
  assert.equal(await page.locator(".native-simple-listen").count(), 10);
  for (const reveal of await page.locator(".native-reveal").all()) {
    assert.equal(await reveal.getAttribute("aria-expanded"), "false");
    const controlledId = await reveal.getAttribute("aria-controls");
    assert.ok(controlledId);
    assert.equal(await page.locator(`#${controlledId}`).count(), 1);
  }
}

async function captureCard(page, name) {
  if (!screenshotDirectory) return;
  await mkdir(screenshotDirectory, { recursive: true });
  const path = join(screenshotDirectory, `${name}.png`);
  const card = page.locator(".native-phrase").first();
  if (page.viewportSize().width <= 680) {
    // Capture a real phone viewport: a long card continues below the fold.
    await card.evaluate((element) => {
      window.scrollTo(0, element.getBoundingClientRect().top + scrollY - 16);
    });
    await page.screenshot({ path });
  } else {
    await card.screenshot({ path });
  }
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
    "All 240 comparison pairs expose both English variants, both translations and context",
    async () => {
      const ids = await page
        .locator(".native-situation-card")
        .evaluateAll((cards) => cards.map((card) => card.id));
      for (const id of ids) {
        await page.locator(`#${id}`).click();
        await page.locator(".native-phrase").nth(9).waitFor();
        assert.equal(await page.locator(".native-phrase").count(), 10, id);
        assert.equal(
          await page
            .locator('.native-study-mode[data-mode="compare"]')
            .getAttribute("aria-pressed"),
          "true",
          id,
        );
        const pairs = await page
          .locator(".native-phrase")
          .evaluateAll((cards) =>
            cards.map((card) => ({
              simple: card
                .querySelector(".native-simple-english")
                ?.textContent.trim(),
              natural: card
                .querySelector(".native-answer h3[lang=en]")
                ?.textContent.trim(),
              tip: card.querySelector(".native-memory-tip")?.textContent.trim(),
            })),
          );
        assert.ok(
          pairs.every(
            (pair) =>
              pair.simple &&
              pair.natural &&
              pair.tip &&
              pair.simple.toLowerCase() !== pair.natural.toLowerCase(),
          ),
          `${id}: each pair needs distinct English variants and a memory tip`,
        );
        if (id === "native-situation-office") {
          assert.equal(pairs[9].simple, "I'm very busy.");
          assert.equal(pairs[9].natural, "I've got a lot on my plate.");
        }
        const language = page.getByRole("combobox", {
          name: "Язык перевода фраз",
        });
        for (const target of ["kk", "ru"]) {
          await language.selectOption(target);
          const translations = await page
            .locator(".native-phrase")
            .evaluateAll((cards) =>
              cards.flatMap((card) =>
                [
                  ".native-simple-translation",
                  ".native-phrase-translation",
                ].map((selector) => {
                  const element = card.querySelector(selector);
                  return {
                    text: element?.textContent.trim(),
                    language: element?.lang,
                  };
                }),
              ),
            );
          assert.equal(translations.length, 20, id);
          assert.ok(
            translations.every(
              (translation) =>
                translation.text && translation.language === target,
            ),
            `${id}: ${target} translations`,
          );
        }
        await language.selectOption("kk");
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
  const simpleEnglish = await firstPhrase
    .locator(".native-simple-english")
    .innerText();
  const simpleKk = await firstPhrase
    .locator(".native-simple-translation")
    .innerText();
  let simpleRu;
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
      simpleRu = await firstPhrase
        .locator(".native-simple-translation")
        .innerText();
      assert.ok(simpleRu);
      assert.notEqual(simpleRu, simpleKk);
      await language.selectOption("kk");
      assert.equal(
        await firstPhrase.locator(".native-simple-translation").innerText(),
        simpleKk,
      );
    },
  );

  await check(
    "Simple English, Russian and Kazakh variants are searchable",
    async () => {
      await page
        .getByRole("button", { name: "Все ситуации", exact: true })
        .click();
      const search = page.getByRole("searchbox", {
        name: "Поиск ситуаций и фраз",
      });
      for (const query of [simpleEnglish, simpleRu, simpleKk]) {
        await search.fill(query);
        await openCafe(page);
        assert.ok(
          (await firstPhrase.getAttribute("class"))
            .split(" ")
            .includes("is-match"),
        );
        await page
          .getByRole("button", { name: "Все ситуации", exact: true })
          .click();
      }
      await search.fill("busy");
      await page.locator("#native-situation-office").click();
      const matchedCard = page.locator(
        '.native-phrase[data-phrase-id="office-10"]',
      );
      await matchedCard.waitFor();
      await page.waitForFunction(
        () =>
          document.activeElement
            ?.closest(".native-phrase")
            ?.getAttribute("data-phrase-id") === "office-10",
      );
      const targetPosition = await matchedCard
        .locator(".native-simple-english")
        .evaluate((element) => ({
          top: element.getBoundingClientRect().top,
          bottom: element.getBoundingClientRect().bottom,
          viewport: innerHeight,
        }));
      assert.ok(
        targetPosition.top >= 0 &&
          targetPosition.bottom <= targetPosition.viewport,
        JSON.stringify(targetPosition),
      );
      assert.equal(
        await matchedCard.locator(".native-simple-english").innerText(),
        "I'm very busy.",
      );
      assert.equal(
        await matchedCard.locator(".native-answer h3").innerText(),
        "I've got a lot on my plate.",
      );
      assert.equal(await page.locator(".native-phrase").count(), 10);
      await page
        .getByRole("button", { name: "Все ситуации", exact: true })
        .click();
      await search.fill("");
      await openCafe(page);
    },
  );

  await check(
    "Recall reveals one card without leaking other answers and resets between modes and situations",
    async () => {
      const recall = page.locator('.native-study-mode[data-mode="recall"]');
      const compare = page.locator('.native-study-mode[data-mode="compare"]');
      assert.equal(await compare.getAttribute("aria-pressed"), "true");
      await recall.click();
      assert.equal(await recall.getAttribute("aria-pressed"), "true");
      await assertHiddenAnswers(page);
      const reveal = firstPhrase.getByRole("button", {
        name: "Показать выражение",
        exact: true,
      });
      const answerId = await reveal.getAttribute("aria-controls");
      await reveal.click();
      assert.equal(
        await firstPhrase
          .locator(".native-reveal")
          .getAttribute("aria-expanded"),
        "true",
      );
      assert.equal(
        await page.locator(`#${answerId} h3`).innerText(),
        "grab a coffee",
      );
      assert.equal(await page.locator(".native-answer h3[lang=en]").count(), 1);
      assert.equal(await page.locator(".native-example").count(), 1);
      assert.equal(await page.locator(".native-memory-tip").count(), 1);
      assert.equal(
        await page.locator(".native-phrase-actions button").count(),
        2,
      );
      assert.equal(
        await page.locator('.native-reveal[aria-expanded="false"]').count(),
        9,
      );
      await firstPhrase
        .getByRole("button", { name: "Скрыть выражение", exact: true })
        .click();
      await assertHiddenAnswers(page);
      await reveal.click();
      await compare.click();
      assert.equal(
        await page.locator(".native-answer h3[lang=en]").count(),
        10,
      );
      await recall.click();
      await assertHiddenAnswers(page);
      await reveal.click();
      await page
        .getByRole("button", { name: "Все ситуации", exact: true })
        .click();
      await page.locator("#native-situation-restaurant").click();
      await page.locator(".native-phrase").nth(9).waitFor();
      assert.equal(await compare.getAttribute("aria-pressed"), "true");
      assert.equal(await page.locator(".native-reveal").count(), 0);
      assert.equal(
        await page.locator(".native-answer h3[lang=en]").count(),
        10,
      );
      await page
        .getByRole("button", { name: "Все ситуации", exact: true })
        .click();
      await openCafe(page);
      assert.equal(await compare.getAttribute("aria-pressed"), "true");
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

  await check(
    "Simple and natural audio buttons pronounce their own English variants",
    async () => {
      await page.locator('.native-study-mode[data-mode="recall"]').click();
      await firstPhrase
        .getByRole("button", {
          name: `Послушать простую фразу: ${simpleEnglish}`,
          exact: true,
        })
        .click();
      assert.deepEqual(
        (await page.evaluate(() => window.__spokenPhrases)).at(-1),
        { text: simpleEnglish, lang: "en-US" },
      );
      assert.equal(
        await firstPhrase
          .getByRole("button", {
            name: "Послушать: grab a coffee",
            exact: true,
          })
          .count(),
        0,
      );
      await firstPhrase
        .getByRole("button", { name: "Показать выражение", exact: true })
        .click();
      await firstPhrase
        .getByRole("button", { name: "Послушать: grab a coffee", exact: true })
        .click();
      assert.deepEqual(
        (await page.evaluate(() => window.__spokenPhrases)).at(-1),
        { text: "grab a coffee", lang: "en-US" },
      );
      await page.locator('.native-study-mode[data-mode="compare"]').click();
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
          .locator(
            ".native-phrase-actions button, .native-simple-listen, .native-study-mode",
          )
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
        if (width === 320 || width === 1440)
          await captureCard(responsive, `comparison-${width}`);
        await responsive
          .locator('.native-study-mode[data-mode="recall"]')
          .click();
        await noOverflow(responsive);
        await assertHiddenAnswers(responsive);
        const revealTargets = await responsive
          .locator(".native-reveal")
          .evaluateAll((buttons) =>
            buttons.map((button) => ({
              width: button.getBoundingClientRect().width,
              height: button.getBoundingClientRect().height,
            })),
          );
        assert.ok(
          revealTargets.every(
            (target) => target.width >= 44 && target.height >= 44,
          ),
          JSON.stringify(revealTargets),
        );
        if (width === 320 || width === 1440)
          await captureCard(responsive, `recall-${width}`);
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
