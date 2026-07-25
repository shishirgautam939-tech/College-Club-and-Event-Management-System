import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * A floating action button in the spirit of high-end productivity apps —
 * a soft-glowing pill anchored to the bottom-right. Purely presentational:
 * it navigates via react-router (`to`) or fires `onClick`, so it never
 * changes any existing routing or business logic.
 *
 * On small screens it collapses to a circular icon; from `sm` up it expands
 * to show the label.
 */
const FloatingActionButton = ({ to, onClick, icon: Icon, label, className }) => {
  const classes = cn(
    "group fixed right-5 bottom-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-primary to-[#0f5245] px-4 py-4 text-primary-foreground shadow-[0_12px_30px_-8px_color-mix(in_oklch,var(--primary)_55%,transparent)] outline-none transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 focus-visible:ring-4 focus-visible:ring-primary/40 active:translate-y-0 sm:right-8 sm:bottom-8 sm:px-5",
    className
  );

  const inner = (
    <>
      {Icon && <Icon className="size-5 shrink-0 transition-transform duration-300 group-hover:rotate-90" />}
      {label && (
        <span className="hidden text-sm font-semibold whitespace-nowrap sm:inline">{label}</span>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={classes} style={{ animation: "fab-pulse 2.8s ease-out infinite" }}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} className={classes} style={{ animation: "fab-pulse 2.8s ease-out infinite" }}>
      {inner}
    </button>
  );
};

export default FloatingActionButton;
