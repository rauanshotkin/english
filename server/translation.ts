import { dictionaryTranslation, normalizeText } from "./dictionary.ts";
import {
  dictionary as sharedDictionaryRU,
  dictionaryKK as sharedDictionaryKK,
} from "../src/data/dictionary.ts";
import {
  sentenceTranslations,
  phraseTranslations,
} from "../src/data/sentenceTranslations.ts";

export type TranslationTarget = "kk" | "ru";
export type TranslationResult = {
  translation: string;
  source: "dictionary" | "mymemory";
  target: TranslationTarget;
};
type CachedTranslation = { result: TranslationResult; expires: number };
const localTexts = new Map(
  Object.entries({ ...sentenceTranslations, ...phraseTranslations }).map(
    ([text, translations]) => [normalizeText(text), translations],
  ),
);

export class TranslationError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status = 503,
  ) {
    super(message);
  }
}

export class Translator {
  private readonly cache = new Map<string, CachedTranslation>();
  private readonly pending = new Map<string, Promise<TranslationResult>>();

  constructor(
    private readonly options: {
      allowExternal?: boolean;
      dictionaryKK?: Readonly<Record<string, string>>;
      dictionaryRU?: Readonly<Record<string, string>>;
      fetch?: typeof fetch;
    } = {},
  ) {}

  async translate(
    text: string,
    target: TranslationTarget = "kk",
  ): Promise<TranslationResult> {
    const normalized = normalizeText(text);
    const selectedDictionary =
      target === "kk"
        ? (this.options.dictionaryKK ?? sharedDictionaryKK)
        : (this.options.dictionaryRU ?? sharedDictionaryRU);
    const local =
      selectedDictionary[normalized] ??
      selectedDictionary[normalized.replace(/'s$/, "")] ??
      (target === "ru" ? dictionaryTranslation(text) : undefined);
    if (local) return { translation: local, source: "dictionary", target };
    const translatedSentences = text
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => localTexts.get(normalizeText(sentence))?.[target]);
    if (translatedSentences.every(Boolean)) {
      return {
        translation: translatedSentences.join(" "),
        source: "dictionary",
        target,
      };
    }

    const key = `${target}:${normalized}`;
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.result;
    if (cached) this.cache.delete(key);
    const inFlight = this.pending.get(key);
    if (inFlight) return inFlight;

    if (this.options.allowExternal === false) {
      throw new TranslationError(
        "TRANSLATION_UNAVAILABLE",
        "Перевода пока нет в словаре. Интернет-перевод в этой среде отключён.",
      );
    }
    if (this.pending.size >= 24) {
      throw new TranslationError(
        "SERVER_BUSY",
        "Сервис перевода занят. Попробуйте через несколько секунд.",
        429,
      );
    }

    const request = this.remoteTranslation(text.trim(), target);
    this.pending.set(key, request);
    try {
      const result = await request;
      if (this.cache.size >= 600)
        this.cache.delete(this.cache.keys().next().value!);
      this.cache.set(key, {
        result,
        expires: Date.now() + 24 * 60 * 60 * 1000,
      });
      return result;
    } finally {
      this.pending.delete(key);
    }
  }

  private async remoteTranslation(
    text: string,
    target: TranslationTarget,
  ): Promise<TranslationResult> {
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text);
    url.searchParams.set("langpair", `en|${target}`);
    try {
      const response = await (this.options.fetch ?? fetch)(url, {
        signal: AbortSignal.timeout(5000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error("Remote service returned a non-success status");
      const body = (await response.json()) as {
        responseStatus?: number | string;
        quotaFinished?: boolean;
        responseData?: { translatedText?: unknown };
      };
      if (
        body.quotaFinished ||
        Number(body.responseStatus) === 429 ||
        Number(body.responseStatus) === 403
      ) {
        throw new TranslationError(
          "TRANSLATION_LIMIT",
          "Интернет-перевод достиг дневного лимита. Переводы из словаря доступны.",
        );
      }
      const translated = body.responseData?.translatedText;
      if (
        Number(body.responseStatus) !== 200 ||
        typeof translated !== "string" ||
        !translated.trim() ||
        translated.length > 2500 ||
        normalizeText(translated) === normalizeText(text) ||
        /MYMEMORY WARNING|INVALID LANGUAGE PAIR/i.test(translated)
      ) {
        throw new Error("Remote service did not provide a usable translation");
      }
      return {
        translation: decodeEntities(translated.trim()),
        source: "mymemory",
        target,
      };
    } catch (error) {
      if (error instanceof TranslationError) throw error;
      throw new TranslationError(
        "TRANSLATION_UNAVAILABLE",
        "Сейчас не удалось получить перевод. Попробуйте ещё раз чуть позже.",
      );
    }
  }
}

/** Decode common service entities into text; the client must render this as text. */
function decodeEntities(text: string): string {
  return text.replace(
    /&(amp|lt|gt|quot|apos|#39|#x27);/g,
    (_, entity: string) =>
      ({
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
        "#39": "'",
        "#x27": "'",
      })[entity] ?? _,
  );
}
