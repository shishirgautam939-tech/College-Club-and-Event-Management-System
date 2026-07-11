import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("") || "?";

const TONE_CLASS = {
  brand: "bg-primary text-primary-foreground",
  accent: "bg-orange-500 text-white",
  violet: "bg-violet-500 text-white",
  sky: "bg-sky-500 text-white",
  amber: "bg-amber-500 text-white",
  muted: "bg-neutral-400 text-white",
};

export const TableAvatar = ({ name = "", tone = "brand", size = "md" }) => (
  <Avatar size={size === "sm" ? "sm" : "default"}>
    <AvatarFallback className={cn("font-semibold", TONE_CLASS[tone] || TONE_CLASS.brand)}>
      {initialsOf(name)}
    </AvatarFallback>
  </Avatar>
);

export const ActionButton = ({ tone = "neutral", title, onClick, children, disabled }) => (
  <Button
    type="button"
    variant={tone === "danger" ? "destructive" : "ghost"}
    size="icon-sm"
    onClick={onClick}
    title={title}
    aria-label={title}
    disabled={disabled}
  >
    {children}
  </Button>
);

export const TableEmpty = ({ icon, title = "Nothing here yet", sub }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
    <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground/70">
      {icon ?? <Inbox className="size-5" />}
    </span>
    <p className="font-medium text-foreground">{title}</p>
    {sub && <p>{sub}</p>}
  </div>
);
