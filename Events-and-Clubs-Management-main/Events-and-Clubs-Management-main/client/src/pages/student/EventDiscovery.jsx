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
      setActionMsg({ type: "success", text: "You're registered. See you there!" });
      fetchEvents();
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
      setActionMsg({ type: "success", text: "Registration cancelled." });
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

  if (loading) return <p className="text-stone-500">Loading events...</p>;

  const filtered = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.club_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.venue || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page-shell">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Discover Events</h1>
          <p className="page-subtitle">
            Find workshops, club activities, and campus gatherings worth showing up for.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name, club, or venue..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field sm:w-72"
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          {actionMsg.text}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-stone-500">
            {search ? "No events match your search." : "Nothing scheduled right now. Check back soon."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev) => (
            <article key={ev.id} className="event-card">
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-lg font-semibold text-stone-800 leading-snug">{ev.title}</h3>
                {ev.is_registered && <span className="badge badge-success shrink-0">Joined</span>}
              </div>

              <p className="text-sm text-brand-700 font-medium mb-2">{ev.club_name}</p>

              {ev.description && (
                <p className="text-sm text-stone-600 mb-4 line-clamp-3">{ev.description}</p>
              )}

              <div className="space-y-1 text-sm text-stone-500 mb-5 flex-1">
                <p>{formatDateTime(ev.event_date)}</p>
                {ev.venue && <p>{ev.venue}</p>}
                <p>
                  {ev.registration_count}
                  {ev.max_participants ? ` / ${ev.max_participants}` : ""} registered
                  {ev.spots_left === 0 && <span className="text-red-600 ml-1">· Full</span>}
                </p>
              </div>

              {user?.role === "Student" && (
                <div className="pt-4 border-t border-stone-100">
                  {ev.is_registered ? (
                    <button
                      type="button"
                      onClick={() => handleUnregister(ev.id)}
                      disabled={actionInProgress === ev.id}
                      className="btn-secondary w-full text-red-700 hover:bg-red-50"
                    >
                      {actionInProgress === ev.id ? "Processing..." : "Cancel registration"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRegister(ev.id)}
                      disabled={actionInProgress === ev.id || ev.spots_left === 0}
                      className="btn-primary w-full"
                    >
                      {actionInProgress === ev.id
                        ? "Processing..."
                        : ev.spots_left === 0
                          ? "Event full"
                          : "Register"}
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventDiscovery;
