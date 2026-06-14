import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getFacultyProposedEvents,
  reviewEvent,
  getAllEvents,
  completeEvent,
} from "../../api/events";
import { formatDate, formatDateTime } from "../../utils/formatDate";

const AdminEvents = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";
  const [tab, setTab] = useState(initialTab); // pending | approved | all
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const switchTab = (t) => {
    setTab(t);
    setSearchParams({ tab: t });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tab === "all") fetchAllEvents();
    if (tab === "approved") fetchApprovedEvents();
  }, [tab, statusFilter]);

  const fetchData = async () => {
    try {
      const res = await getFacultyProposedEvents();
      setPendingEvents(res.data);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedEvents = async () => {
    try {
      const res = await getAllEvents("Approved");
      setApprovedEvents(res.data);
    } catch {
      setError("Failed to load approved events.");
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await getAllEvents(statusFilter || undefined);
      setAllEvents(res.data);
    } catch {
      setError("Failed to load events.");
    }
  };

  const handleReview = async (eventId, decision) => {
    setActionError("");
    setActionSuccess("");
    try {
      await reviewEvent(eventId, { decision, remarks });
      setActionSuccess(`Event ${decision.toLowerCase()} successfully.`);
      setReviewingId(null);
      setRemarks("");
      fetchData();
      fetchApprovedEvents();
      if (tab === "all") fetchAllEvents();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  const handleComplete = async (eventId) => {
    setActionError("");
    setActionSuccess("");
    try {
      await completeEvent(eventId);
      setActionSuccess("Event marked as completed.");
      fetchData();
      fetchApprovedEvents();
      fetchAllEvents();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  const statusBadge = (status) => {
    const colors = {
      Proposed: "bg-yellow-100 text-yellow-800",
      Approved: "bg-blue-100 text-blue-700",
      Rejected: "bg-red-100 text-red-700",
      Completed: "bg-green-100 text-green-700",
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

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-gray-200">
        <button
          onClick={() => switchTab("pending")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition cursor-pointer ${
            tab === "pending"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Pending Review ({pendingEvents.length})
        </button>
        <button
          onClick={() => switchTab("approved")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition cursor-pointer ${
            tab === "approved"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Approved Events
        </button>
        <button
          onClick={() => switchTab("all")}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition cursor-pointer ${
            tab === "all"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          All Events
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{error}</div>
      )}
      {actionSuccess && (
        <div className="bg-green-50 text-green-600 p-3 rounded text-sm">{actionSuccess}</div>
      )}
      {actionError && (
        <div className="bg-red-50 text-red-600 p-3 rounded text-sm">{actionError}</div>
      )}

      {/* ─── Pending Review Tab ─── */}
      {tab === "pending" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Proposed Events — Pending Review
          </h2>
          {pendingEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No pending event proposals.</p>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-indigo-200 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {ev.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Club:</span>{" "}
                        {ev.club_name} &nbsp;|&nbsp;
                        <span className="font-medium">Proposed by:</span>{" "}
                        {ev.created_by_name} &nbsp;|&nbsp;
                        <span className="font-medium">Event Date:</span>{" "}
                        {formatDate(ev.event_date)}
                      </p>
                      {ev.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {ev.description}
                        </p>
                      )}
                    </div>
                    {statusBadge(ev.status)}
                  </div>

                  {reviewingId === ev.id ? (
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks (optional)
                        </label>
                        <textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                          placeholder="Add remarks..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReview(ev.id, "Approved")}
                          className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReview(ev.id, "Rejected")}
                          className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setRemarks("");
                          }}
                          className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <button
                        onClick={() => setReviewingId(ev.id)}
                        className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Approved Events Tab ─── */}
      {tab === "approved" && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Approved / Upcoming Events</h2>
          {approvedEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No approved events.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Club</th>
                    <th className="py-2 pr-4 font-medium">Event Date</th>
                    <th className="py-2 pr-4 font-medium">Venue</th>
                    <th className="py-2 pr-4 font-medium">Created By</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedEvents.map((ev) => (
                    <tr key={ev.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-800">{ev.title}</td>
                      <td className="py-3 pr-4 text-gray-600">{ev.club_name}</td>
                      <td className="py-3 pr-4 text-gray-600">{formatDateTime(ev.event_date)}</td>
                      <td className="py-3 pr-4 text-gray-600">{ev.venue || "-"}</td>
                      <td className="py-3 pr-4 text-gray-600">{ev.created_by_name}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleComplete(ev.id)}
                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 cursor-pointer"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => navigate(`/admin/events/${ev.id}/attendance`)}
                            className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 cursor-pointer"
                          >
                            Attendance
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── All Events Tab ─── */}
      {tab === "all" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">All Events</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="Proposed">Proposed</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {allEvents.length === 0 ? (
            <p className="text-gray-500 text-sm">No events found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="py-2 pr-4 font-medium">Title</th>
                    <th className="py-2 pr-4 font-medium">Club</th>
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Created By</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allEvents.map((ev) => (
                    <tr
                      key={ev.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 pr-4 font-medium text-gray-800">
                        {ev.title}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {ev.club_name}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {formatDateTime(ev.event_date)}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {ev.created_by_name}
                      </td>
                      <td className="py-3 pr-4">{statusBadge(ev.status)}</td>
                      <td className="py-3">
                        <div className="flex gap-2">
                          {ev.status === "Approved" && (
                            <>
                              <button
                                onClick={() => handleComplete(ev.id)}
                                className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 cursor-pointer"
                              >
                                Complete
                              </button>
                              <button
                                onClick={() =>
                                  navigate(`/admin/events/${ev.id}/attendance`)
                                }
                                className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 cursor-pointer"
                              >
                                Attendance
                              </button>
                            </>
                          )}
                          {ev.status === "Completed" && (
                            <button
                              onClick={() =>
                                navigate(`/admin/events/${ev.id}/attendance`)
                              }
                              className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 cursor-pointer"
                            >
                              View Attendance
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
