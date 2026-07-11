import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Pencil, Plus, Search, Trash2, UserCog } from "lucide-react";
import { getAllUsers, getDepartments, deleteUser } from "../../api/users";
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

const DEPT_TONE = ["info", "success", "warning", "violet", "accent"];

const matchesDepartment = (userDepartment, deptId) =>
  userDepartment === deptId || userDepartment?.id === deptId;

const Faculty = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const navigate = useNavigate();
  const selectedDept = searchParams.get("dept");
  const deptId = Number(selectedDept);
  const validDeptId = Number.isInteger(deptId) && deptId > 0 ? deptId : null;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          getAllUsers(),
          getDepartments(),
        ]);
        setUsers(usersRes.data.filter((u) => u.user_type === "Faculty"));
        setDepartments(deptsRes.data);
      } catch {
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { id: userId, full_name: userName } = deleteTarget;
    setActionMsg({ type: "", text: "" });
    try {
      await deleteUser(userId);
      setActionMsg({ type: "success", text: `Faculty "${userName}" deleted.` });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setActionMsg({ type: "error", text: err.response?.data?.detail || "Failed to delete." });
    } finally {
      setDeleteTarget(null);
    }
  };

  const deptInfo = departments.find((d) => d.id === validDeptId);
  const filteredFaculty = useMemo(
    () => users.filter((u) => matchesDepartment(u.department, validDeptId)),
    [users, validDeptId]
  );
  const searchedFaculty = useMemo(() => {
    if (!search.trim()) return filteredFaculty;
    const q = search.toLowerCase();
    return filteredFaculty.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
    );
  }, [filteredFaculty, search]);

  const deptIndex = departments.findIndex((d) => d.id === validDeptId);
  const deptTone = DEPT_TONE[(deptIndex >= 0 ? deptIndex : 0) % DEPT_TONE.length];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading…</span>
      </div>
    );
  }

  if (error) return <InlineAlert type="error">{error}</InlineAlert>;

  // No department selected — show department cards
  if (!selectedDept) {
    const totalFaculty = users.length;
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Faculty"
          title="Browse by department"
          subtitle={`Choose a department to see its faculty members. ${totalFaculty} faculty on campus.`}
          actions={
            <Button variant="secondary" className="gap-1.5" nativeButton={false} render={<Link to="/admin/users/create" />}>
              <Plus className="size-4" /> Add new faculty
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {departments.map((dept, idx) => {
            const count = users.filter((u) => matchesDepartment(u.department, dept.id)).length;
            const shortName = dept.department_name.replace("Department of ", "");
            return (
              <Link key={dept.id} to={`/admin/faculty?dept=${dept.id}`}>
                <Card className="flex flex-col items-center gap-1.5 p-6 text-center transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserCog className="size-5" />
                  </span>
                  <p className="mt-1 font-semibold text-foreground">{shortName}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">{count}</p>
                  <StatusBadge tone={DEPT_TONE[idx % DEPT_TONE.length]}>Faculty</StatusBadge>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  // Department selected — show faculty table
  if (!validDeptId) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader
          eyebrow="Faculty"
          title="Department not found"
          subtitle="The selected department is invalid. Please go back and choose a valid department."
          actions={
            <Button variant="secondary" className="gap-1.5" onClick={() => navigate("/admin/faculty")}>
              <ArrowLeft className="size-4" /> Back to departments
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={`Faculty · ${deptInfo?.department_name || "Department"}`}
        title={`${deptInfo?.department_name || "Department"} — Faculty`}
        subtitle={`${filteredFaculty.length} members · ${searchedFaculty.length} shown`}
        actions={
          <Button variant="secondary" className="gap-1.5" nativeButton={false} render={<Link to="/admin/users/create" />}>
            <Plus className="size-4" /> Add new faculty
          </Button>
        }
      />

      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      <Card className="gap-0 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate("/admin/faculty")}>
              <ArrowLeft className="size-4" /> Departments
            </Button>
            <span className="text-muted-foreground">·</span>
            <StatusBadge tone={deptTone}>{deptInfo?.department_name || "Department"}</StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64 max-w-full">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 pl-9"
              />
            </div>
            <span className="text-sm text-muted-foreground">{searchedFaculty.length} of {filteredFaculty.length}</span>
          </div>
        </div>

        {searchedFaculty.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Faculty member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {searchedFaculty.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <TableAvatar name={user.full_name} tone="violet" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.full_name}</span>
                        <span className="text-xs text-muted-foreground">Faculty</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <StatusBadge tone={deptTone}>{deptInfo?.department_name || "—"}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge tone={user.is_active ? "success" : "muted"}>{user.is_active ? "Active" : "Inactive"}</StatusBadge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <ActionButton title="Edit faculty" onClick={() => navigate(`/admin/users/${user.id}/edit`)}>
                        <Pencil className="size-4" />
                      </ActionButton>
                      <ActionButton tone="danger" title="Delete faculty" onClick={() => setDeleteTarget(user)}>
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
            title={search ? "No matches" : "No faculty in this department"}
            sub={search ? "Try a different search term." : "Add the first faculty member."}
          />
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete faculty?"
        description={deleteTarget ? `Delete faculty "${deleteTarget.full_name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Faculty;
