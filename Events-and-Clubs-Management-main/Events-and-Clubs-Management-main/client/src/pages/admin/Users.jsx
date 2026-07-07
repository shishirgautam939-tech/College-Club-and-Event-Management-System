import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAllUsers, deleteUser } from "../../api/users";
import { TableAvatar, ActionButton, EditIcon, TrashIcon, TableEmpty } from "../../components/TableBits";

const ROLE_META = {
  Students: { tone: "brand", pill: "pill-info", label: "Student", icon: "🎓" },
  Faculty:  { tone: "violet", pill: "pill-violet", label: "Faculty", icon: "👨‍🏫" },
  Staff:    { tone: "amber", pill: "pill-warn", label: "Staff", icon: "🛠️" },
  Admins:   { tone: "accent", pill: "pill-accent", label: "Admin", icon: "🛡️" },
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [location.search]);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `User "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to delete user.",
      });
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
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 text-center">
        {error}
      </div>
    );
  }

  // Get filter from URL
  const queryParams = new URL(window.location.href).searchParams;
  const filterType = queryParams.get("type");

  // Create groups for each user type
  const allGroups = {
      Students: users.filter(u => u.user_type === 'Student'),
      Faculty: users.filter(u => u.user_type === 'Faculty'),
      Staff: users.filter(u => u.user_type === 'Staff'),
      Admins: users.filter(u => u.user_type === 'Admin'),
  };

  // Determine which groups to show
  let userGroups = allGroups;
  if (filterType === 'Student') userGroups = { Students: allGroups.Students };
  else if (filterType === 'Faculty') userGroups = { Faculty: allGroups.Faculty };
  else if (filterType === 'Staff') userGroups = { Staff: allGroups.Staff };
  else if (filterType === 'Admin') userGroups = { Admins: allGroups.Admins };

  const applySearch = (group) => {
    if (!search.trim()) return group;
    const q = search.toLowerCase();
    return group.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.roll_number || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.branch || "").toLowerCase().includes(q)
    );
  };

  const totalShown = Object.values(userGroups).reduce(
    (sum, g) => sum + applySearch(g).length,
    0
  );
  const totalAll = users.length;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <span className="page-header-eyebrow">User Management</span>
        <h1 className="page-header-title">
          {filterType ? `${filterType} management` : "All users"}
        </h1>
        <p className="page-header-sub">
          {totalShown} of {totalAll} users shown
        </p>
        <div className="page-header-actions">
          <Link to="/admin/users/create" className="btn-primary">
            <span aria-hidden="true">+</span> Add New User
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
            <span>All users</span>
            <span className="table-toolbar-meta">· search across roles</span>
          </div>
          <div className="auth-field-input" style={{ width: "20rem", maxWidth: "100%" }}>
            <span className="auth-field-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name, roll, email, branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {Object.keys(userGroups).length === 0 ? (
          <TableEmpty icon="👥" title="No users found" sub="Try a different search." />
        ) : (
          <div className="dashboard-panel-body">
            {Object.entries(userGroups).map(([groupName, groupUsers]) => {
              const visible = applySearch(groupUsers);
              const meta = ROLE_META[groupName] || ROLE_META.Students;
              return (
                <section key={groupName} className="p-4">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#1c1917" }}>
                      <span style={{ marginRight: "0.4rem" }}>{meta.icon}</span>
                      {groupName}
                    </h3>
                    <span className={`pill ${meta.pill}`}>{visible.length}</span>
                  </div>
                  {visible.length > 0 ? (
                    <div className="overflow-x-auto border border-stone-200 rounded-xl">
                      <table className="dashboard-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            {groupName === "Students" && <th>Roll Number</th>}
                            {groupName === "Students" && <th>Branch</th>}
                            {groupName === "Faculty" && <th>Department</th>}
                            <th>Email</th>
                            <th>Status</th>
                            <th className="text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visible.map((user) => (
                            <tr key={user.id}>
                              <td>
                                <div className="cell-name">
                                  <TableAvatar name={user.full_name} tone={meta.tone} />
                                  <div className="cell-name-text">
                                    <span className="cell-name-primary">{user.full_name}</span>
                                    <span className="cell-name-secondary">{meta.label}</span>
                                  </div>
                                </div>
                              </td>
                              {groupName === "Students" && (
                                <td>
                                  <span className="cell-mono">{user.roll_number || "—"}</span>
                                </td>
                              )}
                              {groupName === "Students" && (
                                <td>
                                  <span className="pill pill-info">{user.branch || "—"}</span>
                                </td>
                              )}
                              {groupName === "Faculty" && (
                                <td>
                                  <span className="pill pill-violet">
                                    {user.department_name || "—"}
                                  </span>
                                </td>
                              )}
                              <td style={{ color: "#57534e" }}>{user.email}</td>
                              <td>
                                <span className={`pill ${user.is_active ? "pill-success" : "pill-muted"}`}>
                                  {user.is_active ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <div className="cell-actions">
                                  <ActionButton
                                    title="Edit user"
                                    onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                  >
                                    <EditIcon />
                                  </ActionButton>
                                  <ActionButton
                                    tone="danger"
                                    title="Delete user"
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
                    <p style={{ fontSize: "0.85rem", color: "#a8a29e", fontStyle: "italic" }}>
                      No matches in this group.
                    </p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
