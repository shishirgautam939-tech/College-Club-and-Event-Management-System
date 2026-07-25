import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// A local stand-in for Khalti's hosted checkout, used when the app runs in
// mock mode (no real Khalti key configured). It mimics the real flow: the
// student confirms or cancels, then we redirect to /payment/callback with the
// pidx and outcome — exactly the shape the real gateway returns.
const MockCheckout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  const pidx = params.get("pidx");
  const amountPaisa = Number(params.get("amount") || 0);
  const rupees = amountPaisa / 100;
  const amountLabel = `NPR ${rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2)}`;

  const finish = (status) => {
    if (!pidx) {
      navigate("/dashboard");
      return;
    }
    setRedirecting(true);
    navigate(`/payment/callback?pidx=${encodeURIComponent(pidx)}&status=${encodeURIComponent(status)}`);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden p-0">
        <div className="flex items-center justify-between bg-[#5C2D91] px-5 py-4 text-white">
          <span className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="size-5" /> Khalti
          </span>
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium">
            Test / Sandbox
          </span>
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Amount to pay</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{amountLabel}</p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="flex items-center gap-1.5 font-medium text-foreground">
              <ShieldCheck className="size-3.5" /> Simulated payment
            </p>
            <p className="mt-1">
              This is a dummy checkout for testing. No real money is charged. Confirm to
              complete the payment and register for the event.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              className="h-11 w-full bg-[#5C2D91] text-white hover:bg-[#4a2475]"
              disabled={redirecting || !pidx}
              onClick={() => finish("Completed")}
            >
              {redirecting ? <Loader2 className="size-4 animate-spin" /> : `Pay ${amountLabel}`}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={redirecting}
              onClick={() => finish("User canceled")}
            >
              Cancel payment
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MockCheckout;
