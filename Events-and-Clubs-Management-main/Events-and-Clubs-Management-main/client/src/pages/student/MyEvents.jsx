import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Loader2, ScanLine } from "lucide-react";
import {
  getMyRegistrations,
  unregisterFromEvent,
  downloadMyEventCertificate,
} from "../../api/participation";
import { saveBlobAsFile } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";
import EventQRModal from "../../components/EventQRModal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [qrEvent, setQrEvent] = useState(null);
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await getMyRegistrations();
      setRegistrations(res.data);
    } catch {
      setError("Failed to load your registrations.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnregister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await unregisterFromEvent(eventId);
      setActionMsg({ type: "success", text: "Unregistered successfully." });
      fetchRegistrations();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to unregister.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDownloadCertificate = async (registration) => {
    setDownloadingId(registration.event);
    try {
      const res = await downloadMyEventCertificate(registration.event);
      saveBlobAsFile(
        res.data,
        `certificate_${registration.event_title.replace(/\s+/g, "_")}.pdf`,
      );
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Certificate not available yet.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const upcoming = registrations.filter((r) => r.event_status === "Approved");
  const completed = registrations.filter((r) => r.event_status === "Completed");

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading your events…</span>
      </div>
    );
  }

  const attendanceBadge = (status) => {
    if (status === "Present") return <StatusBadge tone="success">Present</StatusBadge>;
    if (status === "Absent") return <StatusBadge tone="danger">Absent</StatusBadge>;
    return <StatusBadge tone="muted">Not marked</StatusBadge>;
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={<><Bookmark className="size-3.5" /> Your registrations</>}
        title="My events"
        subtitle="Track your registrations, attendance, and certificates in one place."
        actions={
          <Button variant="secondary" className="gap-2" nativeButton={false} render={<Link to="/scan-attendance" />}>
            <ScanLine className="size-4" />
            Scan QR to check in
          </Button>
        }
      />

      {error && <InlineAlert type="error">{error}</InlineAlert>}
      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      {registrations.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="mb-4 text-sm text-muted-foreground">You haven&apos;t joined any events yet.</p>
          <Button nativeButton={false} render={<Link to="/dashboard" />}>Browse events</Button>
        </Card>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground">Upcoming ({upcoming.length})</h2>
              <div className="grid gap-4">
                {upcoming.map((r, i) => (
                  <Card
                    key={r.id}
                    className="hover-lift animate-fade-up flex flex-col gap-4 p-5 hover:shadow-soft-lg md:flex-row md:items-center md:justify-between"
                    style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{r.event_title}</h3>
                      <p className="text-sm text-primary">{r.club_name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(r.event_date)} · {r.venue || "Venue TBA"}
                      </p>
                      {(r.attendance_qr_active || r.qr_payload) ? (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <StatusBadge tone="success">{r.attendance_qr_active ? "QR active" : "QR ready"}</StatusBadge>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setQrEvent({ id: r.event, title: r.event_title })}
                          >
                            View QR
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" nativeButton={false} render={<Link to="/scan-attendance" />}>
                        Check in
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleUnregister(r.event)}
                        disabled={actionInProgress === r.event}
                        className="text-destructive hover:text-destructive"
                      >
                        {actionInProgress === r.event ? "Processing..." : "Unregister"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-foreground">Past events ({completed.length})</h2>
              <div className="grid gap-4">
                {completed.map((r, i) => (
                  <Card
                    key={r.id}
                    className="hover-lift animate-fade-up flex flex-col gap-4 p-5 hover:shadow-soft-lg md:flex-row md:items-center md:justify-between"
                    style={{ animationDelay: `${Math.min(i * 50, 300)}ms` }}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">{r.event_title}</h3>
                      <p className="text-sm text-primary">{r.club_name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDateTime(r.event_date)} · {r.venue || "—"}
                      </p>
                      <div className="mt-2">{attendanceBadge(r.attendance_status)}</div>
                    </div>
                    {r.event_status === "Completed" && (
                      <Button
                        type="button"
                        onClick={() => handleDownloadCertificate(r)}
                        disabled={downloadingId === r.event}
                      >
                        {downloadingId === r.event ? "Preparing..." : "Download certificate"}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {qrEvent && (
        <EventQRModal event={qrEvent} onClose={() => setQrEvent(null)} onAfterClose={() => setQrEvent(null)} />
      )}
    </div>
  );
};

export default MyEvents;
