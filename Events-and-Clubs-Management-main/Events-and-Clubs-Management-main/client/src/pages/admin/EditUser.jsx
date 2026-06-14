import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAllUsers, updateUser, getDepartments } from "../../api/users";

const BRANCHES = [
  { value: "BCT", label: "BCT - Computer" },
  { value: "BCE", label: "BCE - Civil" },
  { value: "BEE", label: "BEE - Electrical" },
  { value: "BEI", label: "BEI - Electronics" },
];

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    user_type: "",
    roll_number: "",
    branch: "",
    department: "",
    is_active: true,
    password: "",
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          getAllUsers(),
          getDepartments(),
        ]);
        setDepartments(deptsRes.data);
        const user = usersRes.data.find((u) => u.id === parseInt(id));
        if (!user) {
          setError("User not found.");
          setLoading(false);
          return;
        }
        setFormData({
          full_name: user.full_name,
          email: user.email,
          user_type: user.user_type,
          roll_number: user.roll_number || "",
          branch: user.branch || "",
          department: user.department || "",
          is_active: user.is_active,
          password: "",
        });
      } catch {
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      }
      // Only send department for Faculty
      if (payload.user_type !== "Faculty") {
        payload.department = null;
      }
      if (payload.department === "") {
        payload.department = null;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      // Handle branch
      if (payload.branch === "") {
        payload.branch = null;
      }

      await updateUser(id, payload);
      // Redirect based on user type
      if (payload.user_type === "Student") navigate("/admin/students");
      else if (payload.user_type === "Faculty") navigate("/admin/faculty");
      else navigate("/admin");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(" ");
        setError(messages || "Failed to update user.");
      } else {
        setError("Failed to update user.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit User</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
          <select
            name="user_type"
            value={formData.user_type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Staff">Staff</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {/* Branch dropdown for Students */}
        {formData.user_type === "Student" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Branch</option>
              {BRANCHES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Department dropdown for Faculty */}
        {formData.user_type === "Faculty" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password{" "}
            <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {formData.user_type === "Student" && (
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <label className="block text-sm font-medium text-blue-800 mb-1">Roll Number</label>
            <input
              type="text"
              name="roll_number"
              value={formData.roll_number}
              onChange={handleChange}
              placeholder="Format: NCE123ABC456"
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-blue-600">
              Must be in format: NCE + 3 digits + 3 letters + 3 digits
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            id="is_active"
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
