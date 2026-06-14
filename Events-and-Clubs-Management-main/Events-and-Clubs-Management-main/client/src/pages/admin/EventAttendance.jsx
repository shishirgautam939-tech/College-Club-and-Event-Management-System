import { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchAttendance();
  }, [eventId]);

  const fetchAttendance = async () => {
    try {
      const res = await getEventAttendance(eventId);
      setEventInfo({
        event_id: res.data.event_id,
        event_title: res.data.event_title,
        event_status: res.data.event_status,
      });
      setParticipants(
        res.data.participants.map((p) => ({
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
    if (activeTab === "qr") fetchQR();
  }, [activeTab, eventId]);

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

  return (
    <div className="page-shell space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-sm text-brand-700 hover:text-brand-900 mb-2 inline-flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="page-title">Attendance — {eventInfo?.event_title}</h1>
        <p className="page-subtitle">
          {presentCount} of {participants.length} marked present · Status: {eventInfo?.event_status}
        </p>
      </div>

      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          {actionMsg.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={activeTab === "manual" ? "tab-btn-active" : "tab-btn"}
        >
          Manual list
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("qr")}
          className={activeTab === "qr" ? "tab-btn-active" : "tab-btn"}
        >
          QR check-in
        </button>
      </div>

      {eventInfo?.event_status === "Approved" && (
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
          <p className="text-sm text-stone-600">
            When the event ends, mark it complete to issue certificates to attendees.
          </p>
          <button type="button" onClick={handleCompleteEvent} className="btn-primary">
            Complete event & issue certificates
          </button>
        </div>
      )}

      {eventInfo?.event_status === "Completed" && (
        <div className="card p-4 flex flex-wrap gap-3 items-center justify-between">
          <p className="text-sm text-stone-600">
            Regenerate certificates for all present attendees if needed.
          </p>
          <button type="button" onClick={handleGenerateCertificates} className="btn-secondary">
            Regenerate certificates
          </button>
        </div>
      )}

      {activeTab === "manual" && (
        <>
          {participants.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-stone-500">No students have registered for this event yet.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-stone-100 bg-cream-100">
                <div className="flex gap-2">
                  <button type="button" onClick={markAllPresent} className="chip chip-success">
                    Mark all present
                  </button>
                  <button type="button" onClick={markAllAbsent} className="chip chip-muted">
                    Mark all absent
                  </button>
                </div>
                <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? "Saving..." : "Save attendance"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Roll No.</th>
                      <th>Email</th>
                      <th className="text-center">Present</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={p.user_id} className={p.present ? "row-present" : ""}>
                        <td className="text-stone-400">{idx + 1}</td>
                        <td className="font-medium">{p.user_name}</td>
                        <td>{p.roll_number || "—"}</td>
                        <td>{p.user_email}</td>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            checked={p.present}
                            onChange={() => togglePresent(p.user_id)}
                            className="w-5 h-5 accent-brand-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
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
