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

  // Show success message if redirected from registration
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
      if (data?.detail) {
        setError(data.detail);
      } else {
        setError("Login failed. Check your credentials.");
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
          Login
        </h2>

        {justRegistered && (
          <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
            Account created successfully! Please log in.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Email, Roll Number, or Name"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-sm text-center text-gray-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-indigo-600 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
