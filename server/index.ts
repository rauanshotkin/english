import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { setGlobalProxyFromEnv } from "node:http";
import {
  ReaderStore,
  readVisitorCookie,
  VISITOR_COOKIE,
  VISITOR_TTL_SECONDS,
} from "./store.ts";
import { Translator, TranslationError } from "./translation.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Respect the platform's supported outbound proxy without changing TLS trust.
if (process.env.HTTPS_PROXY || process.env.HTTP_PROXY) setGlobalProxyFromEnv();

export function createApp(
  options: {
    databasePath?: string;
    allowExternalTranslation?: boolean;
    dictionaryKK?: Readonly<Record<string, string>>;
    dictionaryRU?: Readonly<Record<string, string>>;
    publicOrigin?: string;
  } = {},
) {
  const databasePath =
    options.databasePath ?? resolve(projectRoot, ".data", "readers.sqlite");
  if (databasePath !== ":memory:")
    mkdirSync(dirname(databasePath), { recursive: true });
  const readers = new ReaderStore(databasePath);
  const translator = new Translator({
    allowExternal:
      options.allowExternalTranslation ??
      process.env.ENABLE_EXTERNAL_TRANSLATION !== "false",
    dictionaryKK: options.dictionaryKK,
    dictionaryRU: options.dictionaryRU,
  });
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    next();
  });
  app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use("/api", (req, res, next) => {
    if (req.method !== "POST" && req.method !== "DELETE") return next();
    const origin = req.get("origin");
    const configuredOrigin = options.publicOrigin ?? process.env.PUBLIC_ORIGIN;
    const originAllowed =
      !origin ||
      origin === `${req.protocol}://${req.get("host")}` ||
      origin === configuredOrigin;
    if (!originAllowed || req.get("sec-fetch-site") === "cross-site") {
      return apiError(
        res,
        403,
        "ORIGIN_REJECTED",
        "Запрос разрешён только с этого сайта.",
      );
    }
    if (req.method === "POST" && !req.is("application/json")) {
      return apiError(
        res,
        415,
        "JSON_REQUIRED",
        "Ожидается запрос в формате JSON.",
      );
    }
    next();
  });
  app.use("/api", express.json({ limit: "8kb", strict: true }));

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/stats", (_req, res) =>
    res.json({ uniqueReaders: readers.count() }),
  );
  app.post("/api/visit", (req, res) => {
    if (req.body?.consent !== true)
      return apiError(
        res,
        400,
        "CONSENT_REQUIRED",
        "Для анонимного счётчика нужно согласие на аналитические cookies.",
      );
    const visit = readers.visit(readVisitorCookie(req.get("cookie")));
    res.cookie(VISITOR_COOKIE, visit.visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure:
        req.secure ||
        (options.publicOrigin ?? process.env.PUBLIC_ORIGIN)?.startsWith(
          "https://",
        ),
      maxAge: VISITOR_TTL_SECONDS * 1000,
      path: "/",
    });
    res.json({ uniqueReaders: visit.uniqueReaders, counted: visit.counted });
  });
  app.delete("/api/visit", (req, res) => {
    const result = readers.forget(readVisitorCookie(req.get("cookie")));
    res.clearCookie(VISITOR_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    res.json(result);
  });
  app.post("/api/translate", async (req, res) => {
    const text = req.body?.text;
    const target = req.body?.target ?? "kk";
    if (typeof text !== "string" || !text.trim() || text.length > 500) {
      return apiError(
        res,
        400,
        "INVALID_TEXT",
        "Выберите слово или фрагмент длиной до 500 символов.",
      );
    }
    if (target !== "kk" && target !== "ru") {
      return apiError(
        res,
        400,
        "INVALID_TARGET",
        "Доступен перевод на казахский или русский язык.",
      );
    }
    try {
      res.json(await translator.translate(text, target));
    } catch (error) {
      if (error instanceof TranslationError)
        return apiError(res, error.status, error.code, error.message);
      apiError(res, 500, "TRANSLATION_FAILED", "Не удалось получить перевод.");
    }
  });
  app.use("/api", (_req, res) =>
    apiError(res, 404, "NOT_FOUND", "Запрошенный API не найден."),
  );

  const distPath = resolve(projectRoot, "dist");
  if (existsSync(resolve(distPath, "index.html"))) {
    app.use(express.static(distPath));
    app.get(/.*/, (_req, res) => res.sendFile(resolve(distPath, "index.html")));
  }
  app.use(
    (
      error: { status?: number; type?: string },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      if (error.type === "entity.too.large")
        return apiError(
          res,
          413,
          "REQUEST_TOO_LARGE",
          "Запрос слишком большой.",
        );
      if (error.status === 400)
        return apiError(res, 400, "INVALID_JSON", "Не удалось прочитать JSON.");
      apiError(res, 500, "SERVER_ERROR", "Произошла ошибка сервера.");
    },
  );
  return { app, readers };
}

function apiError(
  res: Response,
  status: number,
  code: string,
  message: string,
) {
  return res
    .status(status)
    .json({ translation: null, error: { code, message } });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT ?? 3001);
  const { app, readers } = createApp();
  app.listen(port, "0.0.0.0", (error?: Error) => {
    if (error) {
      console.error(
        `Cannot start Reader API on port ${port}: ${error.message}`,
      );
      readers.close();
      process.exitCode = 1;
      return;
    }
    console.info(`Reader API ready on port ${port}`);
  });
}
