import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Logo from "../../components/Logo";

const EMAIL_ALLOWED_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(?:com|edu)$/i;

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justRegistered = location.state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const trimmedIdentifier = identifier.trim();
    if (trimmedIdentifier.includes("@") && !EMAIL_ALLOWED_REGEX.test(trimmedIdentifier)) {
      setError("Enter a valid email ending with .com or .edu (e.g. name@gmail.com or name@nce.edu).");
      return;
    }
    setLoading(true);
    try {
      const role = await login(trimmedIdentifier, password);
      if (role === "Admin") navigate("/admin");
      else if (role === "Faculty") navigate("/faculty");
      else navigate("/dashboard");
    } catch (err) {
      if (!err.response) {
        setError(
          "Cannot reach the server. Start the backend with: python manage.py runserver"
        );
      } else {
        const data = err.response?.data;
        setError(
          data?.detail ||
            data?.non_field_errors?.[0] ||
            "Login failed. Check your email and password."
        );
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
            <span className="auth-art-eyebrow">Evento · Campus OS</span>
            <h1 className="auth-art-title">
              Run every club, every event, every certificate — in one place.
            </h1>
            <p className="auth-art-sub">
              From proposals to attendance to digital certificates, Evento gives
              administrators, faculty, and students a single home for everything
              that happens outside the classroom.
            </p>

            <div className="auth-art-features">
              <div className="auth-art-feature">
                <span className="auth-art-feature-icon">📝</span>
                <div className="auth-art-feature-text">
                  <span className="auth-art-feature-title">Event proposals in seconds</span>
                  <span className="auth-art-feature-sub">
                    Faculty submit, admins review, students register.
                  </span>
                </div>
              </div>
              <div className="auth-art-feature">
                <span className="auth-art-feature-icon">📱</span>
                <div className="auth-art-feature-text">
                  <span className="auth-art-feature-title">QR attendance</span>
                  <span className="auth-art-feature-sub">
                    Frictionless check-in, instantly recorded for every participant.
                  </span>
                </div>
              </div>
              <div className="auth-art-feature">
                <span className="auth-art-feature-icon">🏆</span>
                <div className="auth-art-feature-text">
                  <span className="auth-art-feature-title">Digital certificates</span>
                  <span className="auth-art-feature-sub">
                    Issued automatically when events wrap.
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="auth-art-footer">
            <span>© Evento · College Club & Event Management</span>
            <span className="dots">
              <span className="dot active" />
              <span className="dot" />
              <span className="dot" />
            </span>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="auth-form">
        <div className="auth-form-inner">
          <Link to="/" className="auth-form-mobile-brand no-underline">
            <Logo compact markSize={36} />
          </Link>

          <span className="auth-form-eyebrow">Welcome back</span>
          <h2 className="auth-form-title">Sign in to Evento</h2>
          <p className="auth-form-sub">
            Use your college email, roll number, or name to continue.
          </p>

          {justRegistered && (
            <div className="alert alert-success" style={{ marginTop: "1rem" }}>
              <span>✅</span>
              <span>Account created. You can sign in now.</span>
            </div>
          )}
          {error && (
            <div className="alert alert-error" style={{ marginTop: "1rem" }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-stack auth-form" autoComplete="on">
            <div className="auth-field">
              <label htmlFor="identifier" className="auth-field-label">
                <span>Email, roll number, or name</span>
              </label>
              <div className="auth-field-input">
                <span className="auth-field-icon" aria-hidden="true">
                  {/* user icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="identifier"
                  type="text"
                  placeholder="name@nce.edu or NCE078BCT012"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-field-label">
                <span>Password</span>
                <span style={{ fontSize: "0.7rem", color: "#a8a29e", fontWeight: 500 }}>
                  secure connection
                </span>
              </label>
              <div className="auth-field-input">
                <span className="auth-field-icon" aria-hidden="true">
                  {/* lock icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? (
                <>
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <span aria-hidden="true">→</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-link">
            New to Evento?{" "}
            <Link to="/register">Create an account</Link>
          </div>

          <div className="auth-callout">
            <span aria-hidden="true">💡</span>
            <span>
              Tip: backend running? Start it with{" "}
              <code>python manage.py runserver</code>. Need an admin? Run{" "}
              <code>python manage.py setup_defaults</code>.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
