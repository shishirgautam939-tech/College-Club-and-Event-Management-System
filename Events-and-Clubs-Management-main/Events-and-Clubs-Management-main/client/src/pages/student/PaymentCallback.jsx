import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import { verifyPayment } from "../../api/payments";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Khalti redirects the browser here after payment with query params including
// `pidx` and `status`. We never trust that `status`; the backend re-verifies
// the payment server-side via the pidx lookup and finalizes registration.
const PaymentCallback = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState("verifying"); // verifying | success | pending | failed
  const [message, setMessage] = useState("");
  const [eventTitle, setEventTitle] = useState("");
  // Guard against React 18 StrictMode double-invoking the effect.
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    verifiedRef.current = true;

    (async () => {
      const pidx = params.get("pidx");
      if (!pidx) {
        setState("failed");
        setMessage("Missing payment reference. Please try registering again.");
        return;
      }
      try {
        const res = await verifyPayment(pidx, params.get("status"));
        const data = res.data || {};
        setEventTitle(data.event_title || "");
        setMessage(data.detail || "");
        if (data.is_completed && data.registered) {
          setState("success");
        } else if (data.is_completed && !data.registered) {
          // Paid but registration couldn't be created (e.g. event filled up).
          setState("pending");
          setMessage(
            data.registration_error ||
              "Your payment succeeded, but registration could not be completed. Please contact the organizer.",
          );
        } else if (data.status === "Pending") {
          setState("pending");
        } else {
          setState("failed");
        }
      } catch (err) {
        setState("failed");
        setMessage(
          err.response?.data?.detail ||
            "We couldn't verify your payment. If you were charged, please contact the organizer.",
        );
      }
    })();
  }, [params]);

  const config = {
    verifying: {
      icon: <Loader2 className="size-10 animate-spin text-primary" />,
      title: "Verifying your payment…",
      tone: "text-muted-foreground",
    },
    success: {
      icon: <CheckCircle2 className="size-10 text-emerald-600" />,
      title: "Payment successful",
      tone: "text-emerald-700",
    },
    pending: {
      icon: <Clock className="size-10 text-amber-500" />,
      title: "Payment received",
      tone: "text-amber-600",
    },
    failed: {
      icon: <XCircle className="size-10 text-destructive" />,
      title: "Payment not completed",
      tone: "text-destructive",
    },
  }[state];

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        {config.icon}
        <div className="flex flex-col gap-1.5">
          <h1 className={`text-xl font-semibold ${config.tone}`}>{config.title}</h1>
          {eventTitle && (
            <p className="text-sm font-medium text-foreground">{eventTitle}</p>
          )}
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </div>

        {state !== "verifying" && (
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
            {state === "success" ? (
              <Button className="flex-1" nativeButton={false} render={<Link to="/my-events" />}>
                Go to My Events
              </Button>
            ) : (
              <Button className="flex-1" onClick={() => navigate("/dashboard")}>
                Back to Events
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1"
              nativeButton={false}
              render={<Link to="/dashboard" />}
            >
              Browse events
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentCallback;
