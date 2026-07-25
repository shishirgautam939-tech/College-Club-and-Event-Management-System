import { cn } from "@/lib/utils";

const PageHeader = ({ eyebrow, title, subtitle, actions, className }) => (
  <div
    className={cn(
      "animate-fade-up relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d3b34] via-[#146356] to-[#1c3f57] px-6 py-6 text-white shadow-soft-lg sm:px-8 sm:py-7",
      className
    )}
  >
    {/* Ambient light — soft, slowly drifting colour blooms */}
    <div className="animate-float-slow pointer-events-none absolute -top-1/2 -right-[8%] h-[200%] w-[55%] rounded-full bg-amber-300/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-1/2 -left-[10%] h-[200%] w-[45%] rounded-full bg-sky-400/12 blur-3xl" />
    {/* Glossy top edge highlight */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

    <div className="relative z-10">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-[0.1em] text-white/85 uppercase backdrop-blur-sm">
          {eyebrow}
        </span>
      )}
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl leading-[1.1] font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/80">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  </div>
);

export default PageHeader;
