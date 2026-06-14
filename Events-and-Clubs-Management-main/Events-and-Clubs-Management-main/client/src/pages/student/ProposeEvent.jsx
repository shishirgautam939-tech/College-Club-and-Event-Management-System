import { useState, useEffect } from "react";
import { getMyClubs, proposeEvent } from "../../api/events";

const ProposeEvent = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    club: "",
    title: "",
    description: "",
    venue: "",
    max_participants: "",
    event_date: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getMyClubs();
      setClubs(res.data);
    } catch (err) {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      await proposeEvent({
        club: parseInt(form.club),
        title: form.title,
        description: form.description,
        venue: form.venue,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        event_date: form.event_date,
      });
      setSuccess("Event proposed successfully! It is now pending review.");
      setForm({ club: "", title: "", description: "", venue: "", max_participants: "", event_date: "" });
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to propose event.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-8">
      {/* ── Propose Event Form ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Propose an Event</h2>

        {clubs.length === 0 ? (
          <p className="text-gray-500">
            You are not an Event Manager in any club. Only Event Managers can propose events.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded text-sm">{success}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Club</label>
              <select
                name="club"
                value={form.club}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a club</option>
                {clubs.map((c) => (
                  <option key={c.club_id} value={c.club_id}>
                    {c.club_name} ({c.position})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Annual Tech Fest 2026"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Brief description of the event..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
              <input
                type="text"
                name="venue"
                value={form.venue}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Main Auditorium, Block A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Participants{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="number"
                name="max_participants"
                value={form.max_participants}
                onChange={handleChange}
                min="1"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Leave blank for unlimited"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
              <input
                type="datetime-local"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Submitting..." : "Propose Event"}
            </button>
          </form>
        )}
      </div>

    </div>
  );
};

export default ProposeEvent;
