import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getEventQRAttendance } from "../api/participation";

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
    if (loading) return <span className="badge badge-muted">Loading…</span>;
    if (error) return <span className="badge bg-red-50 text-red-700">Error</span>;
    if (data?.qr_active && data?.qr_image_base64)
      return <span className="badge badge-success">Active</span>;
    return <span className="badge badge-muted">Not active</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-stone-800">
              {event.title}
            </h3>
            <p className="text-sm text-stone-500">
              Show this code at the event entrance to mark attendance.
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="btn-secondary"
            aria-label="Close QR modal"
          >
            Close
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {statusBadge()}
          {data?.expires_at && (
            <span className="text-xs text-stone-500">
              Expires {expiryLabel(data.expires_at)}
            </span>
          )}
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-center">
          {loading ? (
            <p className="text-stone-500">Loading QR…</p>
          ) : error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : data?.qr_active && data?.qr_image_base64 ? (
            <img
              src={`data:image/png;base64,${data.qr_image_base64}`}
              alt="Event attendance QR code"
              className="mx-auto h-64 w-64 rounded-xl border border-stone-200 bg-white p-3"
            />
          ) : (
            <p className="text-sm text-stone-500">
              The QR code is not active yet. Tap Refresh in a moment.
            </p>
          )}
        </div>

        {data?.qr_payload && (
          <p className="mt-2 break-all text-center text-xs text-stone-400">
            {data.qr_payload}
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={fetchQr}
            disabled={loading}
            className="btn-secondary"
          >
            Refresh
          </button>
          <Link
            to="/scan-attendance"
            onClick={close}
            className="btn-secondary"
          >
            Scan on another device
          </Link>
          <button
            type="button"
            onClick={downloadPng}
            disabled={!data?.qr_image_base64 || loading}
            className="btn-accent"
          >
            Download QR
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventQRModal;
