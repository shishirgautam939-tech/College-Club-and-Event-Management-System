import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  success: "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15",
  warning: "border-transparent bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15",
  danger: "border-transparent bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/15",
  info: "border-transparent bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15",
  violet: "border-transparent bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/15",
  brand: "border-transparent bg-primary/10 text-primary ring-1 ring-inset ring-primary/15",
  accent: "border-transparent bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/15",
  muted: "border-transparent bg-muted text-muted-foreground ring-1 ring-inset ring-foreground/10",
};

const StatusBadge = ({ tone = "muted", dot = false, className, children }) => (
  <Badge variant="outline" className={cn(TONE_CLASS[tone] || TONE_CLASS.muted, "gap-1.5 font-semibold", className)}>
    {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" />}
    {children}
  </Badge>
);

export default StatusBadge;
