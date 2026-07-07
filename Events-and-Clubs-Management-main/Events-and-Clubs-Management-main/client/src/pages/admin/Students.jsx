import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getAllUsers, deleteUser } from "../../api/users";
import { TableAvatar, ActionButton, EditIcon, TrashIcon, TableEmpty } from "../../components/TableBits";

const BRANCHES = [
  { code: "BCT", label: "BCT - Computer", tone: "pill-info", cardTone: "bg-blue-50 text-blue-700 border-blue-200", icon: "💻" },
  { code: "BCE", label: "BCE - Civil", tone: "pill-success", cardTone: "bg-green-50 text-green-700 border-green-200", icon: "🏗️" },
  { code: "BEE", label: "BEE - Electrical", tone: "pill-warn", cardTone: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "⚡" },
  { code: "BEI", label: "BEI - Electronics", tone: "pill-violet", cardTone: "bg-purple-50 text-purple-700 border-purple-200", icon: "📡" },
];

const Students = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const selectedBranch = searchParams.get("branch");

  const branchInfo = BRANCHES.find((b) => b.code === selectedBranch);
  const filteredStudents = useMemo(
    () =>
      selectedBranch
        ? users.filter((u) => u.branch === selectedBranch)
        : users,
    [users, selectedBranch]
  );
  const searchedStudents = useMemo(() => {
    if (!search.trim()) return filteredStudents;
    const q = search.toLowerCase();
    return filteredStudents.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.roll_number || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [filteredStudents, search]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUsers(res.data.filter((u) => u.user_type === "Student"));
      } catch {
        setError("Failed to load students.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete student "${userName}"? This action cannot be undone.`)) return;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `Student "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete student." });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 p-4 rounded-md text-red-600 text-center">{error}</div>;
  }

  if (selectedBranch && !branchInfo) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <span className="page-header-eyebrow">Students</span>
          <h1 className="page-header-title">Branch not found</h1>
          <p className="page-header-sub">The selected branch is invalid. Please choose a branch from the list.</p>
          <div className="page-header-actions">
            <button onClick={() => navigate("/admin/students")} className="btn-primary">
              ← Back to branches
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no branch selected, show branch cards
  if (!selectedBranch) {
    const totalStudents = users.length;
    return (
      <div className="space-y-6">
        <div className="page-header">
          <span className="page-header-eyebrow">Students</span>
          <h1 className="page-header-title">Browse by branch</h1>
          <p className="page-header-sub">
            Pick a branch to view enrolled students. {totalStudents} students on campus.
          </p>
          <div className="page-header-actions">
            <Link to="/admin/users/create" className="btn-primary">
              <span aria-hidden="true">+</span> Add New Student
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRANCHES.map((b) => {
            const count = users.filter((u) => u.branch === b.code).length;
            return (
              <Link
                key={b.code}
                to={`/admin/students?branch=${b.code}`}
                className={`rounded-2xl border p-6 flex flex-col items-center gap-2 hover:-translate-y-1 transition shadow-sm ${b.cardTone}`}
              >
                <span className="text-4xl">{b.icon}</span>
                <p className="text-lg font-bold">{b.code}</p>
                <p className="text-sm opacity-80">{b.label.split(" - ")[1]}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
                <span className="pill pill-brand" style={{ marginTop: "0.4rem" }}>Students</span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Branch selected — show filtered student table
  return (
    <div className="space-y-6">
      <div className="page-header">
        <span className="page-header-eyebrow">Students · {selectedBranch}</span>
        <h1 className="page-header-title">{branchInfo?.label || selectedBranch} students</h1>
        <p className="page-header-sub">
          {filteredStudents.length} enrolled · {searchedStudents.length} shown
        </p>
        <div className="page-header-actions">
          <Link to="/admin/users/create" className="btn-primary">
            <span aria-hidden="true">+</span> Add New Student
          </Link>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          <span aria-hidden="true">{actionMsg.type === "success" ? "✅" : "⚠️"}</span>
          <span>{actionMsg.text}</span>
        </div>
      )}

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="table-toolbar-title">
            <button
              onClick={() => navigate("/admin/students")}
              className="btn-ghost"
              style={{ marginRight: "0.5rem" }}
            >
              ← Branches
            </button>
            <span style={{ color: "#a8a29e" }}>·</span>
            <span className="pill pill-info" style={{ marginLeft: "0.4rem" }}>{selectedBranch}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div className="auth-field-input" style={{ width: "16rem", maxWidth: "100%" }}>
              <span className="auth-field-icon" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search name, roll, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="table-toolbar-meta">{searchedStudents.length} of {filteredStudents.length}</span>
          </div>
        </div>

        {searchedStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll number</th>
                  <th>Email</th>
                  <th>Branch</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedStudents.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-name">
                        <TableAvatar name={user.full_name} tone="brand" />
                        <div className="cell-name-text">
                          <span className="cell-name-primary">{user.full_name}</span>
                          <span className="cell-name-secondary">Student</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="cell-mono">{user.roll_number || "—"}</span>
                    </td>
                    <td style={{ color: "#57534e" }}>{user.email}</td>
                    <td>
                      <span className={`pill ${branchInfo?.tone || "pill-brand"}`}>
                        {user.branch || "—"}
                      </span>
                    </td>
                    <td>
                      <span className={`pill ${user.is_active ? "pill-success" : "pill-muted"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <ActionButton
                          title="Edit student"
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        >
                          <EditIcon />
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          title="Delete student"
                          onClick={() => handleDelete(user.id, user.full_name)}
                        >
                          <TrashIcon />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TableEmpty
            icon="🎓"
            title={search ? "No matches" : "No students in this branch"}
            sub={search ? "Try a different search term." : "Add the first student to get started."}
          />
        )}
      </div>
    </div>
  );
};

export default Students;
