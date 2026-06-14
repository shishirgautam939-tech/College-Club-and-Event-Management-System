import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-center">
      <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">
        Access Denied
      </h2>
      <p className="text-gray-500 mb-6">
        You don&apos;t have permission to view this page.
      </p>
      <Link
        to="/dashboard"
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default Unauthorized;
