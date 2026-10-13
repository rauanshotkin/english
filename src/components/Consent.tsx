import { useEffect, useId, useRef, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
import type { ConsentPreferences } from "../lib/storage";

interface ConsentProps {
  consent: ConsentPreferences | null;
  onSave: (consent: ConsentPreferences) => void;
  /** A footer link can control opening the preferences and policy dialog. */
  open?: boolean;
  onClose?: () => void;
  /** Static hosts cannot provide the server-backed visitor counter. */
  analyticsAvailable?: boolean;
}

const REQUIRED_ONLY: ConsentPreferences = {
  preferences: false,
  analytics: false,
};
const ALL_COOKIES: ConsentPreferences = { preferences: true, analytics: true };

export default function Consent({
  consent,
  onSave,
  open = false,
  onClose,
  analyticsAvailable = true,
}: ConsentProps) {
  const [localOpen, setLocalOpen] = useState(false);
  const [choices, setChoices] = useState<ConsentPreferences>(
    consent ?? REQUIRED_ONLY,
  );
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = useId();
  const descriptionId = useId();
  const isOpen = open || localOpen;

  function close() {
    setLocalOpen(false);
    onClose?.();
  }

  function save(next: ConsentPreferences) {
    onSave({ ...next, analytics: analyticsAvailable && next.analytics });
    close();
  }

  useEffect(() => {
    if (isOpen) setChoices(consent ?? REQUIRED_ONLY);
  }, [isOpen, consent]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), a[href], input:not([disabled]), summary, [tabindex="0"]';
    dialog?.querySelector<HTMLElement>(focusableSelector)?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setLocalOpen(false);
        onCloseRef.current?.();
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [isOpen]);

  return (
    <>
      {!consent && !isOpen && (
        <aside className="consent-banner" aria-label="Настройки cookie">
          <div className="consent-banner-icon">
            <Cookie size={22} aria-hidden="true" />
          </div>
          <div className="consent-banner-copy">
            <strong>Немного заботы о вашем прогрессе</strong>
            <p>
              Cookie могут запомнить главу и слова.{" "}
              {analyticsAvailable
                ? "Статистика — только с вашего согласия."
                : "Вы сами выбираете, что сохранять в этом браузере."}
            </p>
          </div>
          <div className="consent-banner-actions">
            <button
              type="button"
              className="consent-button consent-button-quiet"
              onClick={() => save(REQUIRED_ONLY)}
            >
              Только необходимые
            </button>
            <button
              type="button"
              className="consent-button consent-button-outline"
              onClick={() => setLocalOpen(true)}
            >
              Настроить
            </button>
            <button
              type="button"
              className="consent-button consent-button-primary"
              onClick={() => save(ALL_COOKIES)}
            >
              Принять все
            </button>
          </div>
        </aside>
      )}

      {isOpen && (
        <div
          className="consent-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            className="consent-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <button
              type="button"
              className="consent-close icon-button"
              aria-label="Закрыть настройки cookie"
              onClick={close}
            >
              <X size={20} />
            </button>
            <div className="consent-dialog-icon">
              <ShieldCheck size={28} aria-hidden="true" />
            </div>
            <p className="consent-eyebrow">ПРОЗРАЧНО И ПОНЯТНО</p>
            <h2 id={titleId}>
              Ваше пространство,
              <br />
              ваши настройки
            </h2>
            <p className="consent-description" id={descriptionId}>
              Можно читать без необязательных cookie. Выберите, что сохранять, —
              и меняйте решение в любой момент.
            </p>

            <div className="consent-options">
              <div className="consent-option">
                <div>
                  <strong>Необходимые</strong>
                  <p>Запоминают только ваше решение о cookie на 180 дней.</p>
                </div>
                <span className="consent-required">Всегда включены</span>
              </div>
              <div className="consent-option">
                <div>
                  <strong id={`${titleId}-preferences`}>
                    Мой прогресс и слова
                  </strong>
                  <p>
                    Глава, прочитанные главы, настройки чтения и избранные слова
                    — на 180 дней в этом браузере.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={choices.preferences}
                  aria-labelledby={`${titleId}-preferences`}
                  className={`consent-toggle ${choices.preferences ? "is-active" : ""}`}
                  onClick={() =>
                    setChoices((current) => ({
                      ...current,
                      preferences: !current.preferences,
                    }))
                  }
                >
                  <span aria-hidden="true" />
                </button>
              </div>
              {analyticsAvailable && (
                <div className="consent-option">
                  <div>
                    <strong id={`${titleId}-analytics`}>
                      Анонимный счётчик
                    </strong>
                    <p>
                      Помогает узнать, сколько браузеров посещают Lumi. Не
                      связан с текстом, который вы читаете.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={choices.analytics}
                    aria-labelledby={`${titleId}-analytics`}
                    className={`consent-toggle ${choices.analytics ? "is-active" : ""}`}
                    onClick={() =>
                      setChoices((current) => ({
                        ...current,
                        analytics: !current.analytics,
                      }))
                    }
                  >
                    <span aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <details className="consent-policy">
              <summary>Политика использования cookie и данных</summary>
              <div className="consent-policy-copy">
                <p>
                  <strong>Кто и зачем.</strong> Lumi — приложение для изучения
                  английского через чтение. Авторизация и рекламные cookie не
                  используются. Необязательные cookie включаются только после
                  вашего согласия.
                </p>
                <p>
                  <strong>Чтение.</strong> Cookie <code>lumi_consent</code>{" "}
                  хранит выбор согласия; <code>lumi_progress</code> — главу и
                  настройки; <code>lumi_words</code> — сохранённые слова,
                  переводы и язык перевода. Примеры предложений доступны только
                  в текущем сеансе и в cookie не записываются. Срок — 180 дней с
                  последнего сохранения. Импортированные тексты целиком не
                  сохраняются. Словарь ограничен 25 записями и размером cookie;
                  старые записи удаляются при заполнении.
                </p>
                {analyticsAvailable ? (
                  <p>
                    <strong>Счётчик.</strong> При согласии cookie{" "}
                    <code>reader_visitor</code> получает случайный идентификатор
                    сроком до 365 дней. Сервер хранит его хеш до 365 дней.
                    Приложение не использует IP-адрес или отпечаток устройства
                    для идентификации. Счётчик отражает согласившиеся браузеры,
                    а не точное число людей. Разные устройства и удаление cookie
                    влияют на результат.
                  </p>
                ) : (
                  <p>
                    <strong>Размещение.</strong> Эта версия размещается на
                    GitHub Pages. Приложение не включает аналитику и не создаёт
                    идентификатор посетителя. GitHub может обрабатывать
                    технические данные запросов для работы хостинга согласно{" "}
                    <a
                      href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      своей политике конфиденциальности
                    </a>
                    .
                  </p>
                )}
                <p>
                  <strong>Перевод.</strong> Если перевода нет в словаре, при
                  вашем запросе выбранный текст передаётся сервису MyMemory для
                  перевода. Не отправляйте личные или конфиденциальные сведения.
                  У сервиса есть{" "}
                  <a
                    href="https://mymemory.translated.net/doc/usagelimits.php"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ограничения использования
                  </a>{" "}
                  и{" "}
                  <a
                    href="https://translated.com/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    политика конфиденциальности
                  </a>
                  .
                </p>
                <p>
                  <strong>Ваш выбор.</strong> Откройте «Cookies и приватность»
                  внизу страницы, чтобы отозвать согласие. Отключение прогресса
                  удалит соответствующие cookie.{" "}
                  {analyticsAvailable && (
                    <>
                      Отключение статистики отправит запрос на удаление
                      идентификатора из счётчика. Если сервер недоступен,
                      приложение сообщит об этом; удаление серверной записи
                      завершится после успешного повторного запроса.
                    </>
                  )}{" "}
                  До окончания текущего сеанса вы сможете продолжить чтение с
                  текущими настройками. Cookie также можно удалить средствами
                  браузера.
                </p>
              </div>
            </details>

            <div className="consent-dialog-actions">
              <button
                type="button"
                className="consent-button consent-button-outline"
                onClick={() => save(REQUIRED_ONLY)}
              >
                Только необходимые
              </button>
              <button
                type="button"
                className="consent-button consent-button-primary"
                onClick={() => save(choices)}
              >
                Сохранить мой выбор
              </button>
            </div>
            <p className="consent-footnote">
              Без согласия прогресс доступен только в текущем сеансе.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
