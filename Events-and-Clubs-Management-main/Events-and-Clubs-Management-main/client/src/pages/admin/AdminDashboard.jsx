import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/users";
import { formatDateTime } from "../../utils/formatDate";

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("");

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch {
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, [now]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>;
  }

  const cards = [
    {
      label: "Students",
      value: stats.total_students,
      icon: "🎓",
      tone: "stat-brand",
      iconTone: "brand",
      link: "/admin/students",
      hint: "Enrolled this term",
    },
    {
      label: "Faculty",
      value: stats.total_faculty,
      icon: "👨‍🏫",
      tone: "stat-violet",
      iconTone: "violet",
      link: "/admin/faculty",
      hint: "Across departments",
    },
    {
      label: "Clubs",
      value: stats.total_clubs,
      icon: "🏛️",
      tone: "stat-accent",
      iconTone: "accent",
      link: "/admin/clubs",
      hint: "Active organizations",
    },
    {
      label: "Pending Events",
      value: stats.pending_events,
      icon: "⏳",
      tone: "stat-amber",
      iconTone: "amber",
      link: "/admin/events?tab=pending",
      hint: "Awaiting your review",
    },
    {
      label: "Approved Events",
      value: stats.approved_events,
      icon: "✅",
      tone: "stat-sky",
      iconTone: "sky",
      link: "/admin/events?tab=approved",
      hint: "Live & upcoming",
    },
  ];

  const totalEngagement =
    (stats.total_students || 0) +
    (stats.total_faculty || 0) +
    (stats.total_clubs || 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="page-header">
        <span className="page-header-eyebrow">Admin Overview</span>
        <h1 className="page-header-title">{greeting}, Administrator</h1>
        <p className="page-header-sub">
          {dateLabel} — {totalEngagement} active members across students, faculty, and clubs.
        </p>
        <div className="page-header-actions">
          <span className="page-header-stat">
            <span>📚</span>
            <span><strong>{stats.total_students}</strong> students</span>
          </span>
          <span className="page-header-stat">
            <span>📅</span>
            <span><strong>{stats.approved_events}</strong> approved events</span>
          </span>
          <span className="page-header-stat">
            <span>⏳</span>
            <span><strong>{stats.pending_events}</strong> to review</span>
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`dashboard-stat dashboard-stat-${card.tone.replace("stat-", "")}`}
          >
            <div className={`dashboard-stat-icon ${card.iconTone}`}>
              <span>{card.icon}</span>
            </div>
            <p className="dashboard-stat-label">{card.label}</p>
            <p className="dashboard-stat-value">{card.value}</p>
            <p className="dashboard-stat-trend">
              <span>↗</span>
              <span>{card.hint}</span>
            </p>
          </Link>
        ))}
      </div>

      {/* Two-column lower section: quick actions + activity */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="dashboard-panel lg:col-span-3">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">
                <span>⚡</span> Quick actions
              </h2>
              <p className="dashboard-panel-sub">
                Common admin tasks at your fingertips.
              </p>
            </div>
          </div>
          <div className="dashboard-panel-body grid gap-3 p-4 sm:grid-cols-2">
            <Link to="/admin/users/create" className="dashboard-quick-action">
              <span className="dashboard-quick-action-icon">➕</span>
              <span className="dashboard-quick-action-text">
                <span className="dashboard-quick-action-title">Add a user</span>
                <span className="dashboard-quick-action-sub">Create student, faculty, or staff</span>
              </span>
              <span className="dashboard-quick-action-arrow">→</span>
            </Link>
            <Link to="/admin/clubs/create" className="dashboard-quick-action">
              <span className="dashboard-quick-action-icon accent">🏛️</span>
              <span className="dashboard-quick-action-text">
                <span className="dashboard-quick-action-title">Create a club</span>
                <span className="dashboard-quick-action-sub">Spin up a new organization</span>
              </span>
              <span className="dashboard-quick-action-arrow">→</span>
            </Link>
            <Link to="/admin/events?tab=pending" className="dashboard-quick-action">
              <span className="dashboard-quick-action-icon violet">📝</span>
              <span className="dashboard-quick-action-text">
                <span className="dashboard-quick-action-title">Review proposals</span>
                <span className="dashboard-quick-action-sub">
                  {stats.pending_events} event{stats.pending_events === 1 ? "" : "s"} waiting
                </span>
              </span>
              <span className="dashboard-quick-action-arrow">→</span>
            </Link>
            <Link to="/admin/events?tab=approved" className="dashboard-quick-action">
              <span className="dashboard-quick-action-icon sky">📅</span>
              <span className="dashboard-quick-action-text">
                <span className="dashboard-quick-action-title">View approved events</span>
                <span className="dashboard-quick-action-sub">Manage attendance & certificates</span>
              </span>
              <span className="dashboard-quick-action-arrow">→</span>
            </Link>
          </div>
        </div>

        <div className="dashboard-panel lg:col-span-2">
          <div className="dashboard-panel-header">
            <div>
              <h2 className="dashboard-panel-title">
                <span>🕒</span> Today
              </h2>
              <p className="dashboard-panel-sub">Snapshot of your campus right now.</p>
            </div>
          </div>
          <div className="dashboard-panel-body">
            <div className="activity-item">
              <span className="activity-dot brand">🎓</span>
              <div className="activity-text">
                <span className="activity-text-title">{stats.total_students} active students</span>
                <span className="activity-text-meta">Enrolled across all branches</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-dot accent">🏛️</span>
              <div className="activity-text">
                <span className="activity-text-title">{stats.total_clubs} clubs running</span>
                <span className="activity-text-meta">Drives events on campus</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-dot violet">👨‍🏫</span>
              <div className="activity-text">
                <span className="activity-text-title">{stats.total_faculty} faculty coordinators</span>
                <span className="activity-text-meta">Mentoring & supervising clubs</span>
              </div>
            </div>
            <div className="activity-item">
              <span className="activity-dot amber">⏳</span>
              <div className="activity-text">
                <span className="activity-text-title">{stats.pending_events} pending proposals</span>
                <span className="activity-text-meta">Last refreshed just now</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
