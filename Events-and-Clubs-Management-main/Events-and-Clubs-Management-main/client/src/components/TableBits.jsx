// Small presentational helpers used across admin tables for a more
// attractive, consistent look-and-feel. Keeping them in one place so the
// individual page components stay focused on data wiring.

export const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("") || "?";

const TONE_BG = {
  brand: "linear-gradient(135deg, #4a7a52, #2f5233)",
  accent: "linear-gradient(135deg, #d49079, #a86145)",
  violet: "linear-gradient(135deg, #a78bfa, #6d28d9)",
  sky: "linear-gradient(135deg, #7dd3fc, #0369a1)",
  amber: "linear-gradient(135deg, #fcd34d, #b45309)",
  muted: "linear-gradient(135deg, #d6d3d1, #57534e)",
};

export const TableAvatar = ({ name = "", tone = "brand", size = "md" }) => {
  const initials = initialsOf(name);
  const dims = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-[0.8rem]";
  return (
    <span
      className={`${dims} rounded-full inline-flex items-center justify-center font-semibold text-white shrink-0`}
      style={{ background: TONE_BG[tone] || TONE_BG.brand }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
};

export const ActionButton = ({ tone = "neutral", title, onClick, children }) => {
  const cls =
    tone === "danger"
      ? "icon-btn icon-btn-danger"
      : tone === "primary"
      ? "icon-btn"
      : "icon-btn";
  return (
    <button type="button" onClick={onClick} className={cls} title={title} aria-label={title}>
      {children}
    </button>
  );
};

export const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const AttendanceIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const TableEmpty = ({ icon = "📭", title = "Nothing here yet", sub }) => (
  <div className="table-empty">
    <span className="table-empty-icon" aria-hidden="true">
      {icon}
    </span>
    <p style={{ fontWeight: 600, color: "#1c1917" }}>{title}</p>
    {sub && <p style={{ marginTop: "0.25rem" }}>{sub}</p>}
  </div>
);
