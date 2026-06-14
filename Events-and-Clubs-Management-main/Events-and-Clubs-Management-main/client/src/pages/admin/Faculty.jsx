import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getAllUsers, getDepartments, deleteUser } from "../../api/users";

const Faculty = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedDept = searchParams.get("dept");

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

  const DEPT_COLORS = [
    "bg-blue-50 text-blue-700 border-blue-200",
    "bg-green-50 text-green-700 border-green-200",
    "bg-yellow-50 text-yellow-700 border-yellow-200",
    "bg-purple-50 text-purple-700 border-purple-200",
    "bg-pink-50 text-pink-700 border-pink-200",
  ];

  const DEPT_ICONS = ["📡", "🏗️", "⚡", "🔬", "📐"];

  // No department selected — show department cards
  if (!selectedDept) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Faculty by Department</h1>
          <Link
            to="/admin/users/create"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm text-sm"
          >
            Add New Faculty
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dept, idx) => {
            const count = users.filter((u) => u.department === dept.id).length;
            // Shorten display name
            const shortName = dept.department_name.replace("Department of ", "");
            return (
              <Link
                key={dept.id}
                to={`/admin/faculty?dept=${dept.id}`}
                className={`rounded-lg border p-6 flex flex-col items-center gap-3 hover:shadow-md transition ${DEPT_COLORS[idx % DEPT_COLORS.length]}`}
              >
                <span className="text-4xl">{DEPT_ICONS[idx % DEPT_ICONS.length]}</span>
                <p className="text-base font-bold text-center">{shortName}</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs opacity-70">Faculty Members</p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Department selected — show faculty table
  const deptId = parseInt(selectedDept);
  const deptInfo = departments.find((d) => d.id === deptId);
  const filteredFaculty = users.filter((u) => u.department === deptId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/faculty")}
            className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {deptInfo?.department_name || "Department"} — Faculty
          </h1>
          <span className="text-sm text-gray-500">({filteredFaculty.length})</span>
        </div>
        <Link
          to="/admin/users/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm text-sm"
        >
          Add New Faculty
        </Link>
      </div>

      {actionMsg.text && (
        <div className={`p-3 rounded text-sm ${actionMsg.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {actionMsg.text}
        </div>
      )}

      {filteredFaculty.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFaculty.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center border-r">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    <button onClick={() => navigate(`/admin/users/${user.id}/edit`)} className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer">Edit</button>
                    <button onClick={() => handleDelete(user.id, user.full_name)} className="text-red-600 hover:text-red-900 cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 italic text-sm">No faculty members found in this department.</p>
      )}
    </div>
  );
};

export default Faculty;
