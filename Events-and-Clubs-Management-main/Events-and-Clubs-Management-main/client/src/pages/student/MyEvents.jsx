import { useState, useEffect } from "react";
import { getMyRegistrations, unregisterFromEvent } from "../../api/participation";
import { formatDateTime } from "../../utils/formatDate";

const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);

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

  const upcoming = registrations.filter(
    (r) => r.event_status === "Approved"
  );
  const completed = registrations.filter(
    (r) => r.event_status === "Completed"
  );

  if (loading) return <p className="text-gray-500">Loading...</p>;

  const attendanceBadge = (status) => {
    if (status === "Present")
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          Present
        </span>
      );
    if (status === "Absent")
      return (
        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
          Absent
        </span>
      );
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
        Not Marked
      </span>
    );
  };

  const statusBadge = (status) => {
    const colors = {
      Approved: "bg-blue-100 text-blue-700",
      Completed: "bg-green-100 text-green-700",
      Rejected: "bg-red-100 text-red-700",
    };
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          colors[status] || "bg-gray-100 text-gray-600"
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">My Events</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
      )}
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

      {registrations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            You haven&apos;t registered for any events yet.
          </p>
        </div>
      ) : (
        <>
          {/* Upcoming Events */}
          {upcoming.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Upcoming Events ({upcoming.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Event</th>
                      <th className="py-2 pr-4 font-medium">Club</th>
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Venue</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcoming.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 pr-4 font-medium text-gray-800">
                          {r.event_title}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{r.club_name}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {formatDateTime(r.event_date)}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {r.venue || "—"}
                        </td>
                        <td className="py-3 pr-4">{statusBadge(r.event_status)}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleUnregister(r.event)}
                            disabled={actionInProgress === r.event}
                            className="px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            {actionInProgress === r.event
                              ? "..."
                              : "Unregister"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Completed Events + Attendance */}
          {completed.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Past Events ({completed.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-gray-500">
                      <th className="py-2 pr-4 font-medium">Event</th>
                      <th className="py-2 pr-4 font-medium">Club</th>
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 pr-4 font-medium">Venue</th>
                      <th className="py-2 pr-4 font-medium">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3 pr-4 font-medium text-gray-800">
                          {r.event_title}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{r.club_name}</td>
                        <td className="py-3 pr-4 text-gray-600">
                          {formatDateTime(r.event_date)}
                        </td>
                        <td className="py-3 pr-4 text-gray-600">
                          {r.venue || "—"}
                        </td>
                        <td className="py-3 pr-4">
                          {attendanceBadge(r.attendance_status)}
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
    </div>
  );
};

export default MyEvents;
