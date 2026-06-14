import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClub } from "../../api/clubs";
import { getAllUsers } from "../../api/users";

const CreateClub = () => {
  const navigate = useNavigate();
  const [facultyList, setFacultyList] = useState([]);
  const [formData, setFormData] = useState({
    club_name: "",
    description: "",
    faculty_coordinator: "",
    is_council: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingFaculty, setFetchingFaculty] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await getAllUsers();
        setFacultyList(
          res.data.filter(
            (u) => u.user_type === "Faculty" || u.user_type === "Admin"
          )
        );
      } catch {
        setError("Failed to load faculty list.");
      } finally {
        setFetchingFaculty(false);
      }
    };
    fetchFaculty();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        faculty_coordinator: formData.faculty_coordinator
          ? parseInt(formData.faculty_coordinator)
          : null,
      };
      await createClub(payload);
      navigate("/admin/clubs");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(" ");
        setError(messages || "Failed to create club.");
      } else {
        setError("Failed to create club.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Create New Club</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded border border-red-200 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Club Name</label>
          <input
            type="text"
            name="club_name"
            value={formData.club_name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="e.g. NCE IT Club"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief description of the club..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Faculty Coordinator</label>
          <select
            name="faculty_coordinator"
            value={formData.faculty_coordinator}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Select Faculty --</option>
            {fetchingFaculty ? (
              <option disabled>Loading...</option>
            ) : (
              facultyList.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.full_name} ({f.email})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_council"
            checked={formData.is_council}
            onChange={handleChange}
            id="is_council"
            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor="is_council" className="text-sm font-medium text-gray-700">
            This is a council (not a regular club)
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/clubs")}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Club"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateClub;
