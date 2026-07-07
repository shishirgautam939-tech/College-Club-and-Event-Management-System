import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getAllUsers, getDepartments, deleteUser } from "../../api/users";
import { TableAvatar, ActionButton, EditIcon, TrashIcon, TableEmpty } from "../../components/TableBits";

const DEPT_COLORS = [
  "bg-blue-50 text-blue-700 border-blue-200",
  "bg-green-50 text-green-700 border-green-200",
  "bg-yellow-50 text-yellow-700 border-yellow-200",
  "bg-purple-50 text-purple-700 border-purple-200",
  "bg-pink-50 text-pink-700 border-pink-200",
];

const DEPT_PILLS = ["pill-info", "pill-success", "pill-warn", "pill-violet", "pill-accent"];

const DEPT_ICONS = ["📡", "🏗️", "⚡", "🔬", "📐"];

const matchesDepartment = (userDepartment, deptId) =>
  userDepartment === deptId || userDepartment?.id === deptId;

const Faculty = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const selectedDept = searchParams.get("dept");
  const deptId = Number(selectedDept);
  const validDeptId = Number.isInteger(deptId) && deptId > 0 ? deptId : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          getAllUsers(),
          getDepartments(),
        ]);
        setUsers(usersRes.data.filter((u) => u.user_type === "Faculty"));
        setDepartments(deptsRes.data);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete faculty "${userName}"? This action cannot be undone.`)) return;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `Faculty "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete." });
    }
  };

  const deptInfo = departments.find((d) => d.id === validDeptId);
  const filteredFaculty = useMemo(
    () => users.filter((u) => matchesDepartment(u.department, validDeptId)),
    [users, validDeptId]
  );
  const searchedFaculty = useMemo(() => {
    if (!search.trim()) return filteredFaculty;
    const q = search.toLowerCase();
    return filteredFaculty.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [filteredFaculty, search]);

  const deptIndex = departments.findIndex((d) => d.id === validDeptId);
  const deptTone = DEPT_PILLS[(deptIndex >= 0 ? deptIndex : 0) % DEPT_PILLS.length];

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

  // No department selected — show department cards
  if (!selectedDept) {
    const totalFaculty = users.length;
    return (
      <div className="space-y-6">
        <div className="page-header">
          <span className="page-header-eyebrow">Faculty</span>
          <h1 className="page-header-title">Browse by department</h1>
          <p className="page-header-sub">
            Choose a department to see its faculty members. {totalFaculty} faculty on campus.
          </p>
          <div className="page-header-actions">
            <Link to="/admin/users/create" className="btn-primary">
              <span aria-hidden="true">+</span> Add New Faculty
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dept, idx) => {
            const count = users.filter((u) => matchesDepartment(u.department, dept.id)).length;
            const shortName = dept.department_name.replace("Department of ", "");
            return (
              <Link
                key={dept.id}
                to={`/admin/faculty?dept=${dept.id}`}
                className={`rounded-2xl border p-6 flex flex-col items-center gap-2 hover:-translate-y-1 transition shadow-sm ${DEPT_COLORS[idx % DEPT_COLORS.length]}`}
              >
                <span className="text-4xl">{DEPT_ICONS[idx % DEPT_ICONS.length]}</span>
                <p className="text-base font-bold text-center">{shortName}</p>
                <p className="text-2xl font-bold mt-1">{count}</p>
                <span className={`pill ${DEPT_PILLS[idx % DEPT_PILLS.length]}`} style={{ marginTop: "0.4rem" }}>
                  Faculty
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Department selected — show faculty table
  if (!validDeptId) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <span className="page-header-eyebrow">Faculty</span>
          <h1 className="page-header-title">Department not found</h1>
          <p className="page-header-sub">The selected department is invalid. Please go back and choose a valid department.</p>
          <div className="page-header-actions">
            <button onClick={() => navigate("/admin/faculty")} className="btn-primary">
              ← Back to Departments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <span className="page-header-eyebrow">Faculty · {deptInfo?.department_name || "Department"}</span>
        <h1 className="page-header-title">{deptInfo?.department_name || "Department"} — Faculty</h1>
        <p className="page-header-sub">
          {filteredFaculty.length} members · {searchedFaculty.length} shown
        </p>
        <div className="page-header-actions">
          <Link to="/admin/users/create" className="btn-primary">
            <span aria-hidden="true">+</span> Add New Faculty
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
              onClick={() => navigate("/admin/faculty")}
              className="btn-ghost"
              style={{ marginRight: "0.5rem" }}
            >
              ← Departments
            </button>
            <span style={{ color: "#a8a29e" }}>·</span>
            <span className={`pill ${deptTone}`} style={{ marginLeft: "0.4rem" }}>
              {deptInfo?.department_name || "Department"}
            </span>
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
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span className="table-toolbar-meta">{searchedFaculty.length} of {filteredFaculty.length}</span>
          </div>
        </div>

        {searchedFaculty.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Faculty member</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedFaculty.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-name">
                        <TableAvatar name={user.full_name} tone="violet" />
                        <div className="cell-name-text">
                          <span className="cell-name-primary">{user.full_name}</span>
                          <span className="cell-name-secondary">Faculty</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#57534e" }}>{user.email}</td>
                    <td>
                      <span className={`pill ${deptTone}`}>{deptInfo?.department_name || "—"}</span>
                    </td>
                    <td>
                      <span className={`pill ${user.is_active ? "pill-success" : "pill-muted"}`}>
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="cell-actions">
                        <ActionButton
                          title="Edit faculty"
                          onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                        >
                          <EditIcon />
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          title="Delete faculty"
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
            icon="👨‍🏫"
            title={search ? "No matches" : "No faculty in this department"}
            sub={search ? "Try a different search term." : "Add the first faculty member."}
          />
        )}
      </div>
    </div>
  );
};

export default Faculty;
