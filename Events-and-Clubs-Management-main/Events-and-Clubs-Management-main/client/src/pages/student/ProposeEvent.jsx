import { useState, useEffect, useMemo } from "react";
import { Loader2, PencilLine, Wallet } from "lucide-react";
import { getMyClubs, proposeEvent } from "../../api/events";
import PageHeader from "@/components/PageHeader";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Format a Date as the value attribute expected by
// <input type="datetime-local" />: "YYYY-MM-DDTHH:mm" in local time.
function toDatetimeLocalValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "T" +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes())
  );
}

const ProposeEvent = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    club: "",
    title: "",
    description: "",
    venue: "",
    max_participants: "",
    event_date: "",
    payment_required: false,
    fee: "",
  });

  // The earliest moment the user is allowed to schedule an event for:
  // right now. Used as `min` on the datetime-local input so the browser
  // blocks past dates in the picker itself.
  const minDatetime = useMemo(() => toDatetimeLocalValue(new Date()), []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await getMyClubs();
      setClubs(res.data);
    } catch {
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    // Defensive date check: the browser's `min` attribute is bypassable
    // (older browsers, manual edits), so re-validate the value here
    // before sending the request. `datetime-local` values are
    // timezone-naive local time.
    if (!form.event_date) {
      setError("Please pick an event date and time.");
      setSubmitting(false);
      return;
    }
    const submittedAt = new Date(form.event_date);
    if (Number.isNaN(submittedAt.getTime())) {
      setError("That event date doesn't look valid. Please pick it again.");
      setSubmitting(false);
      return;
    }
    if (submittedAt.getTime() <= Date.now()) {
      setError("Event date must be in the future. Please pick a later date and time.");
      setSubmitting(false);
      return;
    }

    // Paid events need a Khalti-acceptable fee (minimum NPR 10).
    const feeValue = Number(form.fee);
    if (form.payment_required && (!form.fee || Number.isNaN(feeValue) || feeValue < 10)) {
      setError("A paid event needs a fee of at least NPR 10.");
      setSubmitting(false);
      return;
    }

    try {
      await proposeEvent({
        club: parseInt(form.club),
        title: form.title,
        description: form.description,
        venue: form.venue,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        event_date: form.event_date,
        payment_required: form.payment_required,
        fee: form.payment_required ? feeValue : 0,
      });
      setSuccess("Event proposed successfully! It is now pending review.");
      setForm({
        club: "",
        title: "",
        description: "",
        venue: "",
        max_participants: "",
        event_date: "",
        payment_required: false,
        fee: "",
      });
    } catch (err) {
      const data = err.response?.data;
      // Surface the most specific field error we can find. The
      // backend uses DRF, which can return either a top-level
      // `detail`, an array under a field name (e.g. `event_date: [...]`),
      // or a non_field_errors array.
      let message =
        (Array.isArray(data?.event_date) && data.event_date[0]) ||
        data?.event_date ||
        data?.title?.[0] ||
        data?.club?.[0] ||
        data?.fee?.[0] ||
        data?.non_field_errors?.[0] ||
        data?.detail ||
        "Failed to propose event.";
      if (typeof message !== "string") {
        message = "Failed to propose event.";
      }
      if (!err.response) {
        message = "Cannot reach the server. Please check your connection and try again.";
      }
      setError(message);
    } finally {
      setSubmitting(false);
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <PageHeader
        eyebrow={<><PencilLine className="size-3.5" /> New proposal</>}
        title="Propose an event"
        subtitle="Submit a proposal for your club to run. Faculty will review and approve it before it goes live."
      />

      {clubs.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="font-semibold text-foreground">No clubs to propose for</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You are not an Event Manager in any club. Only Event Managers can propose events.
          </p>
        </Card>
      ) : (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <InlineAlert type="error">{error}</InlineAlert>}
            {success && <InlineAlert type="success">{success}</InlineAlert>}

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="club">Club</Label>
              <Select value={form.club} onValueChange={(value) => setForm({ ...form, club: value })}>
                <SelectTrigger id="club" className="h-10 w-full">
                  <SelectValue placeholder="Select a club">
                    {() => {
                      const c = clubs.find((club) => String(club.club_id) === form.club);
                      return c ? `${c.club_name} (${c.position})` : "Select a club";
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((c) => (
                    <SelectItem key={c.club_id} value={String(c.club_id)}>
                      {c.club_name} ({c.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Event title</Label>
              <Input
                id="title"
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="e.g. Annual Tech Fest 2026"
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="Brief description of the event..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  type="text"
                  name="venue"
                  value={form.venue}
                  onChange={handleChange}
                  placeholder="e.g. Main Auditorium, Block A"
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="max_participants">
                  Max participants <span className="font-normal text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="max_participants"
                  type="number"
                  name="max_participants"
                  value={form.max_participants}
                  onChange={handleChange}
                  min="1"
                  placeholder="Leave blank for unlimited"
                  className="h-10"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="event_date">Event date</Label>
              <Input
                id="event_date"
                type="datetime-local"
                name="event_date"
                value={form.event_date}
                onChange={handleChange}
                required
                min={minDatetime}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">Must be a future date and time.</p>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={form.payment_required}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, payment_required: Boolean(checked) })
                  }
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                    <Wallet className="size-4" /> Make this a paid event
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Students pay the fee via Khalti before their registration is confirmed.
                  </span>
                </span>
              </label>

              {form.payment_required && (
                <div className="flex flex-col gap-1.5 pl-7">
                  <Label htmlFor="fee">Registration fee (NPR)</Label>
                  <Input
                    id="fee"
                    type="number"
                    name="fee"
                    value={form.fee}
                    onChange={handleChange}
                    min="10"
                    step="1"
                    required
                    placeholder="e.g. 100"
                    className="h-10 max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum NPR 10. The faculty reviewer can adjust this before approval.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end border-t pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Propose event"}
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
};

export default ProposeEvent;
