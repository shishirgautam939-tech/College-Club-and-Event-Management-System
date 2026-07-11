import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, ClipboardCheck, Eye, Loader2, Search, X } from "lucide-react";
import {
  getFacultyProposedEvents,
  reviewEvent,
  getAllEvents,
  completeEvent,
} from "../../api/events";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { TableAvatar, ActionButton, TableEmpty } from "../../components/TableBits";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const STATUS_TONE = {
  Proposed: "warning",
  Approved: "info",
  Rejected: "danger",
  Completed: "success",
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "pending";
  const [tab, setTab] = useState(initialTab); // pending | approved | all
  const [pendingEvents, setPendingEvents] = useState([]);
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const switchTab = (t) => {
    setTab(t);
    setSearchParams({ tab: t });
    setSearch("");
  };

  useEffect(() => {
    fetchData();
    // Load the approved list up front too — the header count and tab badge
    // read from it, and lazily fetching it only when the Approved tab was
    // opened made the page report "0 approved" on first load.
    fetchApprovedEvents();
  }, []);

  useEffect(() => {
    if (tab === "all") fetchAllEvents();
    if (tab === "approved") fetchApprovedEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, statusFilter]);

  const fetchData = async () => {
    try {
      const res = await getFacultyProposedEvents();
      setPendingEvents(res.data);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const fetchApprovedEvents = async () => {
    try {
      const res = await getAllEvents("Approved");
      setApprovedEvents(res.data);
    } catch {
      setError("Failed to load approved events.");
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await getAllEvents(statusFilter || undefined);
      setAllEvents(res.data);
    } catch {
      setError("Failed to load events.");
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
      fetchData();
      fetchApprovedEvents();
      if (tab === "all") fetchAllEvents();
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
      fetchData();
      fetchApprovedEvents();
      fetchAllEvents();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Action failed.");
    }
  };

  const filterEvents = (list) => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.club_name || "").toLowerCase().includes(q) ||
        (e.created_by_name || "").toLowerCase().includes(q) ||
        (e.venue || "").toLowerCase().includes(q)
    );
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
        eyebrow="Events"
        title="Event management"
        subtitle={`${pendingEvents.length} pending · ${approvedEvents.length} approved · review proposals and run events end to end.`}
      />

      {error && <InlineAlert type="error">{error}</InlineAlert>}
      {actionSuccess && <InlineAlert type="success">{actionSuccess}</InlineAlert>}
      {actionError && <InlineAlert type="error">{actionError}</InlineAlert>}

      <Tabs value={tab} onValueChange={switchTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            Pending review
            <StatusBadge tone="muted">{pendingEvents.length}</StatusBadge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="all">All events</TabsTrigger>
        </TabsList>

        {/* Pending review */}
        <TabsContent value="pending" className="mt-4 flex flex-col gap-4">
          {pendingEvents.length === 0 ? (
            <Card className="p-0">
              <TableEmpty title="No pending proposals" sub="You're all caught up — every event proposal has been reviewed." />
            </Card>
          ) : (
            pendingEvents.map((ev) => (
              <Card key={ev.id} className="p-6">
                <div className="flex items-start gap-4">
                  <TableAvatar name={ev.title} tone="amber" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground">{ev.title}</h3>
                      <StatusBadge tone="warning">{ev.status}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <strong className="font-medium text-foreground">Club:</strong> {ev.club_name} &nbsp;·&nbsp;
                      <strong className="font-medium text-foreground">Proposed by:</strong> {ev.created_by_name} &nbsp;·&nbsp;
                      <strong className="font-medium text-foreground">Date:</strong> {formatDate(ev.event_date)}
                    </p>
                    {ev.description && <p className="mt-2 text-sm text-muted-foreground">{ev.description}</p>}
                  </div>
                </div>

                {reviewingId === ev.id ? (
                  <div className="mt-4 flex flex-col gap-3 border-t pt-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Remarks (optional)</Label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={2}
                        placeholder="Add remarks for the faculty…"
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

        {/* Approved */}
        <TabsContent value="approved" className="mt-4">
          <Card className="gap-0 p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Approved &amp; upcoming{" "}
                <span className="font-normal text-muted-foreground">
                  · {filterEvents(approvedEvents).length} of {approvedEvents.length}
                </span>
              </span>
              <div className="relative w-64 max-w-full">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search title, club, venue…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9"
                />
              </div>
            </div>
            {approvedEvents.length === 0 ? (
              <TableEmpty title="No approved events" sub="Approve a pending proposal to see it here." />
            ) : filterEvents(approvedEvents).length === 0 ? (
              <TableEmpty title="No matches" sub="Try a different search term." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterEvents(approvedEvents).map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={ev.title} tone="sky" />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{ev.title}</span>
                            <span className="text-xs text-muted-foreground">Approved</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{ev.club_name}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(ev.event_date)}</TableCell>
                      <TableCell className="text-muted-foreground">{ev.venue || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{ev.created_by_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 hover:text-emerald-700" onClick={() => handleComplete(ev.id)}>
                            <Check className="size-3.5" /> Complete
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/admin/events/${ev.id}/attendance`)}>
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

        {/* All events */}
        <TabsContent value="all" className="mt-4">
          <Card className="gap-0 p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                All events <span className="font-normal text-muted-foreground">· {filterEvents(allEvents).length} of {allEvents.length}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value === "__all__" ? "" : value)}>
                  <SelectTrigger className="h-9 w-40">
                    <SelectValue placeholder="All statuses">
                      {() => (statusFilter || "All statuses")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All statuses</SelectItem>
                    <SelectItem value="Proposed">Proposed</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative w-64 max-w-full">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search title, club, venue…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9"
                  />
                </div>
              </div>
            </div>

            {allEvents.length === 0 ? (
              <TableEmpty title="No events found" sub="Try a different filter." />
            ) : filterEvents(allEvents).length === 0 ? (
              <TableEmpty title="No matches" sub="Try a different search or filter." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterEvents(allEvents).map((ev) => {
                    const tone =
                      ev.status === "Approved" ? "sky"
                      : ev.status === "Completed" ? "brand"
                      : ev.status === "Rejected" ? "muted"
                      : "amber";
                    return (
                      <TableRow key={ev.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <TableAvatar name={ev.title} tone={tone} />
                            <div className="flex flex-col">
                              <span className="font-medium text-foreground">{ev.title}</span>
                              <span className="text-xs text-muted-foreground">{ev.venue || "Venue TBA"}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{ev.club_name}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDateTime(ev.event_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{ev.created_by_name}</TableCell>
                        <TableCell>
                          <StatusBadge tone={STATUS_TONE[ev.status] || "muted"}>{ev.status}</StatusBadge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {ev.status === "Approved" && (
                              <>
                                <Button size="sm" variant="outline" className="gap-1.5 text-emerald-700 hover:text-emerald-700" onClick={() => handleComplete(ev.id)}>
                                  <Check className="size-3.5" /> Complete
                                </Button>
                                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/admin/events/${ev.id}/attendance`)}>
                                  <ClipboardCheck className="size-3.5" /> Attendance
                                </Button>
                              </>
                            )}
                            {ev.status === "Completed" && (
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => navigate(`/admin/events/${ev.id}/attendance`)}>
                                <Eye className="size-3.5" /> View attendance
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminEvents;
