import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

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
      const data = err.response?.data;
      setError(data?.detail || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card p-8 w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-semibold mx-auto mb-4">
            CC
          </div>
          <h2 className="text-2xl font-semibold text-stone-800">Welcome back</h2>
          <p className="text-sm text-stone-500 mt-1">Sign in to your campus account</p>
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
          New here?{" "}
          <Link to="/register" className="text-brand-700 hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
