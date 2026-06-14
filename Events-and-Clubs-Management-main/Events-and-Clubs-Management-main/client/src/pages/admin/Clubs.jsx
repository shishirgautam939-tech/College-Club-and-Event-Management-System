import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getClubs, getClubMembers, addClubMember, removeClubMember } from "../../api/clubs";
import { getAllUsers } from "../../api/users";

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const location = useLocation();

  // Add member state
  const [showAddMember, setShowAddMember] = useState(false);
  const [students, setStudents] = useState([]);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberPosition, setNewMemberPosition] = useState("Member");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => {
    const fetchClubs = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await getClubs();
        setClubs(response.data);

        const queryParams = new URLSearchParams(location.search);
        const selectedName = queryParams.get("name");
        if (selectedName) {
          const matchedClub = response.data.find((club) => club.club_name === selectedName);
          if (matchedClub) setSelectedClubId(String(matchedClub.id));
        }
      } catch {
        setError("Failed to load clubs.");
      } finally {
        setLoading(false);
      }
    };

    fetchClubs();
  }, [location.search]);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!selectedClubId) {
        setMembers([]);
        return;
      }

      setMembersLoading(true);
      try {
        const response = await getClubMembers(selectedClubId);
        setMembers(response.data);
      } catch {
        setError("Failed to load club members.");
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [selectedClubId]);

  const selectedClub = useMemo(() => {
    return clubs.find((club) => String(club.id) === String(selectedClubId)) || null;
  }, [clubs, selectedClubId]);

  const handleShowAddMember = async () => {
    setShowAddMember(true);
    try {
      const res = await getAllUsers();
      setStudents(res.data.filter((u) => u.user_type === "Student"));
    } catch {
      setActionMsg({ type: "error", text: "Failed to load students." });
    }
  };

  const handleAddMember = async () => {
    if (!newMemberUserId) return;
    setAddingMember(true);
    setActionMsg({ type: "", text: "" });
    try {
      await addClubMember(selectedClubId, {
        user: parseInt(newMemberUserId),
        position: newMemberPosition,
      });
      setActionMsg({ type: "success", text: "Member added successfully." });
      setNewMemberUserId("");
      setNewMemberPosition("Member");
      setShowAddMember(false);
      // Refresh members
      const res = await getClubMembers(selectedClubId);
      setMembers(res.data);
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to add member.",
      });
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from this club?`)) return;
    setActionMsg({ type: "", text: "" });
    try {
      await removeClubMember(selectedClubId, memberId);
      setActionMsg({ type: "success", text: "Member removed." });
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to remove member.",
      });
    }
  };

  if (loading) return <div className="p-4">Loading clubs...</div>;
  if (error && clubs.length === 0) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Club Management</h1>
        <Link
          to="/admin/clubs/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition shadow-sm text-sm"
        >
          Create Club
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

      <div className="bg-white border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Club</label>
        <select
          value={selectedClubId}
          onChange={(e) => {
            setSelectedClubId(e.target.value);
            setShowAddMember(false);
          }}
          className="w-full md:w-96 border border-gray-300 px-3 py-2"
        >
          <option value="">-- Choose a club --</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.club_name}
              {club.is_council ? " (Council)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Club Info */}
      {selectedClub && (
        <div className="bg-white border border-gray-200 p-4 text-sm space-y-1">
          <p>
            <span className="font-medium text-gray-700">Club:</span>{" "}
            {selectedClub.club_name}
          </p>
          {selectedClub.description && (
            <p>
              <span className="font-medium text-gray-700">Description:</span>{" "}
              {selectedClub.description}
            </p>
          )}
          <p>
            <span className="font-medium text-gray-700">Faculty Coordinator:</span>{" "}
            {selectedClub.faculty_coordinator_name || "—"}
          </p>
          <p>
            <span className="font-medium text-gray-700">Type:</span>{" "}
            {selectedClub.is_council ? "Council" : "Club"}
          </p>
        </div>
      )}

      {/* Members Table */}
      <div className="overflow-x-auto border border-gray-200 bg-white">
        <div className="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-700 flex items-center justify-between">
          <span>
            {selectedClub ? `${selectedClub.club_name} Members` : "Club Members"}
          </span>
          {selectedClubId && (
            <button
              onClick={handleShowAddMember}
              className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 cursor-pointer"
            >
              + Add Member
            </button>
          )}
        </div>

        {/* Add Member Form */}
        {showAddMember && selectedClubId && (
          <div className="px-4 py-3 border-b border-gray-200 bg-indigo-50 flex items-end gap-3 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Student</label>
              <select
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm w-64"
              >
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.roll_number || s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
              <select
                value={newMemberPosition}
                onChange={(e) => setNewMemberPosition(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-sm"
              >
                <option value="Member">Member</option>
                <option value="Event Manager">Event Manager</option>
                <option value="President">President</option>
                <option value="Vice President">Vice President</option>
                <option value="Secretary">Secretary</option>
                <option value="Treasurer">Treasurer</option>
              </select>
            </div>
            <button
              onClick={handleAddMember}
              disabled={addingMember || !newMemberUserId}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {addingMember ? "Adding..." : "Add"}
            </button>
            <button
              onClick={() => setShowAddMember(false)}
              className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left border-r">Full Name</th>
              <th className="px-4 py-2 text-left border-r">Email</th>
              <th className="px-4 py-2 text-left border-r">Roll Number</th>
              <th className="px-4 py-2 text-left border-r">Designated Role</th>
              <th className="px-4 py-2 text-left border-r">Joined At</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!selectedClubId && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Select a club to view members.
                </td>
              </tr>
            )}

            {selectedClubId && membersLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  Loading members...
                </td>
              </tr>
            )}

            {selectedClubId && !membersLoading && members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-2 border-r">{member.full_name}</td>
                <td className="px-4 py-2 border-r">{member.email}</td>
                <td className="px-4 py-2 border-r">{member.roll_number || "-"}</td>
                <td className="px-4 py-2 border-r">{member.position}</td>
                <td className="px-4 py-2 border-r">{member.joined_at}</td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => handleRemoveMember(member.id, member.full_name)}
                    className="text-red-600 hover:text-red-900 text-xs cursor-pointer"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}

            {selectedClubId && !membersLoading && members.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                  No members found for this club.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clubs;