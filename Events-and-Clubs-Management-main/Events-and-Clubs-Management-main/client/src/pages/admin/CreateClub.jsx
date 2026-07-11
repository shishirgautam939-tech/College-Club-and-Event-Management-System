import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Building2 } from "lucide-react";
import { createClub } from "../../api/clubs";
import { getAllUsers } from "../../api/users";
import PageHeader from "@/components/PageHeader";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        eyebrow={<><Building2 className="size-3.5" /> New organization</>}
        title="Create a club"
        subtitle="Set up a new campus organization and assign a faculty coordinator."
      />

      <Card className="p-6">
        {error && <InlineAlert type="error" className="mb-4">{error}</InlineAlert>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="club_name">Club name</Label>
            <Input
              id="club_name"
              type="text"
              name="club_name"
              value={formData.club_name}
              onChange={handleChange}
              required
              placeholder="e.g. NCE IT Club"
              className="h-10"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Brief description of the club..."
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="faculty_coordinator">Faculty coordinator</Label>
            <Select
              value={formData.faculty_coordinator}
              onValueChange={(value) => setFormData({ ...formData, faculty_coordinator: value })}
            >
              <SelectTrigger id="faculty_coordinator" className="h-10 w-full">
                <SelectValue placeholder={fetchingFaculty ? "Loading…" : "— Select faculty —"}>
                  {() => {
                    const f = facultyList.find((fac) => String(fac.id) === formData.faculty_coordinator);
                    return f ? `${f.full_name} (${f.email})` : fetchingFaculty ? "Loading…" : "— Select faculty —";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {facultyList.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.full_name} ({f.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label htmlFor="is_council" className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Checkbox
              id="is_council"
              checked={formData.is_council}
              onCheckedChange={(checked) => setFormData({ ...formData, is_council: checked === true })}
            />
            This is a council (not a regular club)
          </label>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/admin/clubs")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create club"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default CreateClub;
