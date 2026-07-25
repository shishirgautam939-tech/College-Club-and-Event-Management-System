import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Receipt, Wallet } from "lucide-react";
import { getMyPayments } from "../../api/payments";
import { formatDateTime } from "../../utils/formatDate";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const STATUS_TONE = {
  Completed: "success",
  Pending: "warning",
  Initiated: "info",
  Failed: "danger",
  Cancelled: "muted",
  Expired: "muted",
  Refunded: "violet",
};

const formatFee = (fee) => {
  const amount = Number(fee);
  if (Number.isNaN(amount)) return "NPR 0";
  return `NPR ${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
};

const MyPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await getMyPayments();
        setPayments(res.data);
      } catch {
        setError("Failed to load your payments.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading your payments…</span>
      </div>
    );
  }

  const completedTotal = payments
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={<><Wallet className="size-3.5" /> Transactions</>}
        title="My payments"
        subtitle="Your event registration payments made through Khalti."
      />

      {error && <InlineAlert type="error">{error}</InlineAlert>}

      {payments.length === 0 ? (
        <Card className="p-10 text-center">
          <Receipt className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="mb-4 text-sm text-muted-foreground">
            You haven&apos;t made any payments yet. Paid events show a
            &ldquo;Pay &amp; Register&rdquo; option.
          </p>
          <Button nativeButton={false} render={<Link to="/dashboard" />}>Browse events</Button>
        </Card>
      ) : (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-2 p-4">
            <span className="text-sm text-muted-foreground">
              {payments.length} transaction{payments.length === 1 ? "" : "s"}
            </span>
            <span className="text-sm">
              <span className="text-muted-foreground">Total paid: </span>
              <strong className="font-semibold text-foreground">{formatFee(completedTotal)}</strong>
            </span>
          </Card>

          <div className="grid gap-4">
            {payments.map((p, i) => (
              <Card
                key={p.id}
                className="hover-lift animate-fade-up flex flex-col gap-3 p-5 hover:shadow-soft-lg sm:flex-row sm:items-center sm:justify-between"
                style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">{p.event_title}</h3>
                    <StatusBadge tone={STATUS_TONE[p.status] || "muted"} dot>
                      {p.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDateTime(p.created_at)}
                  </p>
                  <p className="mt-1 font-mono text-xs break-all text-muted-foreground">
                    {p.transaction_id
                      ? `Txn: ${p.transaction_id}`
                      : `Ref: ${p.purchase_order_id}`}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-lg font-semibold text-foreground">{formatFee(p.amount)}</p>
                  <p className="text-xs text-muted-foreground">via Khalti</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default MyPayments;
