import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getMyRegistrations,
  unregisterFromEvent,
  downloadMyEventCertificate,
} from "../../api/participation";
import { saveBlobAsFile } from "../../utils/downloadFile";
import { formatDateTime } from "../../utils/formatDate";

const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

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

  if (loading) return <p className="text-stone-500">Loading your events...</p>;

  const attendanceBadge = (status) => {
    if (status === "Present") return <span className="badge badge-success">Present</span>;
    if (status === "Absent") return <span className="badge bg-red-50 text-red-700">Absent</span>;
    return <span className="badge badge-muted">Not marked</span>;
  };

  return (
    <div className="page-shell">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="page-title">My Events</h1>
          <p className="page-subtitle">Events you&apos;ve signed up for, your check-ins, and certificates.</p>
        </div>
        <Link to="/scan-attendance" className="btn-primary">
          Scan QR to check in
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          {actionMsg.text}
        </div>
      )}

      {registrations.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-stone-500 mb-4">You haven&apos;t joined any events yet.</p>
          <Link to="/dashboard" className="btn-primary inline-block">
            Browse events
          </Link>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-800">Upcoming ({upcoming.length})</h2>
              <div className="grid gap-4">
                {upcoming.map((r) => (
                  <div key={r.id} className="card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-stone-800">{r.event_title}</h3>
                      <p className="text-sm text-brand-700">{r.club_name}</p>
                      <p className="text-sm text-stone-500 mt-1">
                        {formatDateTime(r.event_date)} · {r.venue || "Venue TBA"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link to="/scan-attendance" className="btn-secondary">
                        Check in
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleUnregister(r.event)}
                        disabled={actionInProgress === r.event}
                        className="btn-secondary text-red-700 hover:bg-red-50"
                      >
                        {actionInProgress === r.event ? "..." : "Unregister"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-800">Past events ({completed.length})</h2>
              <div className="grid gap-4">
                {completed.map((r) => (
                  <div key={r.id} className="card p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-stone-800">{r.event_title}</h3>
                      <p className="text-sm text-brand-700">{r.club_name}</p>
                      <p className="text-sm text-stone-500 mt-1">
                        {formatDateTime(r.event_date)} · {r.venue || "—"}
                      </p>
                      <div className="mt-2">{attendanceBadge(r.attendance_status)}</div>
                    </div>
                    {r.attendance_status === "Present" && (
                      <button
                        type="button"
                        onClick={() => handleDownloadCertificate(r)}
                        disabled={downloadingId === r.event}
                        className="btn-accent"
                      >
                        {downloadingId === r.event ? "Preparing..." : "Download certificate"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default MyEvents;
