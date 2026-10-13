import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Briefcase,
  BusFront,
  CalendarDays,
  Check,
  ClipboardCheck,
  Coffee,
  GraduationCap,
  Handshake,
  Heart,
  House,
  Hotel,
  Info,
  LifeBuoy,
  Lightbulb,
  MapPin,
  MessageCircle,
  Phone,
  Pill,
  Plane,
  Search,
  Send,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Siren,
  Sparkles,
  Stethoscope,
  Users,
  Utensils,
  Volume2,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  nativeGroups,
  nativeSituations,
  totalNativePhrases,
  type NativePhrase,
  type NativeSituation,
} from "../data/nativePhrases";
import type { SavedWord } from "../lib/storage";
import "../native-speaking.css";

interface NativeSpeakingProps {
  targetLanguage: "kk" | "ru";
  onLanguageChange: (language: "kk" | "ru") => void;
  onSpeak: (text: string) => void;
  onSavePhrase: (phrase: NativePhrase, situation: NativeSituation) => void;
  savedWords: SavedWord[];
  onPractice?: () => void;
}

const situationIcons: Record<string, LucideIcon> = {
  introductions: Handshake,
  smalltalk: MessageCircle,
  friends: Users,
  cafe: Coffee,
  restaurant: Utensils,
  shopping: ShoppingBag,
  groceries: ShoppingBasket,
  transport: BusFront,
  airport: Plane,
  hotel: Hotel,
  directions: MapPin,
  office: Briefcase,
  interview: ClipboardCheck,
  study: GraduationCap,
  phone: Phone,
  messaging: Send,
  home: House,
  planning: CalendarDays,
  help: LifeBuoy,
  empathy: Heart,
  boundaries: ShieldCheck,
  doctor: Stethoscope,
  pharmacy: Pill,
  emergencies: Siren,
};

const normalize = (value: string) =>
  value.normalize("NFKC").toLocaleLowerCase().replace(/[’]/g, "'").trim();

const registerLabels = {
  neutral: "Нейтрально",
  casual: "Неформально",
  polite: "Вежливо",
};

function matchesPhrase(phrase: NativePhrase, query: string) {
  return [
    phrase.english,
    phrase.kk,
    phrase.ru,
    phrase.example,
    phrase.note,
    registerLabels[phrase.register],
  ].some((value) => normalize(value).includes(query));
}

function toneFor(situation: NativeSituation) {
  if (situation.group === "travel" || situation.group === "wellbeing") {
    return "sage";
  }
  if (situation.group === "everyday") return "peach";
  return "purple";
}

function SituationIcon({
  situation,
  size = 24,
}: {
  situation: NativeSituation;
  size?: number;
}) {
  const Icon = situationIcons[situation.id] ?? MessageCircle;
  return (
    <span className={`native-situation-icon ${toneFor(situation)}`}>
      <Icon size={size} aria-hidden="true" />
    </span>
  );
}

export default function NativeSpeaking({
  targetLanguage,
  onLanguageChange,
  onSpeak,
  onSavePhrase,
  savedWords,
  onPractice,
}: NativeSpeakingProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const libraryScroll = useRef(0);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const query = normalize(search);
  const selectedSituation = nativeSituations.find(
    (situation) => situation.id === selectedId,
  );
  const filters = [{ id: "all", label: "Все ситуации" }, ...nativeGroups];
  const groupName = (id: string) =>
    nativeGroups.find((item) => item.id === id)?.label ?? "Живой английский";
  const isSaved = (phrase: NativePhrase) =>
    savedWords.some(
      (word) =>
        normalize(word.text) === normalize(phrase.english) &&
        (word.targetLanguage ?? "kk") === targetLanguage,
    );
  const results = nativeSituations
    .filter((situation) => group === "all" || situation.group === group)
    .map((situation) => {
      const phrases = query
        ? situation.phrases.filter((phrase) => matchesPhrase(phrase, query))
        : [];
      const titleMatches =
        !!query &&
        [
          situation.title,
          situation.description,
          groupName(situation.group),
        ].some((value) => normalize(value).includes(query));
      return { situation, phrases, titleMatches };
    })
    .filter(
      ({ phrases, titleMatches }) => !query || titleMatches || phrases.length,
    );

  useEffect(() => {
    if (selectedId) detailHeading.current?.focus({ preventScroll: true });
  }, [selectedId]);

  function openSituation(situation: NativeSituation) {
    libraryScroll.current = window.scrollY;
    setSelectedId(situation.id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function returnToLibrary() {
    const previousId = selectedId;
    setSelectedId(null);
    requestAnimationFrame(() => {
      window.scrollTo({ top: libraryScroll.current, behavior: "instant" });
      document
        .getElementById(`native-situation-${previousId}`)
        ?.focus({ preventScroll: true });
    });
  }

  const languageControl = (
    <label className="native-language">
      <span>Перевод</span>
      <select
        aria-label="Язык перевода фраз"
        value={targetLanguage}
        onChange={(event) =>
          onLanguageChange(event.target.value as "kk" | "ru")
        }
      >
        <option value="kk">Қазақша</option>
        <option value="ru">Русский</option>
      </select>
    </label>
  );

  return (
    <div
      className={`standard-page native-page${selectedSituation ? " native-detail-page" : ""}`}
    >
      <header className="native-hero">
        <div>
          <div className="native-kicker">
            <Sparkles size={16} aria-hidden="true" />
            <span>Живой английский · На каждый день</span>
          </div>
          <h1>
            Говорить <br />
            как <span className="serif">носитель</span>
          </h1>
          <p className="native-description">
            Естественные фразы для реальных ситуаций. Перевод, примеры и
            озвучивание помогут начать разговор.
          </p>
          <div className="native-hero-tags">
            <span>
              <MessageCircle size={17} aria-hidden="true" />
              {nativeSituations.length} ситуации
            </span>
            <span>
              <BookOpen size={17} aria-hidden="true" />
              {totalNativePhrases} фраз
            </span>
            <span>
              <Volume2 size={17} aria-hidden="true" />С озвучиванием
            </span>
          </div>
        </div>
        <div className="native-hero-art" aria-hidden="true">
          <span className="native-chat-bubble">
            <Volume2 size={17} /> Sounds good!
          </span>
          <span className="native-chat-bubble">I’m on my way.</span>
          <span className="native-chat-bubble">You’ve got this.</span>
          <Sparkles className="native-hero-star" size={27} />
        </div>
      </header>

      {selectedSituation ? (
        <section aria-labelledby="native-detail-title">
          <div className="native-toolbar">
            <button className="native-back" onClick={returnToLibrary}>
              <ArrowLeft size={19} aria-hidden="true" />
              Все ситуации
            </button>
            {languageControl}
          </div>
          <div className="native-detail-heading">
            <SituationIcon situation={selectedSituation} size={28} />
            <div>
              <h2 id="native-detail-title" ref={detailHeading} tabIndex={-1}>
                {selectedSituation.title}
              </h2>
              <p>{selectedSituation.description}</p>
            </div>
          </div>
          <div className="native-detail-note">
            <span>
              <MessageCircle size={16} aria-hidden="true" />
              Все {selectedSituation.phrases.length} фраз
            </span>
            <span>
              <Bookmark size={16} aria-hidden="true" />В словаре:{" "}
              {selectedSituation.phrases.filter(isSaved).length}
            </span>
            <span>{groupName(selectedSituation.group)}</span>
          </div>
          {query && (
            <p className="native-search-note">
              Фразы по запросу «{search.trim()}» отмечены рамкой. Все 10 фраз
              ситуации доступны ниже.
            </p>
          )}
          <ol className="native-phrases" aria-label="Фразы для этой ситуации">
            {selectedSituation.phrases.map((phrase, index) => {
              const saved = isSaved(phrase);
              const match = !!query && matchesPhrase(phrase, query);
              return (
                <li
                  className={`native-phrase${match ? " is-match" : ""}`}
                  key={phrase.id}
                >
                  <div className="native-phrase-meta">
                    <span className="native-phrase-number" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="native-register">
                      {match && <Search size={13} aria-hidden="true" />}
                      {registerLabels[phrase.register]}
                    </span>
                  </div>
                  <h3 lang="en">{phrase.english}</h3>
                  <p
                    className="native-phrase-translation"
                    lang={targetLanguage}
                  >
                    {phrase[targetLanguage]}
                  </p>
                  <div className="native-example">
                    <span>В разговоре</span>
                    <p lang="en">{phrase.example}</p>
                  </div>
                  <p className="native-usage">
                    <Info size={15} aria-hidden="true" />
                    <span>{phrase.note}</span>
                  </p>
                  <div className="native-phrase-actions">
                    <button
                      className="native-listen"
                      aria-label={`Послушать: ${phrase.english}`}
                      onClick={() => onSpeak(phrase.english)}
                    >
                      <Volume2 size={18} aria-hidden="true" />
                      Послушать
                    </button>
                    <button
                      className={`native-save${saved ? " is-saved" : ""}`}
                      aria-label={`${saved ? "Убрать из словаря" : "Сохранить в словарь"}: ${phrase.english}`}
                      aria-pressed={saved}
                      onClick={() => onSavePhrase(phrase, selectedSituation)}
                    >
                      {saved ? (
                        <Check size={18} aria-hidden="true" />
                      ) : (
                        <Bookmark size={17} aria-hidden="true" />
                      )}
                      {saved ? "В словаре" : "Сохранить"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
          {onPractice && (
            <aside className="native-practice-callout">
              <div>
                <h3>Фразы запоминаются в практике</h3>
                <p>
                  Сохраните нужные выражения в свой словарь и повторяйте их с
                  карточками. Попробуйте придумать свой пример вслух.
                </p>
              </div>
              <button className="primary-button" onClick={onPractice}>
                К практике
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </aside>
          )}
        </section>
      ) : (
        <section aria-labelledby="native-library-title">
          <div className="native-toolbar">
            <div className="native-search">
              <Search size={20} aria-hidden="true" />
              <input
                type="search"
                aria-label="Поиск ситуаций и фраз"
                placeholder="Ситуация или фраза…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  aria-label="Очистить поиск фраз"
                  onClick={() => setSearch("")}
                >
                  <X size={19} aria-hidden="true" />
                </button>
              )}
            </div>
            {languageControl}
          </div>
          <div
            className="native-filters"
            role="group"
            aria-label="Темы ситуаций"
          >
            {filters.map((item) => (
              <button
                key={item.id}
                className={`native-filter${group === item.id ? " active" : ""}`}
                aria-pressed={group === item.id}
                onClick={() => setGroup(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="native-library-heading">
            <h2 id="native-library-title">
              {query ? "Результаты поиска" : "Выберите свою ситуацию"}
            </h2>
            <span aria-live="polite" aria-atomic="true">
              Ситуаций: {results.length} · По 10 фраз
            </span>
          </div>
          {results.length ? (
            <div className="native-situations-grid">
              {results.map(({ situation, phrases, titleMatches }) => (
                <button
                  id={`native-situation-${situation.id}`}
                  className="native-situation-card"
                  key={situation.id}
                  onClick={() => openSituation(situation)}
                  aria-label={`${situation.title} — 10 фраз`}
                >
                  <div className="native-situation-top">
                    <SituationIcon situation={situation} />
                    <span className="native-situation-group">
                      {groupName(situation.group)}
                    </span>
                  </div>
                  <h3>{situation.title}</h3>
                  <p className="native-situation-description">
                    {situation.description}
                  </p>
                  {query && phrases[0] && (
                    <p className="native-match-preview" lang="en">
                      {phrases[0].english}
                    </p>
                  )}
                  <span className="native-situation-footer">
                    <span>
                      {query
                        ? `Найдено: ${titleMatches ? 10 : phrases.length} из 10`
                        : "10 фраз · Открыть"}
                    </span>
                    <ArrowRight size={19} aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="native-empty">
              <Search size={30} aria-hidden="true" />
              <h3>Пока ничего не нашлось</h3>
              <p>
                Попробуйте другую фразу на английском, казахском или русском
                либо посмотрите все ситуации.
              </p>
              <button
                className="native-reset"
                onClick={() => {
                  setSearch("");
                  setGroup("all");
                }}
              >
                Показать все ситуации
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
          <aside className="native-library-tip">
            <Lightbulb size={20} aria-hidden="true" />
            <p>
              Выберите ситуацию, послушайте фразу и произнесите её вслух.
              Начните с пары выражений, которые пригодятся уже сегодня. Звучать
              естественно — значит уместно выражать свои мысли, сохраняя свой
              голос и акцент.
            </p>
          </aside>
        </section>
      )}
    </div>
  );
}
