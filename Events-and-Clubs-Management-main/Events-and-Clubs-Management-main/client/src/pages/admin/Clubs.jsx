import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { getClubs, getClubMembers, addClubMember, removeClubMember } from "../../api/clubs";
import { getAllUsers } from "../../api/users";
import { TableAvatar, ActionButton, TableEmpty } from "../../components/TableBits";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const POSITION_TONE = {
  President: "accent",
  "Vice President": "violet",
  Secretary: "info",
  Treasurer: "warning",
  "Event Manager": "brand",
  Member: "muted",
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
  const [removeTarget, setRemoveTarget] = useState(null);

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

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    const { id: memberId } = removeTarget;
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
    } finally {
      setRemoveTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading clubs…</span>
      </div>
    );
  }
  if (error && clubs.length === 0) return <InlineAlert type="error">{error}</InlineAlert>;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Clubs"
        title="Club management"
        subtitle={`${clubs.length} clubs on campus · ${selectedClub ? `${members.length} members in this club` : "Pick a club to manage its members."}`}
        actions={
          <Button variant="secondary" className="gap-1.5" nativeButton={false} render={<Link to="/admin/clubs/create" />}>
            <Plus className="size-4" /> Create club
          </Button>
        }
      />

      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      {/* Club selector card */}
      <Card className="p-5">
        <div className="mb-2 flex items-center justify-between">
          <Label>Select a club</Label>
          {selectedClub && <StatusBadge tone="accent">{selectedClub.is_council ? "Council" : "Club"}</StatusBadge>}
        </div>
        <Select
          value={selectedClubId}
          onValueChange={(value) => {
            setSelectedClubId(value);
            setShowAddMember(false);
            setSearch("");
          }}
        >
          <SelectTrigger className="h-10 w-full max-w-lg">
            <SelectValue placeholder="— Choose a club —">
              {() => (selectedClub ? `${selectedClub.club_name}${selectedClub.is_council ? " (Council)" : ""}` : "— Choose a club —")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clubs.map((club) => (
              <SelectItem key={club.id} value={String(club.id)}>
                {club.club_name}
                {club.is_council ? " (Council)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedClub && (
          <div className="mt-4 rounded-xl border p-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Faculty Coordinator</p>
                <p className="mt-0.5 font-medium text-foreground">{selectedClub.faculty_coordinator_name || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Type</p>
                <p className="mt-0.5">
                  <StatusBadge tone={selectedClub.is_council ? "violet" : "brand"}>
                    {selectedClub.is_council ? "Council" : "Club"}
                  </StatusBadge>
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">Members</p>
                <p className="mt-0.5 font-semibold text-foreground">{members.length}</p>
              </div>
              {selectedClub.description && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">About</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{selectedClub.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Members Table */}
      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            {selectedClub ? `${selectedClub.club_name} members` : "Club members"}{" "}
            <span className="font-normal text-muted-foreground">· {searchedMembers.length} of {members.length}</span>
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {selectedClubId && (
              <div className="relative w-64 max-w-full">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search members…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
            )}
            {selectedClubId && (
              <Button className="gap-1.5" onClick={handleShowAddMember}>
                <Plus className="size-4" /> Add member
              </Button>
            )}
          </div>
        </div>

        {/* Add Member Form */}
        {showAddMember && selectedClubId && (
          <div className="flex flex-wrap items-end gap-3 border-b bg-primary/5 px-4 py-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Student</Label>
              <Select value={newMemberUserId} onValueChange={setNewMemberUserId}>
                <SelectTrigger className="h-9 w-64">
                  <SelectValue placeholder="Select a student…">
                    {() => {
                      const s = students.find((st) => String(st.id) === newMemberUserId);
                      return s ? `${s.full_name} (${s.roll_number || s.email})` : "Select a student…";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.full_name} ({s.roll_number || s.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Position</Label>
              <Select value={newMemberPosition} onValueChange={setNewMemberPosition}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Event Manager">Event Manager</SelectItem>
                  <SelectItem value="President">President</SelectItem>
                  <SelectItem value="Vice President">Vice President</SelectItem>
                  <SelectItem value="Secretary">Secretary</SelectItem>
                  <SelectItem value="Treasurer">Treasurer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddMember} disabled={addingMember || !newMemberUserId}>
              {addingMember ? "Adding…" : "Add"}
            </Button>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>
              Cancel
            </Button>
          </div>
        )}

        {!selectedClubId ? (
          <TableEmpty title="No club selected" sub="Choose a club from the list above to manage its members." />
        ) : membersLoading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading members…
          </div>
        ) : searchedMembers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roll number</TableHead>
                <TableHead>Designated role</TableHead>
                <TableHead>Joined at</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchedMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TableAvatar name={member.full_name} tone="accent" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{member.full_name}</span>
                        <span className="text-xs text-muted-foreground">Member</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{member.roll_number || "—"}</code>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={POSITION_TONE[member.position] || "muted"}>{member.position}</StatusBadge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{member.joined_at}</TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <ActionButton
                        tone="danger"
                        title="Remove member"
                        onClick={() => setRemoveTarget(member)}
                      >
                        <Trash2 className="size-4" />
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <TableEmpty
            title={search ? "No matches" : "No members yet"}
            sub={search ? "Try a different search term." : "Add the first member to this club."}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove member?"
        description={removeTarget ? `Remove ${removeTarget.full_name} from this club? This can't be undone.` : ""}
        confirmLabel="Remove"
        onConfirm={handleRemoveMember}
      />
    </div>
  );
};

export default Clubs;
