export const LogoMark = ({ size = 40, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <rect x="4" y="4" width="40" height="40" rx="12" fill="#2F5233" />
    <rect x="14" y="16" width="20" height="18" rx="3" stroke="#FAF7F2" strokeWidth="2" />
    <path d="M14 22h20" stroke="#FAF7F2" strokeWidth="2" strokeLinecap="round" />
    <circle cx="19" cy="28" r="1.5" fill="#C4785A" />
    <circle cx="24" cy="28" r="1.5" fill="#C4785A" />
    <circle cx="29" cy="28" r="1.5" fill="#FAF7F2" fillOpacity="0.5" />
    <path d="M18 12v4M30 12v4" stroke="#C4785A" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Logo = ({
  showText = true,
  compact = false,
  light = false,
  markSize = 40,
  className = "",
}) => {
  const title = compact
    ? "Club & Event Management"
    : "College Club and Event Management System";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
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
