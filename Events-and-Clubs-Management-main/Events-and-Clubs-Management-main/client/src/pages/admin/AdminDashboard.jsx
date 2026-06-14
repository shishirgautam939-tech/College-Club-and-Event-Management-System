import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../api/users";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      link: "/admin/students",
    },
    {
      label: "Faculty",
      value: stats.total_faculty,
      icon: "👨‍🏫",
      color: "bg-purple-50 text-purple-700 border-purple-200",
      link: "/admin/faculty",
    },
    {
      label: "Clubs",
      value: stats.total_clubs,
      icon: "🏛️",
      color: "bg-green-50 text-green-700 border-green-200",
      link: "/admin/clubs",
    },
    {
      label: "Pending Events",
      value: stats.pending_events,
      icon: "⏳",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      link: "/admin/events?tab=pending",
    },
    {
      label: "Approved Events",
      value: stats.approved_events,
      icon: "✅",
      color: "bg-blue-50 text-blue-700 border-blue-200",
      link: "/admin/events?tab=approved",
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.link}
            className={`rounded-lg border p-5 flex items-center gap-4 hover:shadow-md transition ${card.color}`}
          >
            <span className="text-3xl">{card.icon}</span>
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-sm font-medium opacity-80">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
