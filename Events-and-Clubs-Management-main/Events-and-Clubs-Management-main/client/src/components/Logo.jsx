import { useId } from "react";

export const LogoMark = ({ size = 40, className = "" }) => {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38613f" />
          <stop offset="100%" stopColor="#1a2f1d" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill={`url(#${gradientId})`} />
      <rect x="14" y="16" width="20" height="18" rx="3" stroke="#FAF7F2" strokeWidth="2" />
      <path d="M14 22h20" stroke="#FAF7F2" strokeWidth="2" strokeLinecap="round" />
      <circle cx="19" cy="28" r="1.5" fill="#C4785A" />
      <circle cx="24" cy="28" r="1.5" fill="#C4785A" />
      <circle cx="29" cy="28" r="1.5" fill="#FAF7F2" fillOpacity="0.5" />
      <path d="M18 12v4M30 12v4" stroke="#C4785A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

const Logo = ({
  showText = true,
  compact = false,
  light = false,
  markSize = 40,
  className = "",
}) => {
  const title = compact
    ? "Evento"
    : "College Club and Event Management";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} />
      {showText && (
        <div className="leading-tight">
          <span
            className={`block font-semibold tracking-tight ${
              light ? "text-white" : "text-stone-800"
            } ${compact ? "text-sm sm:text-base" : "text-base sm:text-lg max-w-[14rem] sm:max-w-none"}`}
          >
            {title}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
