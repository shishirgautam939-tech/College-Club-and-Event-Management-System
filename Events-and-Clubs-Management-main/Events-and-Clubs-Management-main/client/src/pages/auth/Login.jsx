import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Logo from "../../components/Logo";

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
    setLoading(true);
    try {
      const role = await login(identifier, password);
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
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-4 py-10">
      <Link to="/" className="mb-8 no-underline">
        <Logo compact markSize={40} />
      </Link>

      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md space-y-5">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-stone-800">Sign in</h2>
        </div>

        {justRegistered && (
          <div className="alert alert-success">Account created. You can sign in now.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        <input
          type="text"
          placeholder="Email, roll number, or name"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="input-field"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="input-field"
        />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="text-sm text-center text-stone-500">
          No account?{" "}
          <Link to="/register" className="text-brand-700 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
