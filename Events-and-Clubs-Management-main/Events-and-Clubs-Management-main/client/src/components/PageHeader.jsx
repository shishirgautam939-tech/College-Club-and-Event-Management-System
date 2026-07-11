import { cn } from "@/lib/utils";

const PageHeader = ({ eyebrow, title, subtitle, actions, className }) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#35543b] to-[#27402d] px-6 py-5 text-white shadow-lg shadow-[#243f27]/20",
      className
    )}
  >
    <div className="pointer-events-none absolute -top-1/2 -right-[10%] h-[200%] w-[60%] rounded-full bg-orange-400/20 blur-3xl" />
    <div className="relative z-10">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-xs font-semibold tracking-[0.1em] text-white/80 uppercase">
          {eyebrow}
        </span>
      )}
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl leading-tight font-bold tracking-tight text-white sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/80">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  </div>
);

export default PageHeader;
