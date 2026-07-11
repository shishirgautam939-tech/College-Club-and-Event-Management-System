import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ClipboardCheck, Eye, Loader2, X } from "lucide-react";
import {
  getFacultyProposedEvents,
  reviewEvent,
  getAllEvents,
  completeEvent,
} from "../../api/events";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmpty } from "@/components/TableBits";

const FacultyEvents = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("pending");
  const [events, setEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (tab === "approved") fetchApproved();
  }, [tab]);

  const fetchEvents = async () => {
    try {
      const res = await getFacultyProposedEvents();
      setEvents(res.data);
    } catch {
      setError("Failed to load proposed events.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApproved = async () => {
    try {
      const res = await getAllEvents("Approved");
      setApprovedEvents(res.data);
    } catch {
      // Faculty may not have access to all events, fallback silently
    }
  };

  const handleReview = async (eventId, decision) => {
    setActionError("");
    setActionSuccess("");
    try {
      await reviewEvent(eventId, { decision, remarks });
      setActionSuccess(`Event ${decision.toLowerCase()} successfully.`);
      setReviewingId(null);
      setRemarks("");
      fetchEvents();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  const handleComplete = async (eventId) => {
    setActionError("");
    setActionSuccess("");
    try {
      await completeEvent(eventId);
      setActionSuccess("Event marked as completed.");
      fetchApproved();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
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
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={<><ClipboardCheck className="size-3.5" /> Approvals</>}
        title="Faculty reviews"
        subtitle="Review pending event proposals and complete approved events."
      />

      {error && <InlineAlert type="error">{error}</InlineAlert>}
      {actionSuccess && <InlineAlert type="success">{actionSuccess}</InlineAlert>}
      {actionError && <InlineAlert type="error">{actionError}</InlineAlert>}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            Pending review
            <StatusBadge tone="muted">{events.length}</StatusBadge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved events</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4 flex flex-col gap-4">
          {events.length === 0 ? (
            <Card className="p-10 text-center">
              <p className="text-sm text-muted-foreground">No pending event proposals.</p>
            </Card>
          ) : (
            events.map((ev) => (
              <Card key={ev.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">{ev.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong className="font-medium text-foreground">Club:</strong> {ev.club_name} &nbsp;·&nbsp;
                      <strong className="font-medium text-foreground">Proposed by:</strong> {ev.created_by_name} &nbsp;·&nbsp;
                      <strong className="font-medium text-foreground">Event date:</strong> {formatDate(ev.event_date)}
                    </p>
                    {ev.description && <p className="mt-2 text-sm text-muted-foreground">{ev.description}</p>}
                  </div>
                  <StatusBadge tone="warning">{ev.status}</StatusBadge>
                </div>

                {reviewingId === ev.id ? (
                  <div className="mt-4 flex flex-col gap-3 border-t pt-4">
                    <div className="flex flex-col gap-1.5">
                      <Label htmlFor={`remarks-${ev.id}`}>Remarks (optional)</Label>
                      <Textarea
                        id={`remarks-${ev.id}`}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={2}
                        placeholder="Add remarks…"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleReview(ev.id, "Approved")} className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700">
                        <Check className="size-4" /> Approve
                      </Button>
                      <Button onClick={() => handleReview(ev.id, "Rejected")} variant="destructive" className="gap-1.5">
                        <X className="size-4" /> Reject
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setReviewingId(null);
                          setRemarks("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button onClick={() => setReviewingId(ev.id)} className="gap-1.5">
                      <Eye className="size-4" /> Review
                    </Button>
                    <Button
                      onClick={() => handleReview(ev.id, "Approved")}
                      variant="outline"
                      className="gap-1.5 text-emerald-700 hover:text-emerald-700"
                    >
                      <Check className="size-4" /> Quick approve
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          <Card className="gap-0 overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Approved &amp; upcoming <span className="font-normal text-muted-foreground">· {approvedEvents.length} events</span>
              </span>
            </div>
            {approvedEvents.length === 0 ? (
              <TableEmpty title="No approved events" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedEvents.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="font-medium text-foreground">{ev.title}</TableCell>
                      <TableCell className="text-muted-foreground">{ev.club_name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(ev.event_date)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 hover:text-emerald-700" onClick={() => handleComplete(ev.id)}>
                            <Check className="size-3.5" /> Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            onClick={() => navigate(`/admin/events/${ev.id}/attendance`)}
                          >
                            <ClipboardCheck className="size-3.5" /> Attendance
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacultyEvents;
