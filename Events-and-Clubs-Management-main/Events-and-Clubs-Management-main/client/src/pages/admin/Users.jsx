import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { getAllUsers, deleteUser } from "../../api/users";
import { TableAvatar, ActionButton, TableEmpty } from "../../components/TableBits";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import ConfirmDialog from "@/components/ConfirmDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ROLE_META = {
  Students: { tone: "brand", label: "Student" },
  Faculty:  { tone: "violet", label: "Faculty" },
  Staff:    { tone: "warning", label: "Staff" },
  Admins:   { tone: "accent", label: "Admin" },
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, [searchParams]);

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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id: userId, full_name: userName } = deleteTarget;
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
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (error) return <InlineAlert type="error">{error}</InlineAlert>;

  // Get filter from URL
  const filterType = searchParams.get("type");

  // Create groups for each user type
  const allGroups = {
    Students: users.filter((u) => u.user_type === "Student"),
    Faculty: users.filter((u) => u.user_type === "Faculty"),
    Staff: users.filter((u) => u.user_type === "Staff"),
    Admins: users.filter((u) => u.user_type === "Admin"),
  };

  // Determine which groups to show
  let userGroups = allGroups;
  if (filterType === "Student") userGroups = { Students: allGroups.Students };
  else if (filterType === "Faculty") userGroups = { Faculty: allGroups.Faculty };
  else if (filterType === "Staff") userGroups = { Staff: allGroups.Staff };
  else if (filterType === "Admin") userGroups = { Admins: allGroups.Admins };

  const applySearch = (group) => {
    if (!search.trim()) return group;
    const q = search.toLowerCase();
    return group.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.roll_number || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.branch || "").toLowerCase().includes(q)
    );
  };

  const totalShown = Object.values(userGroups).reduce(
    (sum, g) => sum + applySearch(g).length,
    0
  );
  const totalAll = users.length;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="User management"
        title={filterType ? `${filterType} management` : "All users"}
        subtitle={`${totalShown} of ${totalAll} users shown`}
        actions={
          <Button variant="secondary" className="gap-1.5" nativeButton={false} render={<Link to="/admin/users/create" />}>
            <Plus className="size-4" /> Add new user
          </Button>
        }
      />

      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <span className="text-sm font-semibold text-foreground">
            All users <span className="font-normal text-muted-foreground">· search across roles</span>
          </span>
          <div className="relative w-80 max-w-full">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, roll, email, branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        </div>

        {Object.keys(userGroups).length === 0 ? (
          <TableEmpty title="No users found" sub="Try a different search." />
        ) : (
          <div className="p-4">
            {Object.entries(userGroups).map(([groupName, groupUsers]) => {
              const visible = applySearch(groupUsers);
              const meta = ROLE_META[groupName] || ROLE_META.Students;
              return (
                <section key={groupName} className="mb-6 last:mb-0">
                  <div className="mb-3 flex items-center gap-2.5">
                    <h3 className="text-sm font-semibold text-foreground">{groupName}</h3>
                    <StatusBadge tone={meta.tone}>{visible.length}</StatusBadge>
                  </div>
                  {visible.length > 0 ? (
                    <div className="overflow-x-auto rounded-xl border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            {groupName === "Students" && <TableHead>Roll Number</TableHead>}
                            {groupName === "Students" && <TableHead>Branch</TableHead>}
                            {groupName === "Faculty" && <TableHead>Department</TableHead>}
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {visible.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <TableAvatar name={user.full_name} tone={meta.tone} />
                                  <div className="flex flex-col">
                                    <span className="font-medium text-foreground">{user.full_name}</span>
                                    <span className="text-xs text-muted-foreground">{meta.label}</span>
                                  </div>
                                </div>
                              </TableCell>
                              {groupName === "Students" && (
                                <TableCell>
                                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{user.roll_number || "—"}</code>
                                </TableCell>
                              )}
                              {groupName === "Students" && (
                                <TableCell>
                                  <StatusBadge tone="info">{user.branch || "—"}</StatusBadge>
                                </TableCell>
                              )}
                              {groupName === "Faculty" && (
                                <TableCell>
                                  <StatusBadge tone="violet">{user.department_name || "—"}</StatusBadge>
                                </TableCell>
                              )}
                              <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              <TableCell>
                                <StatusBadge tone={user.is_active ? "success" : "muted"}>
                                  {user.is_active ? "Active" : "Inactive"}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-1">
                                  <ActionButton title="Edit user" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                                    <Pencil className="size-4" />
                                  </ActionButton>
                                  <ActionButton tone="danger" title="Delete user" onClick={() => setDeleteTarget(user)}>
                                    <Trash2 className="size-4" />
                                  </ActionButton>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No matches in this group.</p>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete user?"
        description={deleteTarget ? `Delete user "${deleteTarget.full_name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Users;
