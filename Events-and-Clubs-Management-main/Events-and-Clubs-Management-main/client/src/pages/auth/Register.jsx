import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../api/auth";
import { getDepartments } from "../../api/users";
import Logo from "../../components/Logo";

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
      } else if (departments.length === 0) {
        setError("Faculty registration is unavailable until departments are configured on the server.");
        setLoading(false);
        return;
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
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8 no-underline">
        <Logo compact markSize={40} />
      </Link>

      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md space-y-5">
        <h2 className="text-xl font-semibold text-center text-stone-800">
          Create account
        </h2>

        {error && <div className="alert alert-error">{error}</div>}

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="input-field"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          className="input-field"
        />
        <select
          name="user_type"
          value={form.user_type}
          onChange={handleChange}
          className="input-field"
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
              className="input-field uppercase"
            />
            {form.branch && (
              <p className="mt-1 text-sm text-brand-700">
                {BRANCH_MAP[form.branch] || form.branch}
              </p>
            )}
          </div>
        )}

        {form.user_type === "Faculty" && (
          <>
            {departments.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3">
                No departments found yet. Ask an admin to run{" "}
                <code className="text-xs">python manage.py setup_defaults</code> on the server.
              </p>
            ) : (
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
            )}
          </>
        )}

        <p className="text-xs text-stone-400 text-center">
          Admin accounts are set up separately.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p className="text-sm text-center text-stone-500">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Register;
