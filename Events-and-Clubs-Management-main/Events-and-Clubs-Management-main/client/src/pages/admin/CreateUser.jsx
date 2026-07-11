import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { createUser, getDepartments } from "../../api/users";
import PageHeader from "@/components/PageHeader";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

const CreateUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    user_type: "Student",
    roll_number: "",
    branch: "",
    department: "",
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const setField = (name, value) => setFormData({ ...formData, [name]: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = { ...formData };
      // Only send roll_number and branch for students
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      }
      // Only send department for Faculty
      if (payload.user_type !== "Faculty") {
        delete payload.department;
      }
      if (payload.department === "") {
        delete payload.department;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      if (payload.branch === "") {
        delete payload.branch;
      }
      await createUser(payload);
      // Redirect based on user type
      if (payload.user_type === "Student") navigate("/admin/students");
      else if (payload.user_type === "Faculty") navigate("/admin/faculty");
      else navigate("/admin");
    } catch (err) {
      console.error("Failed to create user", err);
      const detail = err.response?.data?.detail
        || err.response?.data?.roll_number?.[0]
        || err.response?.data?.email?.[0]
        || "Failed to create user.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        eyebrow={<><UserPlus className="size-3.5" /> New account</>}
        title="Add a user"
        subtitle="Create a new student, faculty, staff, or admin account."
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
              <Select value={formData.department} onValueChange={(value) => setField("department", value)}>
                <SelectTrigger id="department" className="h-10 w-full">
                  <SelectValue placeholder="Select department">
                    {() => departments.find((d) => String(d.id) === formData.department)?.department_name ?? "Select department"}
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
              className="h-10"
            />
          </div>

          {/* Conditional Field for Students */}
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

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create user"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateUser;
