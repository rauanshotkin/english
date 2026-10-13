import { useEffect, useRef } from "react";
import { ArrowRight, Headphones, LayoutDashboard, X } from "lucide-react";

interface MobileMoreMenuProps {
  open: boolean;
  activeView: string;
  onNavigate: (view: "overview" | "listening") => void;
  onClose: () => void;
}

export default function MobileMoreMenu({
  open,
  activeView,
  onNavigate,
  onClose,
}: MobileMoreMenuProps) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current?.close();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1101px)");
    const onChange = () => {
      if (desktop.matches) onClose();
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, [open, onClose]);
  return (
    <dialog
      ref={ref}
      className="mobile-more-dialog"
      aria-labelledby="mobile-more-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mobile-more-heading">
        <h2 id="mobile-more-title">Другие разделы</h2>
        <button
          className="icon-button"
          aria-label="Закрыть меню разделов"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>
      <p>Всё для твоего английского — в своём ритме.</p>
      {[
        {
          id: "listening" as const,
          label: "Аудирование",
          description: "Слушай и привыкай к звучанию",
          icon: Headphones,
        },
        {
          id: "overview" as const,
          label: "Моё пространство",
          description: "Прогресс и маленькие победы",
          icon: LayoutDashboard,
        },
      ].map(({ id, label, description, icon: Icon }) => (
        <button
          key={id}
          className={`mobile-more-item ${activeView === id ? "active" : ""}`}
          onClick={() => {
            onNavigate(id);
            onClose();
          }}
        >
          <Icon size={24} />
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          <ArrowRight size={18} />
        </button>
      ))}
    </dialog>
  );
}
