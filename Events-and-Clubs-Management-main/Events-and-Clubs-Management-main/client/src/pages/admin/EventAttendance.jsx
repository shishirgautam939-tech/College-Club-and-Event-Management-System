import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getEventAttendance,
  markAttendance,
  getEventQRAttendance,
  activateEventQR,
  deactivateEventQR,
  generateEventCertificates,
} from "../../api/participation";
import { completeEvent } from "../../api/events";
import { TableAvatar, TableEmpty } from "../../components/TableBits";

const EventAttendance = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("manual");
  const [eventInfo, setEventInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEventAttendance(eventId);
      const nextParticipants = Array.isArray(res.data.participants) ? res.data.participants : [];
      setEventInfo({
        event_id: res.data.event_id,
        event_title: res.data.event_title,
        event_status: res.data.event_status,
      });
      setParticipants(
        nextParticipants.map((p) => ({
          ...p,
          present: p.present ?? false,
        })),
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchQR = async () => {
    setQrLoading(true);
    try {
      const res = await getEventQRAttendance(eventId);
      setQrData(res.data);
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not load QR attendance.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "qr") {
      fetchQR();
    }
  }, [activeTab, eventId]);

  useEffect(() => {
    if (activeTab !== "qr" || eventInfo?.event_status !== "Approved") return;
    if (qrLoading || qrData?.qr_active) return;
    handleActivateQR();
  }, [activeTab, eventInfo?.event_status, qrData?.qr_active, qrLoading]);

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return participants;

    return participants.filter((participant) => {
      const haystack = [
        participant.user_name,
        participant.user_email,
        participant.roll_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [participants, search]);

  const togglePresent = (userId) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.user_id === userId ? { ...p, present: !p.present } : p,
      ),
    );
  };

  const markAllPresent = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, present: true })));
  };

  const markAllAbsent = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, present: false })));
  };

  const handleSave = async () => {
    setActionMsg({ type: "", text: "" });
    setSaving(true);
    try {
      const attendanceData = participants.map((p) => ({
        user_id: p.user_id,
        present: p.present,
      }));
      const res = await markAttendance(eventId, attendanceData);
      setActionMsg({ type: "success", text: res.data.detail });
      fetchAttendance();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to save attendance.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateQR = async () => {
    setActionMsg({ type: "", text: "" });
    setQrLoading(true);
    try {
      const res = await activateEventQR(eventId);
      setQrData(res.data);
      setActionMsg({ type: "success", text: "QR check-in is now live for students." });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not activate QR attendance.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleDeactivateQR = async () => {
    setQrLoading(true);
    try {
      await deactivateEventQR(eventId);
      await fetchQR();
      setActionMsg({ type: "success", text: "QR check-in has been turned off." });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not deactivate QR attendance.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleCompleteEvent = async () => {
    setActionMsg({ type: "", text: "" });
    try {
      const res = await completeEvent(eventId);
      setActionMsg({
        type: "success",
        text: `${res.data.detail} ${res.data.certificates_issued || 0} certificate(s) issued.`,
      });
      fetchAttendance();
      if (activeTab === "qr") fetchQR();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not complete event.",
      });
    }
  };

  const handleGenerateCertificates = async () => {
    setActionMsg({ type: "", text: "" });
    try {
      const res = await generateEventCertificates(eventId);
      setActionMsg({ type: "success", text: res.data.detail });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not generate certificates.",
      });
    }
  };

  if (loading) return <p className="text-stone-500">Loading attendance...</p>;

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const presentCount = participants.filter((p) => p.present).length;
  const presentPct = participants.length > 0
    ? Math.round((presentCount / participants.length) * 100)
    : 0;

  return (
    <div className="page-shell space-y-6">
      <div className="page-header">
        <span className="page-header-eyebrow">Attendance · {eventInfo?.event_status}</span>
        <h1 className="page-header-title">{eventInfo?.event_title}</h1>
        <p className="page-header-sub">
          {presentCount} of {participants.length} marked present · {presentPct}% attendance
        </p>
        <div className="page-header-actions">
          <span className="page-header-stat">
            <span>✅</span>
            <span><strong>{presentCount}</strong> present</span>
          </span>
          <span className="page-header-stat">
            <span>👥</span>
            <span><strong>{participants.length}</strong> registered</span>
          </span>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          <span aria-hidden="true">{actionMsg.type === "success" ? "✅" : "⚠️"}</span>
          <span>{actionMsg.text}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={activeTab === "manual" ? "tab-btn-active" : "tab-btn"}
        >
          <span aria-hidden="true">📋</span> Manual list
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("qr")}
          className={activeTab === "qr" ? "tab-btn-active" : "tab-btn"}
        >
          <span aria-hidden="true">📱</span> QR check-in
        </button>
      </div>

      {eventInfo?.event_status === "Approved" && (
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
          <p className="text-sm text-stone-600">
            When the event ends, mark it complete to issue certificates to attendees.
          </p>
          <button type="button" onClick={handleCompleteEvent} className="btn-primary">
            <span aria-hidden="true">🏁</span> Complete event & issue certificates
          </button>
        </div>
      )}

      {eventInfo?.event_status === "Completed" && (
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
          <p className="text-sm text-stone-600">
            Regenerate certificates for all present attendees if needed.
          </p>
          <button type="button" onClick={handleGenerateCertificates} className="btn-secondary">
            <span aria-hidden="true">🔁</span> Regenerate certificates
          </button>
        </div>
      )}

      {activeTab === "manual" && (
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              <span>Attendees</span>
              <span className="table-toolbar-meta">· {filteredParticipants.length} of {participants.length}</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <div className="auth-field-input" style={{ width: "16rem", maxWidth: "100%" }}>
                <span className="auth-field-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search name, roll, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button type="button" onClick={markAllPresent} className="chip chip-success">
                ✓ Mark all present
              </button>
              <button type="button" onClick={markAllAbsent} className="chip chip-muted">
                ✗ Mark all absent
              </button>
              <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? "Saving…" : "Save attendance"}
              </button>
            </div>
          </div>

          {participants.length === 0 ? (
            <TableEmpty
              icon="🎟️"
              title="No registrations yet"
              sub="Students will appear here once they register for the event."
            />
          ) : filteredParticipants.length === 0 ? (
            <TableEmpty icon="🔍" title="No matches" sub="Try a different search term." />
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th style={{ width: "3rem" }}>#</th>
                    <th>Student</th>
                    <th>Roll no.</th>
                    <th>Email</th>
                    <th className="text-center">Present</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.map((p, idx) => (
                    <tr key={p.user_id} className={p.present ? "row-present" : ""}>
                      <td style={{ color: "#a8a29e", fontWeight: 500 }}>{idx + 1}</td>
                      <td>
                        <div className="cell-name">
                          <TableAvatar name={p.user_name} tone={p.present ? "brand" : "muted"} />
                          <div className="cell-name-text">
                            <span className="cell-name-primary">{p.user_name}</span>
                            <span className="cell-name-secondary">
                              {p.present ? "Present" : "Not yet checked in"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="cell-mono">{p.roll_number || "—"}</span>
                      </td>
                      <td style={{ color: "#57534e" }}>{p.user_email}</td>
                      <td className="text-center">
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={p.present}
                            onChange={() => togglePresent(p.user_id)}
                            className="w-5 h-5 accent-brand-700"
                          />
                          <span className={`pill ${p.present ? "pill-success" : "pill-muted"}`}>
                            {p.present ? "Present" : "Absent"}
                          </span>
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "qr" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-stone-800">Display this at the venue</h2>
            <p className="text-sm text-stone-500">
              Students scan the code with their phone to check in. Only registered students can verify.
            </p>

            {qrLoading ? (
              <p className="text-stone-500">Loading QR...</p>
            ) : qrData?.qr_active && qrData?.qr_image_base64 ? (
              <div className="flex flex-col items-center gap-4">
                <img
                  src={`data:image/png;base64,${qrData.qr_image_base64}`}
                  alt="Event attendance QR code"
                  className="w-64 h-64 rounded-2xl border border-stone-200 p-3 bg-white"
                />
                <p className="text-xs text-stone-500">
                  Expires: {qrData.expires_at ? new Date(qrData.expires_at).toLocaleString() : "—"}
                </p>
                <button type="button" onClick={handleDeactivateQR} className="btn-secondary">
                  Turn off QR check-in
                </button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <p className="text-stone-500">QR check-in is not active yet.</p>
                <button type="button" onClick={handleActivateQR} className="btn-primary">
                  Start QR check-in
                </button>
              </div>
            )}
          </div>

          <div className="card p-6 space-y-3">
            <h2 className="text-lg font-semibold text-stone-800">How it works</h2>
            <ol className="list-decimal list-inside text-sm text-stone-600 space-y-2">
              <li>Start QR check-in when the event begins.</li>
              <li>Display the code on a screen or print it at the entrance.</li>
              <li>Students open Scan QR from the menu and point their camera.</li>
              <li>Attendance is recorded instantly for registered participants.</li>
              <li>Complete the event when finished to send certificates.</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendance;
