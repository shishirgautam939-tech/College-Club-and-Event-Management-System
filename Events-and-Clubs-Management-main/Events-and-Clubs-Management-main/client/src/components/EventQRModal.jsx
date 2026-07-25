import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, QrCode } from "lucide-react";
import { getEventQRAttendance } from "../api/participation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

/**
 * Reusable modal that fetches and displays the student's attendance QR for
 * an event. Always re-fetches on open so the displayed code matches the
 * current server token (handles organizer rotations and lazy activations).
 */
const EventQRModal = ({ event, onClose, onAfterClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQr = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEventQRAttendance(event.id);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not load the QR code.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (event?.id) fetchQr();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  const close = () => {
    onClose?.();
    onAfterClose?.();
  };

  const downloadPng = () => {
    if (!data?.qr_image_base64) return;
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${data.qr_image_base64}`;
    link.download = `qr_${event.title?.replace(/\s+/g, "_") || "event"}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const expiryLabel = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const statusBadge = () => {
    if (loading) return <StatusBadge tone="muted">Loading…</StatusBadge>;
    if (error) return <StatusBadge tone="danger">Error</StatusBadge>;
    if (data?.qr_active && data?.qr_image_base64)
      return <StatusBadge tone="success">Active</StatusBadge>;
    return <StatusBadge tone="muted">Not active</StatusBadge>;
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>
            Show this code at the event entrance to mark attendance.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {statusBadge()}
            {data?.expires_at && (
              <span className="text-xs text-muted-foreground">
                Expires {expiryLabel(data.expires_at)}
              </span>
            )}
          </div>

          <div className="rounded-xl border bg-muted/40 p-4 text-center">
            {loading ? (
              <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span>Loading QR…</span>
              </div>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : data?.qr_active && data?.qr_image_base64 ? (
              <img
                src={`data:image/png;base64,${data.qr_image_base64}`}
                alt="Event attendance QR code"
                className="mx-auto h-64 w-64 rounded-xl border bg-white p-3"
              />
            ) : (
              <div className="flex min-h-32 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <QrCode className="size-6" />
                <p>The QR code is not active yet. Tap Refresh in a moment.</p>
              </div>
            )}
          </div>

          {data?.qr_payload && (
            <p className="break-all text-center text-xs text-muted-foreground/70">
              {data.qr_payload}
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" onClick={fetchQr} disabled={loading}>
            Refresh
          </Button>
          <Button type="button" variant="outline" nativeButton={false} render={<Link to="/scan-attendance" onClick={close} />}>
            Scan on another device
          </Button>
          <Button type="button" onClick={downloadPng} disabled={!data?.qr_image_base64 || loading}>
            Download QR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EventQRModal;
