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

const BRANCH_PILL = {
  BCT: "pill-info",
  BCE: "pill-success",
  BEE: "pill-warn",
  BEI: "pill-violet",
};

const ROLL_REGEX = /^NCE0\d{2}(BCT|BCE|BEE|BEI)0\d{2}$/i;
const EMAIL_ALLOWED_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|edu)$/i;

const ROLES = [
  { value: "Student", label: "Student", icon: "🎓" },
  { value: "Faculty", label: "Faculty", icon: "👨‍🏫" },
  { value: "Staff", label: "Staff", icon: "🛠️" },
];

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
    if (!EMAIL_ALLOWED_REGEX.test(form.email.trim())) {
      setError("Enter a valid email ending with .com or .edu (e.g. name@gmail.com or name@nce.edu).");
      return;
    }
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
    <div className="auth-shell">
      {/* Brand / hero panel */}
      <aside className="auth-art" aria-hidden="true">
        <span className="auth-art-blob one" />
        <span className="auth-art-blob two" />
        <div className="auth-art-inner">
          <div>
            <Logo light markSize={36} />
          </div>
          <div>
            <span className="auth-art-eyebrow">Join Evento</span>
            <h1 className="auth-art-title">
              Create your campus account in less than a minute.
            </h1>
            <p className="auth-art-sub">
              Sign up once and unlock event discovery, QR check-in, and digital
              certificates for everything your college has to offer.
            </p>

            <div className="auth-art-features">
              <div className="auth-art-feature">
                <span className="auth-art-feature-icon">🎯</span>
                <div className="auth-art-feature-text">
                  <span className="auth-art-feature-title">Tailored to your role</span>
                  <span className="auth-art-feature-sub">
                    Students, faculty, and staff each get the right view.
                  </span>
                </div>
              </div>
              <div className="auth-art-feature">
                <span className="auth-art-feature-icon">🪪</span>
                <div className="auth-art-feature-text">
                  <span className="auth-art-feature-title">Verified roll numbers</span>
                  <span className="auth-art-feature-sub">
                    Format NCE078BCT012 — branch is auto-detected.
                  </span>
                </div>
              </div>
              <div className="auth-art-feature">
                <span className="auth-art-feature-icon">🔒</span>
                <div className="auth-art-feature-text">
                  <span className="auth-art-feature-title">Your data stays yours</span>
                  <span className="auth-art-feature-sub">
                    Secure sign-in with email ending in .com or .edu.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-art-footer">
            <span>Already have an account?</span>
            <Link to="/login" style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
              Sign in →
            </Link>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="auth-form">
        <div className="auth-form-inner">
          <Link to="/" className="auth-form-mobile-brand no-underline">
            <Logo compact markSize={36} />
          </Link>

          <span className="auth-form-eyebrow">Create account</span>
          <h2 className="auth-form-title">Join Evento</h2>
          <p className="auth-form-sub">
            Pick your role and tell us a little about you.
          </p>

          {error && (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-stack auth-form" autoComplete="on">
            {/* Role tabs */}
            <div className="auth-field">
              <label className="auth-field-label">
                <span>I am a…</span>
              </label>
              <div className="auth-role-tabs" role="tablist">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    role="tab"
                    aria-selected={form.user_type === r.value}
                    onClick={() => setForm({ ...form, user_type: r.value })}
                    className={
                      "auth-role-tab" +
                      (form.user_type === r.value ? " auth-role-tab-active" : "")
                    }
                  >
                    <span aria-hidden="true">{r.icon}</span>
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="full_name" className="auth-field-label">
                <span>Full name</span>
              </label>
              <div className="auth-field-input">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="e.g. Brishav Joshi"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email" className="auth-field-label">
                <span>Email</span>
                <span style={{ fontSize: "0.7rem", color: "#a8a29e", fontWeight: 500 }}>
                  .com or .edu only
                </span>
              </label>
              <div className="auth-field-input">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@gmail.com or name@nce.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                  pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|edu)"
                  title="Email must end with .com or .edu"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-field-label">
                <span>Password</span>
              </label>
              <div className="auth-field-input">
                <span className="auth-field-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            {form.user_type === "Student" && (
              <div className="auth-field">
                <label htmlFor="roll_number" className="auth-field-label">
                  <span>Roll number</span>
                  <span style={{ fontSize: "0.7rem", color: "#a8a29e", fontWeight: 500 }}>
                    NCE0XXBRANCH0XX
                  </span>
                </label>
                <div className="auth-field-input">
                  <span className="auth-field-icon" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <path d="M7 8h10M7 12h10M7 16h6" />
                    </svg>
                  </span>
                  <input
                    id="roll_number"
                    type="text"
                    name="roll_number"
                    placeholder="NCE078BCT012"
                    value={form.roll_number}
                    onChange={handleRollChange}
                    required
                    maxLength={12}
                    autoComplete="off"
                    style={{ textTransform: "uppercase" }}
                  />
                </div>
                {form.branch && (
                  <div className="auth-field-hint brand">
                    <span className={`pill ${BRANCH_PILL[form.branch] || "pill-brand"}`} style={{ marginRight: "0.4rem" }}>
                      {form.branch}
                    </span>
                    {BRANCH_MAP[form.branch] || form.branch}
                  </div>
                )}
              </div>
            )}

            {form.user_type === "Faculty" && (
              <div className="auth-field">
                <label htmlFor="department" className="auth-field-label">
                  <span>Department</span>
                </label>
                {departments.length === 0 ? (
                  <div className="auth-callout">
                    <span aria-hidden="true">⚠️</span>
                    <span>
                      No departments found yet. Ask an admin to run{" "}
                      <code>python manage.py setup_defaults</code>.
                    </span>
                  </div>
                ) : (
                  <div className="auth-field-input">
                    <span className="auth-field-icon" aria-hidden="true">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4 8 4v14" />
                        <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01" />
                      </svg>
                    </span>
                    <select
                      id="department"
                      name="department"
                      value={form.department}
                      onChange={handleChange}
                      required
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
              </div>
            )}

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create my account</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-link">
            Already have an account?{" "}
            <Link to="/login">Sign in</Link>
          </div>

          <div className="auth-callout">
            <span aria-hidden="true">🛡️</span>
            <span>
              Admin accounts are created separately by a system administrator.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
