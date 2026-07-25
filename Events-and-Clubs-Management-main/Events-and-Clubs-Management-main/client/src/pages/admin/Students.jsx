import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, GraduationCap, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
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

const BRANCHES = [
  { code: "BCT", label: "BCT - Computer", tone: "info" },
  { code: "BCE", label: "BCE - Civil", tone: "success" },
  { code: "BEE", label: "BEE - Electrical", tone: "warning" },
  { code: "BEI", label: "BEI - Electronics", tone: "violet" },
];

const BRANCH_ICON_CLASS = {
  info: "bg-sky-100 text-sky-600",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  violet: "bg-violet-100 text-violet-600",
};

const Students = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const selectedBranch = searchParams.get("branch");

  const branchInfo = BRANCHES.find((b) => b.code === selectedBranch);
  const filteredStudents = useMemo(
    () =>
      selectedBranch
        ? users.filter((u) => u.branch === selectedBranch)
        : users,
    [users, selectedBranch]
  );
  const searchedStudents = useMemo(() => {
    if (!search.trim()) return filteredStudents;
    const q = search.toLowerCase();
    return filteredStudents.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.roll_number || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [filteredStudents, search]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await getAllUsers();
        setUsers(res.data.filter((u) => u.user_type === "Student"));
      } catch {
        setError("Failed to load students.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id: userId, full_name: userName } = deleteTarget;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `Student "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete student." });
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

  if (selectedBranch && !branchInfo) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Students"
          title="Branch not found"
          subtitle="The selected branch is invalid. Please choose a branch from the list."
          actions={
            <Button variant="secondary" className="gap-1.5" onClick={() => navigate("/admin/students")}>
              <ArrowLeft className="size-4" /> Back to branches
            </Button>
          }
        />
      </div>
    );
  }

  // If no branch selected, show branch cards
  if (!selectedBranch) {
    const totalStudents = users.length;
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Students"
          title="Browse by branch"
          subtitle={`Pick a branch to view enrolled students. ${totalStudents} students on campus.`}
          actions={
            <Button variant="secondary" className="gap-1.5" nativeButton={false} render={<Link to="/admin/users/create" />}>
              <Plus className="size-4" /> Add new student
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BRANCHES.map((b) => {
            const count = users.filter((u) => u.branch === b.code).length;
            return (
              <Link key={b.code} to={`/admin/students?branch=${b.code}`}>
                <Card className="flex flex-col items-center gap-1.5 p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className={`flex size-11 items-center justify-center rounded-xl ${BRANCH_ICON_CLASS[b.tone] || "bg-primary/10 text-primary"}`}>
                    <GraduationCap className="size-5" />
                  </span>
                  <p className="mt-1 font-semibold text-foreground">{b.code}</p>
                  <p className="text-xs text-muted-foreground">{b.label.split(" - ")[1]}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{count}</p>
                  <StatusBadge tone={b.tone}>Students</StatusBadge>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Branch selected — show filtered student table
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={`Students · ${selectedBranch}`}
        title={`${branchInfo?.label || selectedBranch} students`}
        subtitle={`${filteredStudents.length} enrolled · ${searchedStudents.length} shown`}
        actions={
          <Button variant="secondary" className="gap-1.5" nativeButton={false} render={<Link to="/admin/users/create" />}>
            <Plus className="size-4" /> Add new student
          </Button>
        }
      />

      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/admin/students")}>
              <ArrowLeft className="size-4" /> Branches
            </Button>
            <span className="text-muted-foreground">·</span>
            <StatusBadge tone="info">{selectedBranch}</StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64 max-w-full">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name, roll, or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{searchedStudents.length} of {filteredStudents.length}</span>
          </div>
        </div>

        {searchedStudents.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Roll number</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchedStudents.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TableAvatar name={user.full_name} tone="brand" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.full_name}</span>
                        <span className="text-xs text-muted-foreground">Student</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{user.roll_number || "—"}</code>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <StatusBadge tone={branchInfo?.tone || "brand"}>{user.branch || "—"}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={user.is_active ? "success" : "muted"}>{user.is_active ? "Active" : "Inactive"}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <ActionButton title="Edit student" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                        <Pencil className="size-4" />
                      </ActionButton>
                      <ActionButton tone="danger" title="Delete student" onClick={() => setDeleteTarget(user)}>
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
            title={search ? "No matches" : "No students in this branch"}
            sub={search ? "Try a different search term." : "Add the first student to get started."}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete student?"
        description={deleteTarget ? `Delete student "${deleteTarget.full_name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Students;
