import { Outlet, Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <nav className="bg-white/90 backdrop-blur border-b border-stone-200/80 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-5">
              <Link to="/dashboard" className="text-lg font-semibold text-brand-800">
                Campus Connect
              </Link>
              <Link to="/dashboard" className="nav-link hidden sm:inline">
                Events
              </Link>
              {user?.role === "Student" && (
                <>
                  <Link to="/my-events" className="nav-link hidden sm:inline">
                    My Events
                  </Link>
                  <Link to="/scan-attendance" className="nav-link hidden sm:inline">
                    Scan QR
                  </Link>
                  <Link to="/my-certificates" className="nav-link hidden sm:inline">
                    Certificates
                  </Link>
                  <Link to="/events/propose" className="nav-link hidden md:inline">
                    Propose Event
                  </Link>
                </>
              )}
              {(user?.role === "Faculty" || user?.role === "Admin") && (
                <Link to="/faculty" className="nav-link hidden sm:inline">
                  Approvals
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-500 hidden sm:inline">
                Hi, {user?.name}
              </span>
              <span className="badge badge-muted">{user?.role}</span>
              <button type="button" onClick={handleLogout} className="btn-secondary py-1.5 px-3">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
