import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { getClubs } from "../api/clubs";

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isClubsMenuOpen, setIsClubsMenuOpen] = useState(false);
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const clubsRef = useRef(null);
  const eventsRef = useRef(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await getClubs();
        setClubs(res.data);
      } catch {
        // Silently fail — nav still works
      }
    };
    fetchClubs();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clubsRef.current && !clubsRef.current.contains(e.target)) {
        setIsClubsMenuOpen(false);
      }
      if (eventsRef.current && !eventsRef.current.contains(e.target)) {
        setIsEventsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns on navigation
  useEffect(() => {
    setIsClubsMenuOpen(false);
    setIsEventsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-indigo-700 text-white shadow-md relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-6">
              <Link to="/admin" className="text-xl font-bold">
                ECM Admin
              </Link>
              <Link to="/admin" className="text-indigo-200 hover:text-white">
                Dashboard
              </Link>
              
              <Link to="/admin/students" className="text-indigo-200 hover:text-white">
                Students
              </Link>

              <Link to="/admin/faculty" className="text-indigo-200 hover:text-white">
                Faculty
              </Link>

              {/* Clubs Dropdown — dynamically loaded */}
              <div className="relative" ref={clubsRef}>
                <button
                  onClick={() => {
                    setIsClubsMenuOpen((prev) => !prev);
                    setIsEventsMenuOpen(false);
                  }}
                  className="text-indigo-200 hover:text-white flex items-center gap-1 focus:outline-none py-4 cursor-pointer"
                >
                  Clubs
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isClubsMenuOpen && (
                  <div className="absolute top-full left-0 w-56 bg-white rounded-md shadow-lg py-1 border border-indigo-100">
                    <Link
                      to="/admin/clubs"
                      className="block px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-50 border-b border-gray-100"
                    >
                      All Clubs
                    </Link>
                    {clubs.map((club) => (
                      <Link
                        key={club.id}
                        to={`/admin/clubs?name=${encodeURIComponent(club.club_name)}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      >
                        {club.club_name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Events Dropdown */}
              <div className="relative" ref={eventsRef}>
                <button
                  onClick={() => {
                    setIsEventsMenuOpen((prev) => !prev);
                    setIsClubsMenuOpen(false);
                  }}
                  className="text-indigo-200 hover:text-white flex items-center gap-1 focus:outline-none py-4 cursor-pointer"
                >
                  Events
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isEventsMenuOpen && (
                  <div className="absolute top-full left-0 w-48 bg-white rounded-md shadow-lg py-1 border border-indigo-100 z-50">
                    <Link
                      to="/admin/events?tab=pending"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Pending Events
                    </Link>
                    <Link
                      to="/admin/events?tab=approved"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Approved Events
                    </Link>
                    <Link
                      to="/admin/events?tab=all"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      All Events
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-indigo-200">
                {user?.name} (Admin)
              </span>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm bg-indigo-800 text-white rounded-md hover:bg-indigo-900 transition cursor-pointer"
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

export default AdminLayout;
