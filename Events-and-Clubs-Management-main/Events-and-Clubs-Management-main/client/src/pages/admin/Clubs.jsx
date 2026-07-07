import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getClubs, getClubMembers, addClubMember, removeClubMember } from "../../api/clubs";
import { getAllUsers } from "../../api/users";
import { TableAvatar, ActionButton, TrashIcon, TableEmpty } from "../../components/TableBits";

const POSITION_PILL = {
  President: "pill-accent",
  "Vice President": "pill-violet",
  Secretary: "pill-info",
  Treasurer: "pill-warn",
  "Event Manager": "pill-brand",
  Member: "pill-muted",
};

const Clubs = () => {
  const [clubs, setClubs] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState("");
  const [membersLoading, setMembersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
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

  const searchedMembers = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        m.full_name.toLowerCase().includes(q) ||
        (m.roll_number || "").toLowerCase().includes(q) ||
        (m.email || "").toLowerCase().includes(q) ||
        (m.position || "").toLowerCase().includes(q)
    );
  }, [members, search]);

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
      <div className="page-header">
        <span className="page-header-eyebrow">Clubs</span>
        <h1 className="page-header-title">Club management</h1>
        <p className="page-header-sub">
          {clubs.length} clubs on campus · {selectedClub ? `${members.length} members in this club` : "Pick a club to manage its members."}
        </p>
        <div className="page-header-actions">
          <Link to="/admin/clubs/create" className="btn-primary">
            <span aria-hidden="true">+</span> Create Club
          </Link>
        </div>
      </div>

      {actionMsg.text && (
        <div className={`alert ${actionMsg.type === "success" ? "alert-success" : "alert-error"}`}>
          <span aria-hidden="true">{actionMsg.type === "success" ? "✅" : "⚠️"}</span>
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Club selector card */}
      <div className="card p-5">
        <label className="auth-field-label" style={{ marginBottom: "0.5rem" }}>
          <span>Select a club</span>
          {selectedClub && (
            <span className="pill pill-accent">{selectedClub.is_council ? "Council" : "Club"}</span>
          )}
        </label>
        <select
          value={selectedClubId}
          onChange={(e) => {
            setSelectedClubId(e.target.value);
            setShowAddMember(false);
            setSearch("");
          }}
          className="input-field"
          style={{ maxWidth: "32rem" }}
        >
          <option value="">— Choose a club —</option>
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.club_name}
              {club.is_council ? " (Council)" : ""}
            </option>
          ))}
        </select>

        {selectedClub && (
          <div
            className="dashboard-panel"
            style={{
              marginTop: "1rem",
              padding: 0,
              border: "1px solid var(--color-cream-200)",
            }}
          >
            <div className="dashboard-panel-body" style={{ padding: "1rem 1.25rem" }}>
              <div style={{ display: "grid", gap: "0.6rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                <div>
                  <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a8a29e", fontWeight: 600 }}>
                    Faculty Coordinator
                  </p>
                  <p style={{ marginTop: "0.2rem", color: "#1c1917", fontWeight: 500 }}>
                    {selectedClub.faculty_coordinator_name || "—"}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a8a29e", fontWeight: 600 }}>
                    Type
                  </p>
                  <p style={{ marginTop: "0.2rem" }}>
                    <span className={`pill ${selectedClub.is_council ? "pill-violet" : "pill-brand"}`}>
                      {selectedClub.is_council ? "Council" : "Club"}
                    </span>
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a8a29e", fontWeight: 600 }}>
                    Members
                  </p>
                  <p style={{ marginTop: "0.2rem", color: "#1c1917", fontWeight: 600 }}>
                    {members.length}
                  </p>
                </div>
                {selectedClub.description && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "#a8a29e", fontWeight: 600 }}>
                      About
                    </p>
                    <p style={{ marginTop: "0.2rem", color: "#57534e", fontSize: "0.875rem" }}>
                      {selectedClub.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="table-toolbar-title">
            {selectedClub ? `${selectedClub.club_name} members` : "Club members"}
            <span className="table-toolbar-meta">· {searchedMembers.length} of {members.length}</span>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {selectedClubId && (
              <div className="auth-field-input" style={{ width: "16rem", maxWidth: "100%" }}>
                <span className="auth-field-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Search members…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
            {selectedClubId && (
              <button
                onClick={handleShowAddMember}
                className="btn-primary"
              >
                <span aria-hidden="true">+</span> Add Member
              </button>
            )}
          </div>
        </div>

        {/* Add Member Form */}
        {showAddMember && selectedClubId && (
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "linear-gradient(90deg, var(--color-brand-50) 0%, transparent 100%)",
              borderBottom: "1px solid #e7e5e4",
              display: "flex",
              gap: "0.75rem",
              alignItems: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <div>
              <label className="auth-field-label" style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.75rem" }}>Student</span>
              </label>
              <select
                value={newMemberUserId}
                onChange={(e) => setNewMemberUserId(e.target.value)}
                className="input-field"
                style={{ width: "16rem" }}
              >
                <option value="">Select a student…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.roll_number || s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="auth-field-label" style={{ marginBottom: "0.25rem" }}>
                <span style={{ fontSize: "0.75rem" }}>Position</span>
              </label>
              <select
                value={newMemberPosition}
                onChange={(e) => setNewMemberPosition(e.target.value)}
                className="input-field"
                style={{ width: "10rem" }}
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
              className="btn-primary"
            >
              {addingMember ? "Adding…" : "Add"}
            </button>
            <button
              onClick={() => setShowAddMember(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}

        {!selectedClubId ? (
          <TableEmpty icon="🏛️" title="No club selected" sub="Choose a club from the list above to manage its members." />
        ) : membersLoading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#78716c" }}>Loading members…</div>
        ) : searchedMembers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Email</th>
                  <th>Roll number</th>
                  <th>Designated role</th>
                  <th>Joined at</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchedMembers.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="cell-name">
                        <TableAvatar name={member.full_name} tone="accent" />
                        <div className="cell-name-text">
                          <span className="cell-name-primary">{member.full_name}</span>
                          <span className="cell-name-secondary">Member</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: "#57534e" }}>{member.email}</td>
                    <td>
                      <span className="cell-mono">{member.roll_number || "—"}</span>
                    </td>
                    <td>
                      <span className={`pill ${POSITION_PILL[member.position] || "pill-muted"}`}>
                        {member.position}
                      </span>
                    </td>
                    <td style={{ color: "#57534e", fontSize: "0.85rem" }}>{member.joined_at}</td>
                    <td>
                      <div className="cell-actions">
                        <ActionButton
                          tone="danger"
                          title="Remove member"
                          onClick={() => handleRemoveMember(member.id, member.full_name)}
                        >
                          <TrashIcon />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <TableEmpty
            icon="👥"
            title={search ? "No matches" : "No members yet"}
            sub={search ? "Try a different search term." : "Add the first member to this club."}
          />
        )}
      </div>
    </div>
  );
};

export default Clubs;
