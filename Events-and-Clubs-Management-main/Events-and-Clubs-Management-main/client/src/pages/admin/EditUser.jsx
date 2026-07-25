import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, PencilLine } from "lucide-react";
import { getAllUsers, updateUser, getDepartments } from "../../api/users";
import PageHeader from "@/components/PageHeader";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BRANCHES = [
  { value: "BCT", label: "BCT - Computer" },
  { value: "BCE", label: "BCE - Civil" },
  { value: "BEE", label: "BEE - Electrical" },
  { value: "BEI", label: "BEI - Electronics" },
];

const EditUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    user_type: "",
    roll_number: "",
    branch: "",
    department: "",
    is_active: true,
    password: "",
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, deptsRes] = await Promise.all([
          getAllUsers(),
          getDepartments(),
        ]);
        setDepartments(deptsRes.data);
        const user = usersRes.data.find((u) => u.id === parseInt(id));
        if (!user) {
          setError("User not found.");
          setLoading(false);
          return;
        }
        setFormData({
          full_name: user.full_name,
          email: user.email,
          user_type: user.user_type,
          roll_number: user.roll_number || "",
          branch: user.branch || "",
          department: user.department || "",
          is_active: user.is_active,
          password: "",
        });
      } catch {
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const setField = (name, value) => setFormData({ ...formData, [name]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      }
      // Only send department for Faculty
      if (payload.user_type !== "Faculty") {
        payload.department = null;
      }
      if (payload.department === "") {
        payload.department = null;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      // Handle branch
      if (payload.branch === "") {
        payload.branch = null;
      }

      await updateUser(id, payload);
      // Redirect based on user type
      if (payload.user_type === "Student") navigate("/admin/students");
      else if (payload.user_type === "Faculty") navigate("/admin/faculty");
      else navigate("/admin");
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(" ");
        setError(messages || "Failed to update user.");
      } else {
        setError("Failed to update user.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading user…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        eyebrow={<><PencilLine className="size-3.5" /> Editing account</>}
        title="Edit user"
        subtitle="Update account details and access."
      />

      <Card className="p-6">
        {error && <InlineAlert type="error" className="mb-4">{error}</InlineAlert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user_type">User type</Label>
            <Select value={formData.user_type} onValueChange={(value) => setField("user_type", value)}>
              <SelectTrigger id="user_type" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">Student</SelectItem>
                <SelectItem value="Faculty">Faculty</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Branch dropdown for Students */}
          {formData.user_type === "Student" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branch">Branch</Label>
              <Select value={formData.branch} onValueChange={(value) => setField("branch", value)}>
                <SelectTrigger id="branch" className="h-10 w-full">
                  <SelectValue placeholder="Select branch">
                    {() => BRANCHES.find((b) => b.value === formData.branch)?.label ?? "Select branch"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {BRANCHES.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Department dropdown for Faculty */}
          {formData.user_type === "Faculty" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="department">Department</Label>
              <Select value={String(formData.department)} onValueChange={(value) => setField("department", value)}>
                <SelectTrigger id="department" className="h-10 w-full">
                  <SelectValue placeholder="Select department">
                    {() => departments.find((d) => String(d.id) === String(formData.department))?.department_name ?? "Select department"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={String(dept.id)}>
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input
              id="full_name"
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              autoComplete="name"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">
              New password <span className="font-normal text-muted-foreground">(leave blank to keep current)</span>
            </Label>
            <Input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              className="h-10"
            />
          </div>

          {formData.user_type === "Student" && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="roll_number">Roll number</Label>
              <Input
                id="roll_number"
                type="text"
                name="roll_number"
                value={formData.roll_number}
                onChange={handleChange}
                placeholder="Format: NCE123ABC456"
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Must be in format: NCE + 3 digits + 3 letters + 3 digits</p>
            </div>
          )}

          <label htmlFor="is_active" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setField("is_active", checked === true)}
            />
            Active
          </label>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default EditUser;
