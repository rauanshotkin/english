import { useCallback, useEffect, useState } from "react";

export interface ConsentPreferences {
  preferences: boolean;
  analytics: boolean;
}

export interface ReaderSettings {
  fontSize: number;
  speechRate: number;
  targetLanguage: "kk" | "ru";
  theme: "light" | "sepia" | "dark";
}

export interface SavedWord {
  id: string;
  text: string;
  translation: string;
  context?: string;
  chapterId?: string;
  targetLanguage?: "kk" | "ru";
  savedAt: string;
}

export type SavedWordInput = Omit<SavedWord, "id" | "savedAt"> &
  Partial<Pick<SavedWord, "id" | "savedAt">>;

export interface ReaderState {
  chapterId: string;
  completedChapterIds: string[];
  settings: ReaderSettings;
  words: SavedWord[];
}

const CONSENT_COOKIE = "lumi_consent";
const PROGRESS_COOKIE = "lumi_progress";
const WORDS_COOKIE = "lumi_words";
const COOKIE_AGE = 180 * 24 * 60 * 60;
const MAX_COOKIE_VALUE_LENGTH = 3500;
const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 22,
  speechRate: 0.85,
  targetLanguage: "kk",
  theme: "light",
};

function defaultState(): ReaderState {
  return {
    chapterId: "chapter-1",
    completedChapterIds: [],
    settings: { ...DEFAULT_SETTINGS },
    words: [],
  };
}

function readCookie<T>(name: string): T | null {
  if (typeof document === "undefined") return null;
  try {
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${name}=`));
    return cookie
      ? (JSON.parse(decodeURIComponent(cookie.slice(name.length + 1))) as T)
      : null;
  } catch {
    return null;
  }
}

function writeCookie(name: string, value: unknown): void {
  if (typeof document === "undefined") return;
  try {
    const serialized = encodeURIComponent(JSON.stringify(value));
    if (serialized.length > MAX_COOKIE_VALUE_LENGTH) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${serialized}; Path=/; Max-Age=${COOKIE_AGE}; SameSite=Lax${secure}`;
  } catch {
    // Reading still works for this session when browser storage is unavailable.
  }
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  } catch {
    // Restricted browser storage must never prevent reading.
  }
}

function getConsent(): ConsentPreferences | null {
  const value = readCookie<Partial<ConsentPreferences>>(CONSENT_COOKIE);
  return value &&
    typeof value.preferences === "boolean" &&
    typeof value.analytics === "boolean"
    ? { preferences: value.preferences, analytics: value.analytics }
    : null;
}

function boundedNumber(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : fallback;
}

function cleanSettings(
  value: Partial<ReaderSettings> | undefined,
): ReaderSettings {
  return {
    // Retain smaller sizes previously chosen by returning readers.
    fontSize: boundedNumber(value?.fontSize, DEFAULT_SETTINGS.fontSize, 16, 34),
    speechRate: boundedNumber(
      value?.speechRate,
      DEFAULT_SETTINGS.speechRate,
      0.5,
      1.5,
    ),
    targetLanguage: value?.targetLanguage === "ru" ? "ru" : "kk",
    theme:
      value?.theme === "dark" || value?.theme === "sepia"
        ? value.theme
        : "light",
  };
}

function cleanWord(value: SavedWordInput): SavedWord {
  const text = String(value.text).trim().slice(0, 100);
  const targetLanguage = value.targetLanguage === "ru" ? "ru" : "kk";
  return {
    id: (typeof value.id === "string" && value.id
      ? value.id
      : `${targetLanguage}:${text.toLocaleLowerCase("en")}`
    ).slice(0, 120),
    text,
    translation: String(value.translation).trim().slice(0, 240),
    ...(value.context ? { context: String(value.context).slice(0, 260) } : {}),
    ...(value.chapterId
      ? { chapterId: String(value.chapterId).slice(0, 80) }
      : {}),
    targetLanguage,
    savedAt:
      typeof value.savedAt === "string" &&
      !Number.isNaN(Date.parse(value.savedAt))
        ? value.savedAt
        : new Date().toISOString(),
  };
}

/** Compact UTF-8 base64url tuples deliberately omit sentence context and session metadata. */
export function encodeWordCookie(words: SavedWord[]): string {
  const tuples = words.map((word) => [
    word.text,
    word.translation,
    word.targetLanguage ?? "kk",
  ]);
  const bytes = new TextEncoder().encode(JSON.stringify(tuples));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join(
    "",
  );
  return `v2.${btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

/** Also accepts the earlier URI-encoded JSON object format during migration. */
export function decodeWordCookie(serialized: string): SavedWord[] {
  try {
    const compact = serialized.startsWith("v2.");
    let decoded: unknown;
    if (compact) {
      const encoded = serialized.slice(3);
      if (!/^[A-Za-z0-9_-]+$/.test(encoded)) return [];
      const base64 = encoded
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(encoded.length / 4) * 4, "=");
      const bytes = Uint8Array.from(atob(base64), (character) =>
        character.charCodeAt(0),
      );
      decoded = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(bytes),
      );
    } else {
      decoded = JSON.parse(decodeURIComponent(serialized));
    }
    if (!Array.isArray(decoded)) return [];
    return decoded.flatMap((entry: unknown) => {
      if (compact) {
        if (
          !Array.isArray(entry) ||
          typeof entry[0] !== "string" ||
          typeof entry[1] !== "string" ||
          (entry[2] !== "kk" && entry[2] !== "ru")
        )
          return [];
        return [
          cleanWord({
            text: entry[0],
            translation: entry[1],
            targetLanguage: entry[2],
          }),
        ];
      }
      if (
        !entry ||
        typeof entry !== "object" ||
        !("text" in entry) ||
        !("translation" in entry) ||
        typeof entry.text !== "string" ||
        typeof entry.translation !== "string"
      )
        return [];
      const word = entry as SavedWord;
      return [cleanWord({ ...word, id: undefined })];
    });
  } catch {
    return [];
  }
}

function readWordsCookie(): SavedWord[] {
  if (typeof document === "undefined") return [];
  try {
    const cookie = document.cookie
      .split("; ")
      .find((item) => item.startsWith(`${WORDS_COOKIE}=`));
    return cookie
      ? fitWords(decodeWordCookie(cookie.slice(WORDS_COOKIE.length + 1)))
      : [];
  } catch {
    return [];
  }
}

function writeWordsCookie(words: SavedWord[]): void {
  if (typeof document === "undefined") return;
  try {
    const serialized = encodeWordCookie(fitWords(words));
    if (serialized.length > MAX_COOKIE_VALUE_LENGTH) return;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${WORDS_COOKIE}=${serialized}; Path=/; Max-Age=${COOKIE_AGE}; SameSite=Lax${secure}`;
  } catch {
    // The complete vocabulary and sentence context remain available for this session.
  }
}

function fitWords(words: SavedWord[]): SavedWord[] {
  const result = words.slice(0, 25);
  while (
    result.length &&
    encodeWordCookie(result).length > MAX_COOKIE_VALUE_LENGTH
  )
    result.pop();
  return result;
}

function getInitialState(): ReaderState {
  const defaults = defaultState();
  if (!getConsent()?.preferences) return defaults;
  const progress =
    readCookie<Partial<Omit<ReaderState, "words">>>(PROGRESS_COOKIE);
  return {
    chapterId:
      typeof progress?.chapterId === "string"
        ? progress.chapterId.slice(0, 80)
        : defaults.chapterId,
    completedChapterIds: Array.isArray(progress?.completedChapterIds)
      ? progress.completedChapterIds
          .filter((id): id is string => typeof id === "string")
          .slice(0, 50)
          .map((id) => id.slice(0, 80))
      : [],
    settings: cleanSettings(progress?.settings),
    words: readWordsCookie(),
  };
}

/** Progress remains in React memory unless the reader explicitly permits preference cookies. */
export function useReaderStorage() {
  const [consent, setConsent] = useState<ConsentPreferences | null>(getConsent);
  const [state, setState] = useState<ReaderState>(getInitialState);

  useEffect(() => {
    if (consent?.preferences) {
      const { words, ...progress } = state;
      writeCookie(PROGRESS_COOKIE, progress);
      writeWordsCookie(words);
    } else {
      deleteCookie(PROGRESS_COOKIE);
      deleteCookie(WORDS_COOKIE);
    }
  }, [consent, state]);

  const saveConsent = useCallback((next: ConsentPreferences) => {
    const chosen = {
      preferences: !!next.preferences,
      analytics: !!next.analytics,
    };
    writeCookie(CONSENT_COOKIE, chosen);
    setConsent(chosen);
  }, []);

  const setChapter = useCallback((chapterId: string) => {
    setState((current) => ({ ...current, chapterId: chapterId.slice(0, 80) }));
  }, []);

  const toggleCompleted = useCallback((chapterId: string) => {
    setState((current) => ({
      ...current,
      completedChapterIds: current.completedChapterIds.includes(chapterId)
        ? current.completedChapterIds.filter((id) => id !== chapterId)
        : [...current.completedChapterIds, chapterId].slice(0, 50),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setState((current) => ({
      ...current,
      settings: cleanSettings({ ...current.settings, ...patch }),
    }));
  }, []);

  const saveWord = useCallback((input: SavedWordInput) => {
    const word = cleanWord(input);
    if (!word.text) return;
    setState((current) => ({
      ...current,
      words: fitWords([
        word,
        ...current.words.filter((item) => item.id !== word.id),
      ]),
    }));
  }, []);

  const removeWord = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      words: current.words.filter((word) => word.id !== id),
    }));
  }, []);

  const clearReadingData = useCallback(() => {
    deleteCookie(PROGRESS_COOKIE);
    deleteCookie(WORDS_COOKIE);
    setState(defaultState());
  }, []);

  return {
    consent,
    saveConsent,
    state,
    setChapter,
    toggleCompleted,
    updateSettings,
    saveWord,
    removeWord,
    clearReadingData,
  };
}
