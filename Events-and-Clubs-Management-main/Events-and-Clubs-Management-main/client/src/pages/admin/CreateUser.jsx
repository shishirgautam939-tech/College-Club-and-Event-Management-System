import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, getDepartments } from "../../api/users";

const BRANCHES = [
  { value: "BCT", label: "BCT - Computer" },
  { value: "BCE", label: "BCE - Civil" },
  { value: "BEE", label: "BEE - Electrical" },
  { value: "BEI", label: "BEI - Electronics" },
];

const CreateUser = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        password: "",
        user_type: "Student",
        roll_number: "",
        branch: "",
        department: "",
    });
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getDepartments()
            .then((res) => setDepartments(res.data))
            .catch(() => {});
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const payload = { ...formData };
            // Only send roll_number and branch for students
            if (payload.user_type !== "Student") {
                delete payload.roll_number;
                delete payload.branch;
            }
            // Only send department for Faculty
            if (payload.user_type !== "Faculty") {
                delete payload.department;
            }
            if (payload.department === "") {
                delete payload.department;
            } else if (payload.department) {
                payload.department = Number(payload.department);
            }
            if (payload.branch === "") {
                delete payload.branch;
            }
            await createUser(payload);
            // Redirect based on user type
            if (payload.user_type === "Student") navigate("/admin/students");
            else if (payload.user_type === "Faculty") navigate("/admin/faculty");
            else navigate("/admin");
        } catch (err) {
            console.error("Failed to create user", err);
            const detail = err.response?.data?.detail 
                || err.response?.data?.roll_number?.[0] 
                || err.response?.data?.email?.[0]
                || "Failed to create user.";
            setError(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New User</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* User Type Selection */}
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

                {/* Common Fields */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                {/* Conditional Field for Students */}
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
                        <p className="mt-1 text-xs text-blue-600">Must be in format: NCE + 3 digits + 3 letters + 3 digits</p>
                    </div>
                )}

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
                        disabled={loading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        {loading ? "Creating..." : "Create User"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUser;
