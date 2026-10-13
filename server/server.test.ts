import assert from "node:assert/strict";
import { test } from "node:test";
import { type AddressInfo } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "./index.ts";
import {
  ReaderStore,
  readVisitorCookie,
  VISITOR_COOKIE,
  VISITOR_TTL_SECONDS,
} from "./store.ts";
import { Translator, TranslationError } from "./translation.ts";

test("counting is anonymous, deduplicates the consented identifier, and forgets it", () => {
  const store = new ReaderStore(":memory:");
  try {
    assert.equal(store.count(), 0);
    const first = store.visit();
    assert.equal(first.counted, true);
    assert.equal(first.uniqueReaders, 1);
    assert.deepEqual(store.visit(first.visitorId), {
      ...first,
      counted: false,
    });
    const stored = store.database
      .prepare("SELECT identifier_hash FROM readers")
      .get() as { identifier_hash: string };
    assert.equal(stored.identifier_hash.length, 64);
    assert.notEqual(stored.identifier_hash, first.visitorId);
    assert.deepEqual(store.forget(first.visitorId), {
      deleted: true,
      uniqueReaders: 0,
    });
    assert.deepEqual(store.forget(first.visitorId), {
      deleted: false,
      uniqueReaders: 0,
    });
  } finally {
    store.close();
  }
});

test("expired visitor records are removed at 365 days", () => {
  const store = new ReaderStore(":memory:");
  try {
    store.visit(undefined, 1000);
    assert.equal(store.count(1000 + VISITOR_TTL_SECONDS * 1000 - 1), 1);
    assert.equal(store.count(1000 + VISITOR_TTL_SECONDS * 1000), 0);
  } finally {
    store.close();
  }
});

test("the anonymous reader counter survives reopening the database", () => {
  const directory = mkdtempSync(join(tmpdir(), "lumi-readers-"));
  let store = new ReaderStore(join(directory, "readers.sqlite"));
  try {
    const reader = store.visit();
    store.close();
    store = new ReaderStore(join(directory, "readers.sqlite"));
    assert.equal(store.count(), 1);
    assert.equal(store.visit(reader.visitorId).counted, false);
    assert.equal(store.forget(reader.visitorId).uniqueReaders, 0);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test("visitor parser rejects tampered or malformed cookies", () => {
  assert.equal(readVisitorCookie("reader_visitor=%E0%A4%A"), undefined);
  assert.equal(readVisitorCookie("reader_visitor=not-a-uuid"), undefined);
  assert.equal(readVisitorCookie("other=4"), undefined);
});

test("HTTP requires explicit consent, deduplicates and deletes, and refuses cross-origin changes", async () => {
  const { app, readers } = createApp({
    databasePath: ":memory:",
    allowExternalTranslation: false,
    dictionaryKK: { prince: "ханзада" },
  });
  const server = await new Promise<ReturnType<typeof app.listen>>(
    (resolveServer) => {
      const running = app.listen(0, "127.0.0.1", () => resolveServer(running));
    },
  );
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const denied = await fetch(`${base}/api/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: false }),
    });
    assert.equal(denied.status, 400);
    assert.equal(denied.headers.get("set-cookie"), null);
    assert.equal(readers.count(), 0);

    const first = await fetch(`${base}/api/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({ consent: true }),
    });
    assert.deepEqual(await first.json(), { uniqueReaders: 1, counted: true });
    const setCookie = first.headers.get("set-cookie")!;
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    const cookie = setCookie.split(";")[0];
    assert.match(cookie, new RegExp(`^${VISITOR_COOKIE}=`));
    const second = await fetch(`${base}/api/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify({ consent: true }),
    });
    assert.deepEqual(await second.json(), { uniqueReaders: 1, counted: false });

    const blocked = await fetch(`${base}/api/visit`, {
      method: "DELETE",
      headers: { Cookie: cookie, Origin: "https://unrelated.example" },
    });
    assert.equal(blocked.status, 403);
    assert.equal(readers.count(), 1);
    const deleted = await fetch(`${base}/api/visit`, {
      method: "DELETE",
      headers: { Cookie: cookie, Origin: base },
    });
    assert.deepEqual(await deleted.json(), { uniqueReaders: 0, deleted: true });
    assert.match(deleted.headers.get("set-cookie")!, /Expires=/i);

    const kk = await fetch(`${base}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Prince!" }),
    });
    assert.deepEqual(await kk.json(), {
      translation: "ханзада",
      source: "dictionary",
      target: "kk",
    });
    const ru = await fetch(`${base}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "prince", target: "ru" }),
    });
    assert.deepEqual(await ru.json(), {
      translation: "принц",
      source: "dictionary",
      target: "ru",
    });

    for (const body of [
      { text: "a".repeat(501) },
      { text: "" },
      { text: "prince", target: "fr" },
    ]) {
      const invalid = await fetch(`${base}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      assert.equal(invalid.status, 400);
    }
    const unknown = await fetch(`${base}/api/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "unseeded phrase" }),
    });
    assert.equal(unknown.status, 503);
    assert.equal((await unknown.json()).error.code, "TRANSLATION_UNAVAILABLE");
  } finally {
    await new Promise<void>((resolveServer, reject) =>
      server.close((error) => (error ? reject(error) : resolveServer())),
    );
    readers.close();
  }
});

test("translation cache includes target and uses the requested language pair", async () => {
  const urls: string[] = [];
  const translator = new Translator({
    fetch: async (input) => {
      urls.push(String(input));
      const target = new URL(String(input)).searchParams.get("langpair");
      return new Response(
        JSON.stringify({
          responseStatus: 200,
          responseData: {
            translatedText:
              target === "en|kk" ? "бейтаныс сөз тіркесі" : "незнакомая фраза",
          },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    },
  });
  assert.equal(
    (await translator.translate("unseeded phrase", "kk")).target,
    "kk",
  );
  assert.equal(
    (await translator.translate("unseeded phrase", "ru")).translation,
    "незнакомая фраза",
  );
  await translator.translate("unseeded phrase", "kk");
  assert.equal(urls.length, 2);
  assert.equal(new URL(urls[0]).searchParams.get("langpair"), "en|kk");
  assert.equal(new URL(urls[1]).searchParams.get("langpair"), "en|ru");
});

test("authored demo sentences translate offline without inventing fragment translations", async () => {
  const translator = new Translator({ allowExternal: false });
  const text = "Childhood gives people a special kind of attention.";
  assert.deepEqual(await translator.translate(text, "kk"), {
    translation: "Балалық шақ адамға ерекше зейін береді.",
    source: "dictionary",
    target: "kk",
  });
  assert.equal(
    (await translator.translate(text.toUpperCase().slice(0, -1), "ru"))
      .translation,
    "Детство дарит людям особую внимательность.",
  );
  const combined = await translator.translate(
    "The adults around him prefer practical explanations. They want clear information and familiar answers.",
    "ru",
  );
  assert.equal(
    combined.translation,
    "Взрослые вокруг него предпочитают практические объяснения. Им нужна ясная информация и привычные ответы.",
  );
  assert.deepEqual(await translator.translate("FIRST IMPRESSION", "kk"), {
    translation: "алғашқы әсер",
    source: "dictionary",
    target: "kk",
  });
  await assert.rejects(
    translator.translate("Childhood gives people"),
    (error) =>
      error instanceof TranslationError &&
      error.code === "TRANSLATION_UNAVAILABLE",
  );
});

test("translation never fabricates a result from network failures or unchanged output", async () => {
  const unchanged = new Translator({
    fetch: async () =>
      new Response(
        JSON.stringify({
          responseStatus: 200,
          responseData: { translatedText: "Unseeded" },
        }),
      ),
  });
  await assert.rejects(
    unchanged.translate("Unseeded"),
    (error) =>
      error instanceof TranslationError &&
      error.code === "TRANSLATION_UNAVAILABLE",
  );
  const offline = new Translator({
    fetch: async () => {
      throw new TypeError("Offline");
    },
  });
  await assert.rejects(
    offline.translate("Unseeded"),
    (error) => error instanceof TranslationError && error.status === 503,
  );
});
