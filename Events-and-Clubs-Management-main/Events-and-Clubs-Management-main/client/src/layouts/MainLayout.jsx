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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div clafssName="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link
                to="/dashboard"
                className="text-xl font-bold text-indigo-600"
              >
                ECM
              </Link>
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Events
              </Link>
              {user?.role === "Student" && (
                <>
                  <Link
                    to="/my-events"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    My Events
                  </Link>
                  <Link
                    to="/events/propose"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Propose Event
                  </Link>
                </>
              )}
              {(user?.role === "Faculty" || user?.role === "Admin") && (
                <Link
                  to="/faculty"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Approvals
                </Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                {user?.name}{" "}
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {user?.role}
                </span>
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
