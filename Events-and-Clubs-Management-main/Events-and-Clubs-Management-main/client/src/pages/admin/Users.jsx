import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getAllUsers, deleteUser } from "../../api/users";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [location.search]);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("Failed to load users. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This action cannot be undone.`)) return;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `User "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to delete user.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-600 text-center">
        {error}
      </div>
    );
  }

  // Get filter from URL
  const queryParams = new URL(window.location.href).searchParams;
  const filterType = queryParams.get("type");

  // Create groups for each user type
  const allGroups = {
      Students: users.filter(u => u.user_type === 'Student'),
      Faculty: users.filter(u => u.user_type === 'Faculty'),
      Staff: users.filter(u => u.user_type === 'Staff'),
      Admins: users.filter(u => u.user_type === 'Admin'),
  };

  // Determine which groups to show
  let userGroups = allGroups;
  if (filterType === 'Student') userGroups = { Students: allGroups.Students };
  else if (filterType === 'Faculty') userGroups = { Faculty: allGroups.Faculty };
  else if (filterType === 'Staff') userGroups = { Staff: allGroups.Staff };
  else if (filterType === 'Admin') userGroups = { Admins: allGroups.Admins };

  return (
    <div className="space-y-8 p-4">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
           {filterType ? `${filterType} Management` : "User Management"}
        </h1>
        <Link
          to="/admin/users/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm text-sm"
        >
          Add New User
        </Link>
      </div>

      {actionMsg.text && (
        <div
          className={`p-3 rounded text-sm ${
            actionMsg.type === "success"
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      {Object.entries(userGroups).map(([groupName, groupUsers]) => (
        <div key={groupName} className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-l-4 border-indigo-500 pl-2">
                {groupName} <span className="text-sm font-normal text-gray-500">({groupUsers.length})</span>
            </h2>
            
            {groupUsers.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Name
                            </th>
                            {groupName === 'Students' && (
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                  Roll Number
                              </th>
                            )}
                            {groupName === 'Students' && (
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                  Branch
                              </th>
                            )}
                            {groupName === 'Faculty' && (
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                  Department
                              </th>
                            )}
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                                Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {groupUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                                    {user.full_name}
                                </td>
                                {groupName === 'Students' && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r font-mono">
                                      {user.roll_number || "-"}
                                  </td>
                                )}
                                {groupName === 'Students' && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                      {user.branch || "-"}
                                  </td>
                                )}
                                {groupName === 'Faculty' && (
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                      {user.department_name || "-"}
                                  </td>
                                )}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center border-r">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    user.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    }`}>
                                    {user.is_active ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <button
                                      onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                                      className="text-indigo-600 hover:text-indigo-900 mr-4 cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(user.id, user.full_name)}
                                      className="text-red-600 hover:text-red-900 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p className="text-gray-500 italic text-sm">No {groupName.toLowerCase()} found.</p>
            )}
        </div>
      ))}
    </div>
  );
};

export default Users;
