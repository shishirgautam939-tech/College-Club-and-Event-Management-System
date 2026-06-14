import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEventAttendance, markAttendance } from "../../api/participation";

const EventAttendance = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
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
      // Initialize local state with present value (default to false if null)
      setParticipants(
        res.data.participants.map((p) => ({
          ...p,
          present: p.present ?? false,
        }))
      );
    } catch (err) {
      setError(
        err.response?.data?.detail || "Failed to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  };

  const togglePresent = (userId) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.user_id === userId ? { ...p, present: !p.present } : p
      )
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
      fetchAttendance(); // refresh
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to save attendance.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading attendance...</p>;

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
    );
  }

  const presentCount = participants.filter((p) => p.present).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-flex items-center gap-1 cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Attendance: {eventInfo?.event_title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Status:{" "}
            <span className="font-medium">{eventInfo?.event_status}</span>
            &nbsp;·&nbsp;
            {presentCount} / {participants.length} present
          </p>
        </div>
      </div>

      {actionMsg.text && (
        <div
          className={`p-3 rounded text-sm ${
            actionMsg.type === "success"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {participants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            No students have registered for this event.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
            <div className="flex gap-2">
              <button
                onClick={markAllPresent}
                className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition cursor-pointer"
              >
                Mark All Present
              </button>
              <button
                onClick={markAllAbsent}
                className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition cursor-pointer"
              >
                Mark All Absent
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="px-6 py-3 font-medium w-12">#</th>
                  <th className="py-3 pr-4 font-medium">Student Name</th>
                  <th className="py-3 pr-4 font-medium">Roll Number</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-6 font-medium text-center">
                    Present
                  </th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p, idx) => (
                  <tr
                    key={p.user_id}
                    className={`border-b border-gray-100 hover:bg-gray-50 ${
                      p.present ? "bg-green-50/40" : ""
                    }`}
                  >
                    <td className="px-6 py-3 text-gray-400">{idx + 1}</td>
                    <td className="py-3 pr-4 font-medium text-gray-800">
                      {p.user_name}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {p.roll_number || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{p.user_email}</td>
                    <td className="py-3 pr-6 text-center">
                      <input
                        type="checkbox"
                        checked={p.present}
                        onChange={() => togglePresent(p.user_id)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventAttendance;
