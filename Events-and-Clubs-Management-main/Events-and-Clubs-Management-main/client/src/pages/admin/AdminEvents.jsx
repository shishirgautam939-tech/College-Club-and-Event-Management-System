import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getFacultyProposedEvents,
  reviewEvent,
  getAllEvents,
  completeEvent,
} from "../../api/events";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { TableAvatar, ActionButton, CheckIcon, XIcon, EyeIcon, AttendanceIcon, TableEmpty } from "../../components/TableBits";

const STATUS_PILL = {
  Proposed: "pill-warn",
  Approved: "pill-info",
  Rejected: "pill-danger",
  Completed: "pill-success",
};

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
  const [search, setSearch] = useState("");

  const switchTab = (t) => {
    setTab(t);
    setSearchParams({ tab: t });
    setSearch("");
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

  const filterEvents = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.club_name || "").toLowerCase().includes(q) ||
        (e.created_by_name || "").toLowerCase().includes(q) ||
        (e.venue || "").toLowerCase().includes(q)
    );
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <span className="page-header-eyebrow">Events</span>
        <h1 className="page-header-title">Event management</h1>
        <p className="page-header-sub">
          {pendingEvents.length} pending · {approvedEvents.length} approved · review proposals and run events end to end.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1 flex-wrap">
        <button
          onClick={() => switchTab("pending")}
          className={`tab-btn ${tab === "pending" ? "tab-btn-active" : ""}`}
        >
          <span aria-hidden="true">⏳</span> Pending review
          <span
            className="pill"
            style={{
              background: tab === "pending" ? "rgba(255,255,255,0.25)" : "var(--color-cream-100)",
              color: tab === "pending" ? "white" : "var(--color-ink-700)",
              borderColor: "transparent",
              padding: "0.1rem 0.5rem",
            }}
          >
            {pendingEvents.length}
          </span>
        </button>
        <button
          onClick={() => switchTab("approved")}
          className={`tab-btn ${tab === "approved" ? "tab-btn-active" : ""}`}
        >
          <span aria-hidden="true">✅</span> Approved
        </button>
        <button
          onClick={() => switchTab("all")}
          className={`tab-btn ${tab === "all" ? "tab-btn-active" : ""}`}
        >
          <span aria-hidden="true">📅</span> All events
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span aria-hidden="true">⚠️</span><span>{error}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="alert alert-success">
          <span aria-hidden="true">✅</span><span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="alert alert-error">
          <span aria-hidden="true">⚠️</span><span>{actionError}</span>
        </div>
      )}

      {/* ─── Pending Review Tab ─── */}
      {tab === "pending" && (
        <div className="space-y-4">
          {pendingEvents.length === 0 ? (
            <div className="table-wrap">
              <TableEmpty icon="📭" title="No pending proposals" sub="You're all caught up — every event proposal has been reviewed." />
            </div>
          ) : (
            pendingEvents.map((ev) => (
              <div
                key={ev.id}
                className="card"
                style={{ padding: "1.25rem 1.5rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", minWidth: 0, flex: 1 }}>
                    <TableAvatar name={ev.title} tone="amber" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 600, color: "#1c1917" }}>
                          {ev.title}
                        </h3>
                        <span className="pill pill-warn">{ev.status}</span>
                      </div>
                      <p style={{ fontSize: "0.85rem", color: "#57534e", marginTop: "0.25rem" }}>
                        <strong>Club:</strong> {ev.club_name} &nbsp;·&nbsp;
                        <strong>Proposed by:</strong> {ev.created_by_name} &nbsp;·&nbsp;
                        <strong>Date:</strong> {formatDate(ev.event_date)}
                      </p>
                      {ev.description && (
                        <p style={{ fontSize: "0.875rem", color: "#44403c", marginTop: "0.6rem", lineHeight: 1.5 }}>
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {reviewingId === ev.id ? (
                  <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #f5f5f4" }}>
                    <div className="auth-field">
                      <label className="auth-field-label">
                        <span>Remarks (optional)</span>
                      </label>
                      <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={2}
                        className="input-field"
                        placeholder="Add remarks for the faculty…"
                      />
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem" }}>
                      <button
                        onClick={() => handleReview(ev.id, "Approved")}
                        className="btn-primary"
                        style={{ background: "linear-gradient(135deg, #047857, #065f46)" }}
                      >
                        <CheckIcon /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(ev.id, "Rejected")}
                        className="btn-primary"
                        style={{ background: "linear-gradient(135deg, #b91c1c, #991b1b)" }}
                      >
                        <XIcon /> Reject
                      </button>
                      <button
                        onClick={() => {
                          setReviewingId(null);
                          setRemarks("");
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => setReviewingId(ev.id)}
                      className="btn-primary"
                    >
                      <EyeIcon /> Review
                    </button>
                    <button
                      onClick={() => handleReview(ev.id, "Approved")}
                      className="btn-secondary"
                      style={{ color: "#047857" }}
                    >
                      <CheckIcon /> Quick approve
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Approved Events Tab ─── */}
      {tab === "approved" && (
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              <span>Approved & upcoming</span>
              <span className="table-toolbar-meta">· {filterEvents(approvedEvents).length} of {approvedEvents.length}</span>
            </div>
            <div className="auth-field-input" style={{ width: "16rem", maxWidth: "100%" }}>
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search title, club, venue…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          {approvedEvents.length === 0 ? (
            <TableEmpty icon="📅" title="No approved events" sub="Approve a pending proposal to see it here." />
          ) : filterEvents(approvedEvents).length === 0 ? (
            <TableEmpty icon="🔍" title="No matches" sub="Try a different search term." />
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Club</th>
                    <th>Date</th>
                    <th>Venue</th>
                    <th>Created by</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterEvents(approvedEvents).map((ev) => (
                    <tr key={ev.id}>
                      <td>
                        <div className="cell-name">
                          <TableAvatar name={ev.title} tone="sky" />
                          <div className="cell-name-text">
                            <span className="cell-name-primary">{ev.title}</span>
                            <span className="cell-name-secondary">Approved</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: "#57534e" }}>{ev.club_name}</td>
                      <td style={{ color: "#57534e", fontSize: "0.875rem" }}>{formatDateTime(ev.event_date)}</td>
                      <td style={{ color: "#57534e" }}>{ev.venue || "—"}</td>
                      <td style={{ color: "#57534e" }}>{ev.created_by_name}</td>
                      <td>
                        <div className="cell-actions">
                          <button
                            onClick={() => handleComplete(ev.id)}
                            className="chip chip-success"
                            style={{ cursor: "pointer" }}
                          >
                            <CheckIcon /> Complete
                          </button>
                          <button
                            onClick={() => navigate(`/admin/events/${ev.id}/attendance`)}
                            className="chip"
                            style={{
                              background: "var(--color-brand-50)",
                              color: "var(--color-brand-800)",
                              border: "1px solid var(--color-brand-100)",
                              cursor: "pointer",
                            }}
                          >
                            <AttendanceIcon /> Attendance
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
        <div className="table-wrap">
          <div className="table-toolbar">
            <div className="table-toolbar-title">
              <span>All events</span>
              <span className="table-toolbar-meta">· {filterEvents(allEvents).length} of {allEvents.length}</span>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-field"
                style={{ width: "10rem" }}
              >
                <option value="">All statuses</option>
                <option value="Proposed">Proposed</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Completed">Completed</option>
              </select>
              <div className="auth-field-input" style={{ width: "16rem", maxWidth: "100%" }}>
                <span className="auth-field-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search title, club, venue…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {allEvents.length === 0 ? (
            <TableEmpty icon="📅" title="No events found" sub="Try a different filter." />
          ) : filterEvents(allEvents).length === 0 ? (
            <TableEmpty icon="🔍" title="No matches" sub="Try a different search or filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Club</th>
                    <th>Date</th>
                    <th>Created by</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filterEvents(allEvents).map((ev) => {
                    const tone =
                      ev.status === "Approved" ? "sky"
                      : ev.status === "Completed" ? "brand"
                      : ev.status === "Rejected" ? "muted"
                      : "amber";
                    return (
                      <tr key={ev.id}>
                        <td>
                          <div className="cell-name">
                            <TableAvatar name={ev.title} tone={tone} />
                            <div className="cell-name-text">
                              <span className="cell-name-primary">{ev.title}</span>
                              <span className="cell-name-secondary">{ev.venue || "Venue TBA"}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#57534e" }}>{ev.club_name}</td>
                        <td style={{ color: "#57534e", fontSize: "0.875rem" }}>{formatDateTime(ev.event_date)}</td>
                        <td style={{ color: "#57534e" }}>{ev.created_by_name}</td>
                        <td>
                          <span className={`pill ${STATUS_PILL[ev.status] || "pill-muted"}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td>
                          <div className="cell-actions">
                            {ev.status === "Approved" && (
                              <>
                                <button
                                  onClick={() => handleComplete(ev.id)}
                                  className="chip chip-success"
                                  style={{ cursor: "pointer" }}
                                >
                                  <CheckIcon /> Complete
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/admin/events/${ev.id}/attendance`)
                                  }
                                  className="chip"
                                  style={{
                                    background: "var(--color-brand-50)",
                                    color: "var(--color-brand-800)",
                                    border: "1px solid var(--color-brand-100)",
                                    cursor: "pointer",
                                  }}
                                >
                                  <AttendanceIcon /> Attendance
                                </button>
                              </>
                            )}
                            {ev.status === "Completed" && (
                              <button
                                onClick={() =>
                                  navigate(`/admin/events/${ev.id}/attendance`)
                                }
                                className="chip"
                                style={{
                                  background: "var(--color-brand-50)",
                                  color: "var(--color-brand-800)",
                                  border: "1px solid var(--color-brand-100)",
                                  cursor: "pointer",
                                }}
                              >
                                <EyeIcon /> View attendance
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
