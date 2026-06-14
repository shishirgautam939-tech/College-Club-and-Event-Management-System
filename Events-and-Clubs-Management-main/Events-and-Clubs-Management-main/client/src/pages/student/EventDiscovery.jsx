import { useState, useEffect } from "react";
import { getApprovedEvents } from "../../api/events";
import { registerForEvent, unregisterFromEvent } from "../../api/participation";
import { formatDateTime } from "../../utils/formatDate";
import useAuth from "../../hooks/useAuth";

const EventDiscovery = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getApprovedEvents();
      setEvents(res.data);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await registerForEvent(eventId);
      setActionMsg({ type: "success", text: "Registered successfully!" });
      fetchEvents(); // refresh to update counts
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Registration failed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnregister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await unregisterFromEvent(eventId);
      setActionMsg({ type: "success", text: "Unregistered successfully." });
      fetchEvents();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Unregister failed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) return <p className="text-gray-500">Loading events...</p>;

  const filtered = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.club_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.venue || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Discover Events</h1>
        <input
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

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

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-gray-500">
            {search
              ? "No events match your search."
              : "No upcoming events at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition flex flex-col"
            >
              {/* Card Header */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 leading-snug">
                    {ev.title}
                  </h3>
                  {ev.is_registered && (
                    <span className="shrink-0 ml-2 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                      Registered
                    </span>
                  )}
                </div>

                <p className="text-sm text-indigo-600 font-medium mb-2">
                  {ev.club_name}
                </p>

                {ev.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {ev.description}
                  </p>
                )}

                <div className="space-y-1 text-sm text-gray-500">
                  <p>
                    <span className="font-medium text-gray-700">Date:</span>{" "}
                    {formatDateTime(ev.event_date)}
                  </p>
                  {ev.venue && (
                    <p>
                      <span className="font-medium text-gray-700">Venue:</span>{" "}
                      {ev.venue}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-gray-700">Organized by:</span>{" "}
                    {ev.created_by_name}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Participants:</span>{" "}
                    {ev.registration_count}
                    {ev.max_participants
                      ? ` / ${ev.max_participants}`
                      : ""}
                    {ev.spots_left !== null && ev.spots_left <= 5 && ev.spots_left > 0 && (
                      <span className="text-amber-600 font-medium ml-1">
                        ({ev.spots_left} spot{ev.spots_left !== 1 && "s"} left)
                      </span>
                    )}
                    {ev.spots_left === 0 && (
                      <span className="text-red-600 font-medium ml-1">(Full)</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              {user?.role === "Student" && (
              <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                {ev.is_registered ? (
                  <button
                    onClick={() => handleUnregister(ev.id)}
                    disabled={actionInProgress === ev.id}
                    className="w-full px-4 py-2 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                  >
                    {actionInProgress === ev.id ? "Processing..." : "Unregister"}
                  </button>
                ) : (
                  <button
                    onClick={() => handleRegister(ev.id)}
                    disabled={actionInProgress === ev.id || ev.spots_left === 0}
                    className="w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
                  >
                    {actionInProgress === ev.id
                      ? "Processing..."
                      : ev.spots_left === 0
                      ? "Event Full"
                      : "Register"}
                  </button>
                )}
              </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventDiscovery;
