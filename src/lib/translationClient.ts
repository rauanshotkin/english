type TranslationResult = {
  translation: string;
  source: "dictionary" | "mymemory";
};

const normalize = (text: string) =>
  text.toLowerCase().replace(/[’]/g, "'").trim();

/** Called only after the reader explicitly requests a non-local translation. */
export async function requestTranslation(
  text: string,
  target: "kk" | "ru",
  signal: AbortSignal,
  staticHosting: boolean,
): Promise<TranslationResult> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  if (signal.aborted) controller.abort();
  const timeout = setTimeout(abort, 5000);
  try {
    if (!staticHosting) {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (
        !response.ok ||
        typeof result?.translation !== "string" ||
        !result.translation.trim()
      )
        throw new Error(
          result?.error?.message ||
            "Перевод пока недоступен. Попробуйте ещё раз.",
        );
      return {
        translation: result.translation,
        source: result.source === "dictionary" ? "dictionary" : "mymemory",
      };
    }

    if (new TextEncoder().encode(text).length > 500)
      throw new Error(
        "Выделите более короткий фрагмент для интернет-перевода.",
      );
    const url = new URL("https://api.mymemory.translated.net/get");
    url.searchParams.set("q", text.trim());
    url.searchParams.set("langpair", `en|${target}`);
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) throw new Error("Сервис перевода временно недоступен.");
    const result = (await response.json()) as {
      responseStatus?: number | string;
      quotaFinished?: boolean;
      responseData?: { translatedText?: unknown };
    };
    if (
      result?.quotaFinished ||
      [429, 403].includes(Number(result?.responseStatus))
    )
      throw new Error(
        "Интернет-перевод достиг дневного лимита. Переводы из словаря доступны.",
      );
    const translated = result?.responseData?.translatedText;
    if (
      Number(result?.responseStatus) !== 200 ||
      typeof translated !== "string" ||
      !translated.trim() ||
      translated.length > 2500 ||
      normalize(translated) === normalize(text) ||
      /MYMEMORY WARNING|INVALID LANGUAGE PAIR/i.test(translated)
    )
      throw new Error("Сервис не предоставил перевод. Попробуйте позже.");
    return {
      translation: translated
        .trim()
        .replace(
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
        ),
      source: "mymemory",
    };
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted || error instanceof TypeError)
      throw new Error(
        "Интернет-перевод сейчас недоступен. Учебный словарь и переводы глав работают без сети.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
    signal.removeEventListener("abort", abort);
  }
}
