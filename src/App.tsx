import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cookie,
  Headphones,
  Heart,
  LayoutDashboard,
  Leaf,
  Library,
  LoaderCircle,
  Moon,
  Play,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Star,
  Sun,
  Users,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { book, chapters, type Chapter } from "./data/book";
import { lookupTranslation, normalizeWord } from "./data/dictionary";
import {
  sentenceTranslations,
  phraseTranslations,
} from "./data/sentenceTranslations";
import BookArt from "./components/BookArt";
import Consent from "./components/Consent";
import { useReaderStorage } from "./lib/storage";
import { requestTranslation } from "./lib/translationClient";

declare const __STATIC_HOSTING__: boolean;

type View =
  "reading" | "reader" | "dictionary" | "practice" | "listening" | "overview";
type Translation = {
  text: string;
  translation: string;
  context: string;
  loading: boolean;
  error?: string;
  source?: string;
};
type Selection = { text: string; context: string; x: number; y: number };
const navigation = [
  { id: "overview", label: "Моё пространство", icon: LayoutDashboard },
  { id: "reading", label: "Чтение", icon: BookOpen },
  { id: "dictionary", label: "Мой словарь", icon: Bookmark },
  { id: "practice", label: "Практика", icon: Zap },
  { id: "listening", label: "Аудирование", icon: Headphones },
] as const;
const targetNames = { kk: "Қазақша", ru: "Русский" };
const normalizeSentence = (text: string) =>
  text
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
const localContexts = new Map(
  Object.entries({ ...sentenceTranslations, ...phraseTranslations }).map(
    ([text, value]) => [normalizeSentence(text), value],
  ),
);
const contextTranslation = (text: string, target: "kk" | "ru") => {
  const exact = localContexts.get(normalizeSentence(text))?.[target];
  if (exact) return exact;
  const sentences = text.trim().split(/(?<=[.!?])\s+/);
  const translations = sentences.map(
    (sentence) => localContexts.get(normalizeSentence(sentence))?.[target],
  );
  return translations.every(Boolean) ? translations.join(" ") : undefined;
};

export default function App() {
  const storage = useReaderStorage();
  const {
    state,
    consent,
    saveConsent,
    setChapter,
    toggleCompleted,
    updateSettings,
    saveWord,
    removeWord,
  } = storage;
  const [view, setView] = useState<View>("reading");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [policyOpen, setPolicyOpen] = useState(false);
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const readerTheme = state.settings.theme;
  const setReaderTheme = (theme: typeof readerTheme) =>
    updateSettings({ theme });
  const [showContents, setShowContents] = useState(false);
  const [toast, setToast] = useState("");
  const [visitors, setVisitors] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [imported, setImported] = useState<{
    id: string;
    title: string;
    chapters: Chapter[];
  } | null>(null);
  const [customBook, setCustomBook] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizRevealed, setQuizRevealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<HTMLDivElement>(null);
  const translationRef = useRef<HTMLDivElement>(null);
  const wordFocusRef = useRef<HTMLButtonElement | null>(null);
  const requestFocusRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const previousAnalytics = useRef<boolean | undefined>(undefined);
  const analyticsChoice = useRef(false);
  analyticsChoice.current = !!consent?.analytics;
  const analyticsQueue = useRef<Promise<void>>(Promise.resolve());
  const activeChapters = customBook && imported ? imported.chapters : chapters;
  const prefix = customBook && imported ? `custom-${imported.id}-` : "prince-";
  const chapterNumber = state.chapterId.startsWith(prefix)
    ? Number(state.chapterId.slice(prefix.length))
    : 1;
  const chapter =
    activeChapters.find((c) => c.id === chapterNumber) ?? activeChapters[0];
  const completed = activeChapters.filter((c) =>
    state.completedChapterIds.includes(`${prefix}${c.id}`),
  ).length;
  const progress = Math.round((completed / activeChapters.length) * 100);
  const bookTitle = customBook && imported ? imported.title : book.title;
  const notify = (message: string) => setToast(message);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  useEffect(() => {
    if (__STATIC_HOSTING__) return;
    let cancelled = false;
    fetch("/api/stats")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setVisitors(data.uniqueReaders);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (__STATIC_HOSTING__) return;
    const enabled = !!consent?.analytics;
    if (!consent) return;
    if (enabled === previousAnalytics.current) return;
    previousAnalytics.current = enabled;
    // Queue changes so a quick withdrawal cannot race with setting the visitor cookie.
    analyticsQueue.current = analyticsQueue.current.then(async () => {
      if (enabled && !analyticsChoice.current) return;
      try {
        const response = await fetch("/api/visit", {
          method: enabled ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          ...(enabled ? { body: JSON.stringify({ consent: true }) } : {}),
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error("Counter unavailable");
        const data = await response.json();
        setVisitors(data.uniqueReaders);
      } catch {
        notify(
          enabled
            ? "Счётчик временно недоступен. Чтение работает как обычно."
            : "Не удалось удалить запись счётчика. Повторим запрос при следующем открытии сайта.",
        );
      }
    });
  }, [consent?.analytics]);
  useEffect(() => {
    requestRef.current?.abort();
    setTranslation(null);
    setSelection(null);
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [chapter.id, view, customBook]);
  useEffect(() => {
    requestRef.current?.abort();
    setTranslation(null);
  }, [state.settings.targetLanguage]);
  useEffect(() => {
    if (translation && requestFocusRef.current) {
      translationRef.current?.focus();
      requestFocusRef.current = false;
    }
  }, [translation]);
  useEffect(() => {
    if (view !== "reader") return;
    let frame: number;
    const onSelection = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(selectText);
    };
    document.addEventListener("selectionchange", onSelection);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", onSelection);
    };
  }, [view, chapter.id]);
  useEffect(
    () => () => {
      requestRef.current?.abort();
      window.speechSynthesis?.cancel();
    },
    [],
  );

  function openChapter(id: number, custom = customBook) {
    setCustomBook(custom);
    setChapter(
      `${custom && imported ? `custom-${imported.id}-` : "prince-"}${id}`,
    );
    setView("reader");
    window.scrollTo({ top: 0, behavior: "instant" });
    setShowContents(false);
  }
  function navigate(next: View) {
    if (next === "listening") setCustomBook(false);
    setView(next);
    setSearch("");
    setSelection(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function speak(text: string) {
    if (!("speechSynthesis" in window)) {
      notify(
        "Этот браузер не поддерживает озвучивание. Попробуйте Chrome или Safari.",
      );
      return;
    }
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = state.settings.speechRate;
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.lang.startsWith("en"));
    if (voice) utterance.voice = voice;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = (e) => {
      setSpeaking(false);
      if (e.error !== "interrupted" && e.error !== "canceled")
        notify("Голос недоступен. Проверьте настройки озвучивания браузера.");
    };
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }
  async function translate(text: string, context = "") {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setSelection(null);
    const local =
      lookupTranslation(text, state.settings.targetLanguage) ??
      contextTranslation(text, state.settings.targetLanguage);
    if (local) {
      setTranslation({
        text,
        translation: local,
        context,
        loading: false,
        source: "dictionary",
      });
      return;
    }
    setTranslation({ text, translation: "", context, loading: true });
    try {
      const result = await requestTranslation(
        text,
        state.settings.targetLanguage,
        controller.signal,
        __STATIC_HOSTING__,
      );
      if (controller.signal.aborted) return;
      setTranslation({
        text,
        translation: result.translation,
        context,
        loading: false,
        source: result.source,
      });
    } catch (error) {
      if (!controller.signal.aborted)
        setTranslation({
          text,
          translation: "",
          context,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Не удалось получить перевод.",
        });
    }
  }
  function selectText() {
    const selected = window.getSelection();
    if (
      !selected ||
      selected.isCollapsed ||
      !readerRef.current?.contains(selected.anchorNode)
    ) {
      setSelection(null);
      return;
    }
    const text = selected.toString().trim();
    if (!text) return;
    if (text.length > 500) {
      setSelection(null);
      notify("Выделите фрагмент до 500 символов для перевода.");
      return;
    }
    const rect = selected.getRangeAt(0).getBoundingClientRect();
    const context =
      chapter.paragraphs
        .flatMap((p) => p.split(/(?<=[.!?])\s/))
        .find((sentence) => sentence.includes(text)) ?? text;
    setSelection({
      text,
      context,
      x: Math.min(
        Math.max(rect.left + rect.width / 2, 120),
        window.innerWidth - 120,
      ),
      y: Math.max(80, rect.top - 12),
    });
  }
  function closeTranslation() {
    requestRef.current?.abort();
    setTranslation(null);
    wordFocusRef.current?.focus({ preventScroll: true });
  }
  function saveCurrentWord() {
    if (!translation?.translation) return;
    if (translation.text.length > 100) {
      notify("Для словаря выберите слово или фразу до 100 символов.");
      return;
    }
    saveWord({
      id: `${state.settings.targetLanguage}:${translation.text.toLowerCase()}`,
      text: translation.text,
      translation: translation.translation,
      context: customBook ? undefined : translation.context,
      chapterId: `${prefix}${chapter.id}`,
      savedAt: new Date().toISOString(),
      targetLanguage: state.settings.targetLanguage,
    });
    notify(
      consent?.preferences
        ? "Добавлено в ваш словарь"
        : "Добавлено на эту сессию. Включите сохранение в настройках cookies.",
    );
  }
  async function importBook(file?: File) {
    if (!file) return;
    if (!/\.txt$/i.test(file.name)) {
      notify("Выберите текстовый файл .txt в кодировке UTF-8.");
      return;
    }
    if (file.size > 1024 * 1024) {
      notify("Для комфортного чтения выберите файл до 1 МБ.");
      return;
    }
    const text = (await file.text()).replace(/\r\n/g, "\n").trim();
    if (!text || !/[a-zA-Z]/.test(text)) {
      notify("В файле не найден английский текст.");
      return;
    }
    const rawParagraphs = text
      .split(/\n\s*\n/)
      .flatMap((p) =>
        p.length > 3500 ? (p.match(/.{1,2000}(?:\s|$)/g) ?? [p]) : [p],
      );
    const groups: string[][] = [];
    let group: string[] = [];
    let size = 0;
    for (const paragraph of rawParagraphs) {
      if (size > 4500) {
        groups.push(group);
        group = [];
        size = 0;
      }
      group.push(paragraph.replace(/\n/g, " "));
      size += paragraph.length;
    }
    if (group.length) groups.push(group);
    const importedChapters = groups.map((paragraphs, i) => ({
      id: i + 1,
      roman: String(i + 1),
      title: `Part ${i + 1}`,
      titleRu: `Часть ${i + 1}`,
      paragraphs,
      vocabulary: [],
    }));
    let hash = 2166136261;
    for (let i = 0; i < text.length; i++) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const bookId = (hash >>> 0).toString(36);
    const existing = state.chapterId.startsWith(`custom-${bookId}-`)
      ? Number(state.chapterId.split("-").at(-1))
      : 1;
    setImported({
      id: bookId,
      title: file.name.replace(/\.txt$/i, ""),
      chapters: importedChapters,
    });
    setCustomBook(true);
    setChapter(
      `custom-${bookId}-${Math.min(existing || 1, importedChapters.length)}`,
    );
    setView("reader");
    notify(
      "Текст открыт. Файл остаётся в этом браузере и доступен до перезагрузки.",
    );
    if (inputRef.current) inputRef.current.value = "";
  }

  const bookMatches =
    !search ||
    `${book.title} ${book.titleRu} ${book.author}`
      .toLowerCase()
      .includes(search.toLowerCase());
  const filterMatches =
    filter === "all" ||
    (filter === "progress" &&
      state.completedChapterIds.some((id) => id.startsWith("prince-")) &&
      progress < 100) ||
    (filter === "done" && progress === 100);
  const quizWords = state.words.length
    ? state.words
    : chapters
        .flatMap((c) => c.vocabulary)
        .map((v, i) => ({
          id: String(i),
          text: v.word,
          translation:
            lookupTranslation(v.word, state.settings.targetLanguage) ??
            v.translation,
          context: "",
          savedAt: "",
          targetLanguage: state.settings.targetLanguage,
        }));
  const quizWord = quizWords[quizIndex % quizWords.length];

  return (
    <div
      className={`app-shell ${view === "reader" ? `reader-mode theme-${readerTheme}` : ""}`}
    >
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("reading")}
          aria-label="Lumi — на главную"
        >
          <span className="brand-symbol">
            <Sparkles size={26} strokeWidth={1.7} />
          </span>
          <span>
            lumi<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="sidebar-tagline">Маленькие шаги. Большой мир.</div>
        <div className="nav-caption">ТВОЁ ПРОСТРАНСТВО</div>
        <nav className="main-nav" aria-label="Основные разделы">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${view === id || (id === "reading" && view === "reader") ? "active" : ""}`}
              onClick={() => navigate(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
              {id === "reading" && <span className="nav-count">01</span>}
              {id === "dictionary" && state.words.length > 0 && (
                <span className="nav-count">{state.words.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Leaf size={21} />
          </span>
          <h3>В своём ритме</h3>
          <p>
            Даже одна страница —<br />
            уже шаг вперёд.
          </p>
          <div className="note-line">
            <span>Никаких дедлайнов</span>
            <Heart size={12} />
          </div>
        </div>
        <div className="sidebar-bottom">
          <span className="language-dot" />
          <span>English → {targetNames[state.settings.targetLanguage]}</span>
          <button
            onClick={() =>
              updateSettings({
                targetLanguage:
                  state.settings.targetLanguage === "kk" ? "ru" : "kk",
              })
            }
            aria-label="Сменить язык перевода"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <span>Твоё пространство</span>
            <ChevronRight size={13} />
            <strong>
              {view === "reader"
                ? "Чтение"
                : navigation.find((n) => n.id === view)?.label}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="no-rush">
              <span />
              Без спешки. С удовольствием.
            </span>
            <span
              className="avatar"
              title="Без аккаунта — только ваше пространство"
            >
              L<span />
            </span>
          </div>
        </header>
        <main>
          <AnimatePresence mode="wait">
            {view === "reading" && (
              <motion.div
                key="reading"
                className="library-page"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="page-heading">
                  <div>
                    <div className="eyebrow">
                      <span />
                      МЕСТО ДЛЯ ХОРОШИХ ИСТОРИЙ
                    </div>
                    <h1>
                      Английский{" "}
                      <span className="serif italic">между строк.</span>
                      <Sparkles className="heading-spark" size={28} />
                    </h1>
                    <p>
                      Любимые истории, новые слова и немного магии каждый день.
                    </p>
                  </div>
                  <span className="heading-badge">
                    <BookOpen size={16} />
                    Твоя читательская глава
                  </span>
                </div>
                <section
                  className="featured-book"
                  aria-labelledby="featured-title"
                >
                  <div className="featured-content">
                    <div className="feature-tag">
                      <Star size={13} fill="currentColor" /> ИСТОРИЯ, С КОТОРОЙ
                      СТОИТ НАЧАТЬ
                    </div>
                    <h2 id="featured-title">
                      The Little
                      <br />
                      <span className="italic">Prince</span>
                      <Sparkles
                        className="title-star"
                        size={35}
                        strokeWidth={1.3}
                        aria-hidden="true"
                      />
                    </h2>
                    <div className="feature-author">
                      Антуан де Сент-Экзюпери
                    </div>
                    <p className="feature-description">
                      О дружбе, маленьких планетах и том,
                      <br className="desktop-break" /> что по-настоящему важно.
                      Открой историю
                      <br className="desktop-break" /> заново — на английском.
                    </p>
                    <div className="book-meta">
                      <span>
                        <span className="level-dot" />
                        B1 · Средний
                      </span>
                      <i />
                      <span>8 коротких глав</span>
                      <i />
                      <span>~ 15 мин</span>
                    </div>
                    <button
                      className="primary-button"
                      onClick={() => {
                        setCustomBook(false);
                        openChapter(
                          state.chapterId.startsWith("prince-")
                            ? chapterNumber
                            : 1,
                          false,
                        );
                      }}
                    >
                      {state.completedChapterIds.some((id) =>
                        id.startsWith("prince-"),
                      )
                        ? "Продолжить чтение"
                        : "Начать путешествие"}
                      <ArrowRight size={18} />
                    </button>
                    <div className="feature-footnote">
                      <span className="tiny-diamond" />
                      Учебный пересказ · перевод на{" "}
                      {state.settings.targetLanguage === "kk"
                        ? "казахский"
                        : "русский"}
                    </div>
                  </div>
                  <div className="featured-visual">
                    <BookArt />
                    <span className="orbit-label">
                      <Sparkles size={13} /> A little story. A big world.
                    </span>
                    <div className="floating-word">
                      <span className="floating-volume">
                        <Volume2 size={17} />
                      </span>
                      <div>
                        <strong>journey</strong>
                        <span>
                          {state.settings.targetLanguage === "kk"
                            ? "саяхат"
                            : "путешествие"}
                        </span>
                      </div>
                      <span className="floating-plus">+</span>
                    </div>
                  </div>
                </section>
                <div className="benefit-strip">
                  <div>
                    <span className="benefit-icon lavender">
                      <Volume2 size={18} />
                    </span>
                    <span>
                      <strong>Слова оживают</strong>
                      <small>Нажми, чтобы узнать перевод</small>
                    </span>
                  </div>
                  <div>
                    <span className="benefit-icon peach">
                      <Sparkles size={18} />
                    </span>
                    <span>
                      <strong>Смысл между строк</strong>
                      <small>Выдели фразу — пойми контекст</small>
                    </span>
                  </div>
                  <div>
                    <span className="benefit-icon sage">
                      <Bookmark size={18} />
                    </span>
                    <span>
                      <strong>Всё важное с тобой</strong>
                      <small>Собирай свой личный словарь</small>
                    </span>
                  </div>
                </div>
                <section className="bookshelf">
                  <div className="section-heading">
                    <h2>
                      Твоя книжная полка <span>01</span>
                    </h2>
                    <label className="search-box">
                      <Search size={17} />
                      <input
                        placeholder="Найти свою историю..."
                        aria-label="Поиск книг"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          aria-label="Очистить поиск"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>
                  <div
                    className="shelf-tabs"
                    role="group"
                    aria-label="Фильтр книг"
                  >
                    {[
                      ["all", "Все истории"],
                      ["progress", "В процессе"],
                      ["done", "Прочитано"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        className={filter === id ? "selected" : ""}
                        onClick={() => setFilter(id)}
                      >
                        {label}
                        {id === "all" && <span>1</span>}
                      </button>
                    ))}
                  </div>
                  <div className="shelf-grid">
                    {bookMatches && filterMatches ? (
                      <button
                        className="shelf-book"
                        onClick={() =>
                          openChapter(
                            state.chapterId.startsWith("prince-")
                              ? chapterNumber
                              : 1,
                            false,
                          )
                        }
                      >
                        <div className="mini-cover">
                          <BookArt compact />
                          <div className="cover-type">
                            <span>ANTOINE DE SAINT-EXUPÉRY</span>
                            <strong>
                              The Little
                              <br />
                              <i>Prince</i>
                            </strong>
                            <span className="cover-bottom">
                              A STORY TO GROW WITH
                            </span>
                          </div>
                          <span className="cover-level">B1</span>
                        </div>
                        <div className="shelf-info">
                          <div className="shelf-info-title">
                            <h3>Маленький принц</h3>
                            <span className="small-arrow">
                              <ArrowRight size={15} />
                            </span>
                          </div>
                          <p>Антуан де Сент-Экзюпери</p>
                          <div className="progress-row">
                            <span>
                              {progress
                                ? `${progress}% прочитано`
                                : "Твоя история начинается здесь"}
                            </span>
                            <span>{completed}/8</span>
                          </div>
                          <div className="progress-bar">
                            <span style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </button>
                    ) : (
                      <div className="empty-shelf">
                        <Search size={25} />
                        <h3>Здесь пока тихо</h3>
                        <p>
                          {search
                            ? "Попробуй другой запрос."
                            : filter === "done"
                              ? "Прочитанные истории появятся здесь."
                              : "Начни читать и отметь первую главу."}
                        </p>
                        <button
                          className="text-button"
                          onClick={() => {
                            setFilter("all");
                            setSearch("");
                          }}
                        >
                          Все истории <ArrowRight size={14} />
                        </button>
                      </div>
                    )}
                    <button
                      className="import-card"
                      onClick={() =>
                        imported
                          ? openChapter(
                              state.chapterId.startsWith(
                                `custom-${imported.id}-`,
                              )
                                ? Number(state.chapterId.split("-").at(-1)) || 1
                                : 1,
                              true,
                            )
                          : inputRef.current?.click()
                      }
                    >
                      <span className="import-illustration">
                        <div className="import-book back" />
                        <div className="import-book front">
                          <Plus size={25} />
                        </div>
                        <span className="import-star">✧</span>
                      </span>
                      <h3>
                        {imported ? imported.title : "Твоя любимая история"}
                      </h3>
                      <p>
                        {imported ? (
                          "Твой текст готов. Продолжим читать?"
                        ) : (
                          <>
                            Добавь свой текст —<br />
                            мы сделаем его удобным для чтения.
                          </>
                        )}
                      </p>
                      <span className="import-action">
                        {imported ? <BookOpen size={16} /> : <Plus size={16} />}
                        {imported ? "Продолжить" : "Загрузить .txt"}
                      </span>
                      <small>Файл остаётся в твоём браузере</small>
                    </button>
                    <div className="discovery-card">
                      <div className="discovery-top">
                        <span className="new-label">ДРУГОЙ СПОСОБ УЧИТЬСЯ</span>
                        <Headphones size={22} />
                      </div>
                      <div className="waveform">
                        {Array.from({ length: 22 }, (_, i) => (
                          <i
                            key={i}
                            style={{
                              height: `${[18, 30, 15, 38, 55, 29, 67, 44, 31, 59, 78, 53, 34, 63, 46, 21, 39, 58, 27, 42, 19, 12][i]}px`,
                            }}
                          />
                        ))}
                      </div>
                      <h3>
                        У истории
                        <br />
                        <span className="serif italic">есть голос.</span>
                      </h3>
                      <p>
                        Читай ушами. Привыкай к звучанию английского в своём
                        темпе.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => navigate("listening")}
                      >
                        Попробовать аудирование
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </section>
                <div className="library-quote">
                  <span>“</span>
                  <p>Каждое новое слово — ещё один способ увидеть мир.</p>
                  <Leaf size={17} />
                </div>
              </motion.div>
            )}

            {view === "reader" && (
              <motion.div
                key="reader"
                className="reader-page"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="reader-heading">
                  <button
                    className="back-button"
                    onClick={() => navigate("reading")}
                  >
                    <ArrowLeft size={17} />
                    <span>Книжная полка</span>
                  </button>
                  <span className="reader-book-name">{bookTitle}</span>
                  {customBook && (
                    <button
                      className="text-button"
                      onClick={() => inputRef.current?.click()}
                    >
                      Другой файл
                    </button>
                  )}
                  <span className="reader-progress-label">
                    {completed}/{activeChapters.length} глав
                  </span>
                </div>
                <div className="reader-toolbar">
                  <button
                    className="chapter-toggle"
                    onClick={() => setShowContents(!showContents)}
                  >
                    <Library size={17} />
                    <span>Глава {chapter.roman}</span>
                    <ChevronDown size={15} />
                  </button>
                  <div className="toolbar-controls">
                    <div className="font-controls">
                      <button
                        onClick={() =>
                          updateSettings({
                            fontSize: Math.max(16, state.settings.fontSize - 2),
                          })
                        }
                        aria-label="Уменьшить шрифт"
                      >
                        A−
                      </button>
                      <span>{state.settings.fontSize}</span>
                      <button
                        onClick={() =>
                          updateSettings({
                            fontSize: Math.min(28, state.settings.fontSize + 2),
                          })
                        }
                        aria-label="Увеличить шрифт"
                      >
                        A+
                      </button>
                    </div>
                    <div className="theme-controls">
                      {[
                        ["light", Sun],
                        ["sepia", Leaf],
                        ["dark", Moon],
                      ].map(([theme, Icon]) => {
                        const I = Icon as typeof Sun;
                        return (
                          <button
                            key={theme as string}
                            className={readerTheme === theme ? "active" : ""}
                            onClick={() =>
                              setReaderTheme(theme as typeof readerTheme)
                            }
                            aria-label={`Тема: ${theme === "light" ? "светлая" : theme === "sepia" ? "бумага" : "тёмная"}`}
                          >
                            <I size={16} />
                          </button>
                        );
                      })}
                    </div>
                    <select
                      aria-label="Язык перевода"
                      value={state.settings.targetLanguage}
                      onChange={(e) =>
                        updateSettings({
                          targetLanguage: e.target.value as "kk" | "ru",
                        })
                      }
                    >
                      <option value="kk">Қазақша</option>
                      <option value="ru">Русский</option>
                    </select>
                    <button
                      className={`icon-button ${speaking ? "active" : ""}`}
                      onClick={() => speak(chapter.paragraphs.join(" "))}
                      aria-label={
                        speaking ? "Остановить озвучивание" : "Слушать главу"
                      }
                    >
                      {speaking ? <X size={18} /> : <Volume2 size={18} />}
                    </button>
                  </div>
                </div>
                {showContents && (
                  <div className="chapter-dropdown">
                    <div>
                      <strong>Содержание</strong>
                      <button
                        aria-label="Закрыть содержание"
                        onClick={() => setShowContents(false)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {activeChapters.map((c) => (
                      <button
                        key={c.id}
                        className={c.id === chapter.id ? "active" : ""}
                        onClick={() => openChapter(c.id)}
                      >
                        <span>{c.roman}</span>
                        <span>{c.titleRu}</span>
                        {state.completedChapterIds.includes(
                          `${prefix}${c.id}`,
                        ) && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                )}
                <div className="reader-layout">
                  <article className="reading-paper">
                    <div className="chapter-kicker">
                      CHAPTER {chapter.roman}
                      <span>✧</span>
                    </div>
                    <h1 className="serif">{chapter.title}</h1>
                    <p className="chapter-subtitle">{chapter.titleRu}</p>
                    <div className="reading-hint">
                      <Sparkles size={14} />
                      <span>
                        Нажми на слово или выдели фразу, чтобы узнать больше.
                      </span>
                    </div>
                    <div
                      ref={readerRef}
                      className="book-text"
                      aria-label="Текст главы. Слова доступны стрелками влево и вправо; Enter открывает перевод."
                      style={
                        {
                          "--reading-font-size": `${state.settings.fontSize}px`,
                        } as CSSProperties
                      }
                      onMouseUp={selectText}
                      onTouchEnd={() => setTimeout(selectText, 120)}
                    >
                      {chapter.paragraphs.map((paragraph, p) => (
                        <p key={p}>
                          {paragraph.split(/(\s+)/).map((token, i) =>
                            /\s+/.test(token) ? (
                              token
                            ) : (
                              <button
                                key={i}
                                tabIndex={p === 0 && i === 0 ? 0 : -1}
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "ArrowRight" ||
                                    e.key === "ArrowLeft"
                                  ) {
                                    e.preventDefault();
                                    const words = Array.from(
                                      readerRef.current?.querySelectorAll<HTMLButtonElement>(
                                        ".reader-word",
                                      ) ?? [],
                                    );
                                    const current = words.indexOf(
                                      e.currentTarget,
                                    );
                                    words[
                                      Math.max(
                                        0,
                                        Math.min(
                                          words.length - 1,
                                          current +
                                            (e.key === "ArrowRight" ? 1 : -1),
                                        ),
                                      )
                                    ]?.focus();
                                  }
                                }}
                                className={`reader-word ${state.words.some((w) => normalizeWord(w.text) === normalizeWord(token)) ? "saved" : ""}`}
                                onClick={(e) => {
                                  if (window.getSelection()?.toString().trim())
                                    return;
                                  requestFocusRef.current = e.detail === 0;
                                  wordFocusRef.current = e.currentTarget;
                                  const text = normalizeWord(token);
                                  if (text)
                                    translate(
                                      text,
                                      paragraph
                                        .split(/(?<=[.!?])\s/)
                                        .find((s) => s.includes(token)) ??
                                        paragraph,
                                    );
                                }}
                              >
                                {token}
                              </button>
                            ),
                          )}
                        </p>
                      ))}
                    </div>
                    <div className="chapter-end">
                      <span>✦</span>
                      <button
                        className={`complete-button ${state.completedChapterIds.includes(`${prefix}${chapter.id}`) ? "completed" : ""}`}
                        onClick={() =>
                          toggleCompleted(`${prefix}${chapter.id}`)
                        }
                      >
                        {state.completedChapterIds.includes(
                          `${prefix}${chapter.id}`,
                        ) ? (
                          <CheckCheck size={17} />
                        ) : (
                          <Check size={17} />
                        )}{" "}
                        {state.completedChapterIds.includes(
                          `${prefix}${chapter.id}`,
                        )
                          ? "Глава прочитана"
                          : "Отметить прочитанной"}
                      </button>
                    </div>
                    <div className="chapter-pagination">
                      <button
                        disabled={chapter.id === 1}
                        onClick={() => openChapter(chapter.id - 1)}
                      >
                        <ChevronLeft size={17} />
                        Предыдущая
                      </button>
                      <span>
                        {chapter.id} / {activeChapters.length}
                      </span>
                      <button
                        disabled={chapter.id === activeChapters.length}
                        onClick={() => openChapter(chapter.id + 1)}
                      >
                        Следующая
                        <ChevronRight size={17} />
                      </button>
                    </div>
                    <p className="content-note">
                      {customBook
                        ? "Твой файл обрабатывается в браузере. Выделенные фразы отправляются сервису перевода только по запросу."
                        : book.contentNote}
                    </p>
                  </article>
                  <aside className="reader-aside">
                    <div className="reader-aside-heading">
                      <Sparkles size={16} />
                      <h2>Между строк</h2>
                    </div>
                    {translation ? (
                      <div
                        className="translation-card"
                        ref={translationRef}
                        tabIndex={-1}
                        role="region"
                        aria-label="Перевод и контекст"
                        aria-live="polite"
                      >
                        <div className="translation-card-top">
                          <span>
                            {translation.text.includes(" ")
                              ? "ТВОЙ ФРАГМЕНТ"
                              : "ТВОЁ НОВОЕ СЛОВО"}
                          </span>
                          <button
                            aria-label="Закрыть перевод"
                            onClick={closeTranslation}
                          >
                            <X size={16} />
                          </button>
                        </div>
                        <h3>{translation.text}</h3>
                        <div className="translation-language">
                          English <ArrowRight size={12} />{" "}
                          {targetNames[state.settings.targetLanguage]}
                        </div>
                        {translation.loading ? (
                          <div className="translation-loading">
                            <LoaderCircle className="spin" size={18} />
                            Ищем нужный смысл…
                          </div>
                        ) : translation.error ? (
                          <div className="translation-error">
                            <p>{translation.error}</p>
                            <button
                              className="text-button"
                              onClick={() =>
                                translate(translation.text, translation.context)
                              }
                            >
                              Попробовать снова
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="translated-text">
                              {translation.translation}
                            </p>
                            <div className="translation-actions">
                              <button
                                className="save-word-button"
                                onClick={saveCurrentWord}
                              >
                                <Plus size={15} />В мой словарь
                              </button>
                              <button
                                className="icon-button"
                                aria-label="Послушать произношение"
                                onClick={() => speak(translation.text)}
                              >
                                <Volume2 size={18} />
                              </button>
                            </div>
                            {translation.context && (
                              <div className="context-box">
                                <span>В КОНТЕКСТЕ ИСТОРИИ</span>
                                <p>“{translation.context}”</p>
                                {contextTranslation(
                                  translation.context,
                                  state.settings.targetLanguage,
                                ) ? (
                                  <p className="context-translated">
                                    {contextTranslation(
                                      translation.context,
                                      state.settings.targetLanguage,
                                    )}
                                  </p>
                                ) : (
                                  <button
                                    className="text-button"
                                    onClick={() =>
                                      translate(
                                        translation.context,
                                        translation.context,
                                      )
                                    }
                                  >
                                    Перевести предложение
                                    <ArrowRight size={12} />
                                  </button>
                                )}
                              </div>
                            )}
                            <small className="translation-source">
                              {translation.source === "dictionary"
                                ? "Из учебного словаря"
                                : "Перевод MyMemory · смысл может зависеть от контекста"}
                            </small>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="translation-empty">
                        <span className="translation-empty-icon">
                          <BookOpen size={28} strokeWidth={1.4} />
                        </span>
                        <h3>
                          Любопытство —<br />
                          хорошая привычка.
                        </h3>
                        <p>
                          Нажми на любое слово.
                          <br />
                          Его перевод появится здесь.
                        </p>
                        <div className="sample-word">
                          curiosity<span>любопытство → қызығушылық</span>
                        </div>
                      </div>
                    )}
                    {!!chapter.vocabulary.length && (
                      <div className="chapter-vocabulary">
                        <div className="vocabulary-heading">
                          <h3>Слова этой главы</h3>
                          <span>{chapter.vocabulary.length}</span>
                        </div>
                        {chapter.vocabulary.map((v) => (
                          <button
                            key={v.word}
                            onClick={() =>
                              translate(
                                v.word,
                                chapter.paragraphs.find((p) =>
                                  p.toLowerCase().includes(v.word),
                                ) ?? "",
                              )
                            }
                          >
                            <span>{v.word}</span>
                            <Plus size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="reading-privacy">
                      <Leaf size={14} />
                      <span>
                        {consent?.preferences
                          ? "Прогресс сохранён в этом браузере"
                          : "Прогресс доступен в этой сессии"}
                      </span>
                    </div>
                  </aside>
                </div>
              </motion.div>
            )}

            {view === "dictionary" && (
              <motion.div
                key="dictionary"
                className="standard-page"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="eyebrow">
                  <span />
                  ТВОИ МАЛЕНЬКИЕ ОТКРЫТИЯ
                </div>
                <h1>
                  Слова, которые <span className="serif italic">остались.</span>
                </h1>
                <p className="page-description">
                  Твой личный словарь. Возвращайся к словам, пока они не станут
                  своими.
                </p>
                <div className="dictionary-toolbar">
                  <span>
                    {state.words.length} из 25 слов{" "}
                    <small>· храним бережно в этом браузере</small>
                  </span>
                  {state.words.length > 0 && (
                    <button
                      className="secondary-button"
                      onClick={() => navigate("practice")}
                    >
                      <Zap size={16} />
                      Повторить слова
                    </button>
                  )}
                </div>
                {state.words.length ? (
                  <div className="word-grid">
                    {state.words.map((w) => (
                      <div className="word-card" key={w.id}>
                        <div>
                          <span className="word-language">
                            ENGLISH →{" "}
                            {
                              targetNames[
                                w.targetLanguage ??
                                  state.settings.targetLanguage
                              ]
                            }
                          </span>
                          <button
                            className="icon-button"
                            aria-label={`Удалить ${w.text}`}
                            onClick={() => removeWord(w.id)}
                          >
                            <X size={15} />
                          </button>
                        </div>
                        <h2>{w.text}</h2>
                        <p>{w.translation}</p>
                        {w.context && <blockquote>{w.context}</blockquote>}
                        <button
                          className="text-button"
                          onClick={() => speak(w.text)}
                        >
                          <Volume2 size={15} />
                          Послушать
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="large-empty">
                    <span>
                      <Bookmark size={34} />
                    </span>
                    <h2>Первое слово — начало коллекции.</h2>
                    <p>
                      Открой книгу, нажми на интересное слово
                      <br />и добавь его в словарь.
                    </p>
                    <button
                      className="primary-button"
                      onClick={() => openChapter(1, false)}
                    >
                      Найти первое слово
                      <ArrowRight size={17} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {view === "practice" && (
              <motion.div
                key="practice"
                className="standard-page"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="eyebrow">
                  <span />
                  ПОМНИТЬ ЛЕГЧЕ, ЧЕМ КАЖЕТСЯ
                </div>
                <h1>
                  Немного практики.
                  <br />
                  <span className="serif italic">Много уверенности.</span>
                </h1>
                <p className="page-description">
                  {state.words.length
                    ? "Повтори слова из своего словаря."
                    : "Начни со слов из книги. Твои сохранённые слова появятся здесь автоматически."}
                </p>
                <div className="practice-area">
                  <div className="practice-top">
                    <span>
                      <Zap size={16} />
                      КАРТОЧКИ СЛОВ
                    </span>
                    <span>
                      {(quizIndex % quizWords.length) + 1} / {quizWords.length}
                    </span>
                  </div>
                  <motion.button
                    key={quizWord.id}
                    className={`flashcard ${quizRevealed ? "revealed" : ""}`}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setQuizRevealed(!quizRevealed)}
                    aria-label="Показать или скрыть перевод"
                  >
                    <span>
                      {quizRevealed
                        ? targetNames[
                            quizWord.targetLanguage ??
                              state.settings.targetLanguage
                          ]
                        : "ENGLISH"}
                    </span>
                    <h2 className="serif">
                      {quizRevealed ? quizWord.translation : quizWord.text}
                    </h2>
                    <p>
                      {quizRevealed
                        ? quizWord.text
                        : "Вспомни перевод и переверни карточку"}
                    </p>
                    <span className="flip-hint">
                      <Sparkles size={15} />
                      Нажми, чтобы перевернуть
                    </span>
                  </motion.button>
                  <div className="practice-controls">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        setQuizIndex(
                          (i) => (i + quizWords.length - 1) % quizWords.length,
                        );
                        setQuizRevealed(false);
                      }}
                    >
                      <ArrowLeft size={16} />
                      Назад
                    </button>
                    <button
                      className="icon-button"
                      onClick={() => speak(quizWord.text)}
                      aria-label="Послушать слово"
                    >
                      <Volume2 size={21} />
                    </button>
                    <button
                      className="primary-button"
                      onClick={() => {
                        setQuizIndex((i) => i + 1);
                        setQuizRevealed(false);
                      }}
                    >
                      Следующее
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {view === "listening" && (
              <motion.div
                key="listening"
                className="standard-page"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="eyebrow">
                  <span />
                  АНГЛИЙСКИЙ ЗВУЧИТ БЛИЖЕ
                </div>
                <h1>
                  Слушай историю.
                  <br />
                  <span className="serif italic">Лови её ритм.</span>
                </h1>
                <p className="page-description">
                  Браузер озвучит главу по-английски. Голоса зависят от
                  устройства.
                </p>
                <section className="listening-player">
                  <div className="listening-art">
                    <BookArt />
                    <span>
                      <Headphones size={24} />
                    </span>
                  </div>
                  <div className="listening-body">
                    <span className="feature-tag">
                      THE LITTLE PRINCE · УЧЕБНЫЙ ПЕРЕСКАЗ
                    </span>
                    <h2 className="serif">{chapter.title}</h2>
                    <p>{chapter.titleRu}</p>
                    <label className="listening-select">
                      Глава
                      <select
                        value={chapter.id}
                        onChange={(e) => {
                          setCustomBook(false);
                          setChapter(`prince-${e.target.value}`);
                        }}
                      >
                        {chapters.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.roman} · {c.titleRu}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="listening-actions">
                      <button
                        className="primary-button"
                        onClick={() => speak(chapter.paragraphs.join(" "))}
                      >
                        {speaking ? (
                          <X size={17} />
                        ) : (
                          <Play size={17} fill="currentColor" />
                        )}
                        {speaking ? "Остановить" : "Слушать главу"}
                      </button>
                      <label>
                        Темп
                        <select
                          aria-label="Скорость озвучивания"
                          value={state.settings.speechRate}
                          onChange={(e) =>
                            updateSettings({
                              speechRate: Number(e.target.value),
                            })
                          }
                        >
                          <option value="0.7">0.7×</option>
                          <option value="0.85">0.85×</option>
                          <option value="1">1×</option>
                          <option value="1.2">1.2×</option>
                        </select>
                      </label>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => openChapter(chapter.id, false)}
                    >
                      Открыть текст главы
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              </motion.div>
            )}

            {view === "overview" && (
              <motion.div
                key="overview"
                className="standard-page"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="eyebrow">
                  <span />
                  ТВОЯ ИСТОРИЯ ОБУЧЕНИЯ
                </div>
                <h1>
                  Рады видеть.
                  <br />
                  <span className="serif italic">Продолжим открывать?</span>
                </h1>
                <p className="page-description">
                  Без аккаунта, соревнований и спешки. Только ты и новые
                  открытия.
                </p>
                <div className="overview-stats">
                  <div>
                    <BookOpen size={24} />
                    <strong>{state.completedChapterIds.length}</strong>
                    <span>глав прочитано</span>
                  </div>
                  <div>
                    <Bookmark size={24} />
                    <strong>{state.words.length}</strong>
                    <span>слов сохранено</span>
                  </div>
                  <div>
                    <Leaf size={24} />
                    <strong>Твой темп</strong>
                    <span>самый подходящий</span>
                  </div>
                </div>
                <div className="overview-continue">
                  <BookArt />
                  <div>
                    <span className="eyebrow">СЛЕДУЮЩАЯ МАЛЕНЬКАЯ ГЛАВА</span>
                    <h2 className="serif">The Little Prince</h2>
                    <p>Открывай знакомую историю с новой стороны.</p>
                    <button
                      className="primary-button"
                      onClick={() =>
                        openChapter(
                          state.chapterId.startsWith("prince-")
                            ? chapterNumber
                            : 1,
                          false,
                        )
                      }
                    >
                      Продолжить
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
                {!consent?.preferences && (
                  <div className="preferences-nudge">
                    <Cookie size={18} />
                    <p>
                      Хочешь вернуться к своему прогрессу завтра? Разреши его
                      сохранение в настройках cookies.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setPolicyOpen(true)}
                    >
                      Настроить
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
        <footer className="footer">
          <span className="footer-brand">
            lumi.<span>Учиться — значит замечать.</span>
          </span>
          <div>
            <span
              className="visitor-count"
              title={
                __STATIC_HOSTING__
                  ? "В этой версии нет счётчика посетителей или аналитики."
                  : "Уникальные браузеры посетителей, согласившихся на анонимный счётчик. Это не точное число людей."
              }
            >
              {__STATIC_HOSTING__ ? <Leaf size={14} /> : <Users size={14} />}
              {__STATIC_HOSTING__
                ? "Без отслеживания"
                : visitors === null
                  ? "Счётчик недоступен"
                  : `${visitors} ${visitors === 1 ? "читатель" : "читателей"} с нами`}
            </span>
            <button onClick={() => setPolicyOpen(true)}>
              <Cookie size={14} />
              Cookies и приватность
            </button>
          </div>
        </footer>
      </div>
      <input
        type="file"
        accept=".txt,text/plain"
        ref={inputRef}
        className="visually-hidden"
        aria-label="Загрузить текст книги"
        onChange={(e) => importBook(e.target.files?.[0])}
      />
      <Consent
        analyticsAvailable={!__STATIC_HOSTING__}
        consent={consent}
        onSave={saveConsent}
        open={policyOpen}
        onClose={() => setPolicyOpen(false)}
      />
      {selection && view === "reader" && (
        <button
          className="selection-translate"
          style={{ left: selection.x, top: selection.y }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => translate(selection.text, selection.context)}
        >
          <Sparkles size={15} />
          Перевести фрагмент
        </button>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="toast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Check size={17} />
            {toast}
            <button
              onClick={() => setToast("")}
              aria-label="Закрыть уведомление"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
