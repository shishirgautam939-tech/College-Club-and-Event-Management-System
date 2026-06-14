import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { getAllUsers, deleteUser } from "../../api/users";

const BRANCHES = [
  { code: "BCT", label: "BCT - Computer", color: "bg-blue-50 text-blue-700 border-blue-200", icon: "💻" },
  { code: "BCE", label: "BCE - Civil", color: "bg-green-50 text-green-700 border-green-200", icon: "🏗️" },
  { code: "BEE", label: "BEE - Electrical", color: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: "⚡" },
  { code: "BEI", label: "BEI - Electronics", color: "bg-purple-50 text-purple-700 border-purple-200", icon: "📡" },
];

const Students = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const selectedBranch = searchParams.get("branch");

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

  // If no branch selected, show branch cards
  if (!selectedBranch) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-800">Students by Branch</h1>
          <Link
            to="/admin/users/create"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm text-sm"
          >
            Add New Student
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRANCHES.map((b) => {
            const count = users.filter((u) => u.branch === b.code).length;
            return (
              <Link
                key={b.code}
                to={`/admin/students?branch=${b.code}`}
                className={`rounded-lg border p-6 flex flex-col items-center gap-3 hover:shadow-md transition ${b.color}`}
              >
                <span className="text-4xl">{b.icon}</span>
                <p className="text-lg font-bold">{b.code}</p>
                <p className="text-sm opacity-80">{b.label.split(" - ")[1]}</p>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs opacity-70">Students</p>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Branch selected — show filtered student table
  const branchInfo = BRANCHES.find((b) => b.code === selectedBranch);
  const filteredStudents = users.filter((u) => u.branch === selectedBranch);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/students")}
            className="text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {branchInfo?.label || selectedBranch} Students
          </h1>
          <span className="text-sm text-gray-500">({filteredStudents.length})</span>
        </div>
        <Link
          to="/admin/users/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm text-sm"
        >
          Add New Student
        </Link>
      </div>

      {actionMsg.text && (
        <div className={`p-3 rounded text-sm ${actionMsg.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
          {actionMsg.text}
        </div>
      )}

      {filteredStudents.length > 0 ? (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Roll Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Email</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">Status</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">{user.full_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r font-mono">{user.roll_number || "-"}</td>
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
        <p className="text-gray-500 italic text-sm">No students found in this branch.</p>
      )}
    </div>
  );
};

export default Students;
