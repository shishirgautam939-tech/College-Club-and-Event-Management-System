import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { getDepartments } from "../../api/users";

const BRANCH_MAP = {
  BCT: "BCT - Computer",
  BCE: "BCE - Civil",
  BEE: "BEE - Electrical",
  BEI: "BEI - Electronics",
};

const ROLL_REGEX = /^NCE0\d{2}(BCT|BCE|BEE|BEI)0\d{2}$/i;

const Register = () => {
  const [form, setForm] = useState({
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
  const navigate = useNavigate();

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {});
  }, []);

  // Auto-detect branch from roll number
  const handleRollChange = (e) => {
    const val = e.target.value.toUpperCase();
    const match = val.match(/^NCE0\d{2}(BCT|BCE|BEE|BEI)/i);
    setForm({
      ...form,
      roll_number: val,
      branch: match ? match[1].toUpperCase() : "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      } else {
        // Validate roll number format before sending
        if (!ROLL_REGEX.test(payload.roll_number)) {
          setError("Invalid roll number. Format: NCE0XXBRANCH0XX (e.g. NCE078BCT012)");
          setLoading(false);
          return;
        }
        payload.roll_number = payload.roll_number.toUpperCase();
        // Branch is auto-mapped on the backend from roll_number; remove explicit branch
        delete payload.branch;
      }
      if (payload.user_type !== "Faculty") {
        delete payload.department;
      }
      // Convert department to number or remove if empty
      if (payload.department === "") {
        delete payload.department;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      await registerUser(payload);
      navigate("/login", { state: { registered: true } });
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(" ");
        setError(messages || "Registration failed.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create Account
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          name="user_type"
          value={form.user_type}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="Student">Student</option>
          <option value="Faculty">Faculty</option>
          <option value="Staff">Staff</option>
        </select>

        {form.user_type === "Student" && (
          <div>
            <input
              type="text"
              name="roll_number"
              placeholder="Roll Number (e.g. NCE078BCT012)"
              value={form.roll_number}
              onChange={handleRollChange}
              required
              maxLength={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 uppercase"
            />
            <p className="mt-1 text-xs text-gray-500">Format: NCE0<span className="font-semibold">YY</span>BRANCH0<span className="font-semibold">RR</span> &mdash; YY=batch year, BRANCH=BCT/BCE/BEE/BEI, RR=roll no</p>
            {form.branch && (
              <p className="mt-1 text-sm text-indigo-600 font-medium">
                Detected branch: {BRANCH_MAP[form.branch] || form.branch}
              </p>
            )}
          </div>
        )}

        {form.user_type === "Faculty" && (
          <select
            name="department"
            value={form.department}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="text-sm text-center text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
