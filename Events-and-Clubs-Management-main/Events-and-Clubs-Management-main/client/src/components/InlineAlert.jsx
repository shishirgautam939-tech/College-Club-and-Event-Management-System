import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const InlineAlert = ({ type = "error", className, children }) => {
  if (!children) return null;
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;
  return (
    <Alert
      variant={isSuccess ? "default" : "destructive"}
      className={cn(isSuccess && "border-emerald-200 bg-emerald-50 text-emerald-800 [&_svg]:text-emerald-600", className)}
    >
      <Icon />
      <AlertDescription className={isSuccess ? "text-emerald-800/90" : undefined}>{children}</AlertDescription>
    </Alert>
  );
};

export default InlineAlert;
