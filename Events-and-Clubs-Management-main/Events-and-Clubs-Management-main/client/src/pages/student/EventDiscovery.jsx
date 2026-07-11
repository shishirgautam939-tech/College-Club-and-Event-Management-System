import { useState, useEffect } from "react";
import { Calendar, Loader2, MapPin, Search, Users, Zap } from "lucide-react";
import { getApprovedEvents } from "../../api/events";
import { registerForEvent, unregisterFromEvent } from "../../api/participation";
import { formatDateTime } from "../../utils/formatDate";
import useAuth from "../../hooks/useAuth";
import EventQRModal from "../../components/EventQRModal";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EventDiscovery = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [actionInProgress, setActionInProgress] = useState(null);
  const [search, setSearch] = useState("");
  const [qrEvent, setQrEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await getApprovedEvents();
      setEvents(res.data);
    } catch {
      setError("Failed to load events.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await registerForEvent(eventId);
      setActionMsg({ type: "success", text: "You're registered. See you there!" });
      fetchEvents();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Registration failed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  const handleUnregister = async (eventId) => {
    setActionMsg({ type: "", text: "" });
    setActionInProgress(eventId);
    try {
      await unregisterFromEvent(eventId);
      setActionMsg({ type: "success", text: "Registration cancelled." });
      fetchEvents();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Unregister failed.",
      });
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading events…</span>
      </div>
    );
  }

  const filtered = events.filter(
    (ev) =>
      ev.title.toLowerCase().includes(search.toLowerCase()) ||
      (ev.club_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (ev.venue || "").toLowerCase().includes(search.toLowerCase()),
  );

  const isFull = (ev) => ev.spots_left === 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={<><Zap className="size-3.5" /> Discover</>}
        title="Find your next event"
        subtitle={`${events.length} approved event${events.length === 1 ? "" : "s"} on campus · register, attend, and earn certificates.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} event{filtered.length === 1 ? "" : "s"} matching your search
        </p>
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, club, or venue…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
      </div>

      {error && <InlineAlert type="error">{error}</InlineAlert>}
      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? "No events match your search." : "Nothing scheduled right now. Check back soon."}
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ev) => (
            <Card key={ev.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg leading-snug font-semibold text-foreground">{ev.title}</h3>
                {ev.is_registered && <StatusBadge tone="success">Joined</StatusBadge>}
              </div>

              <p className="mt-1.5 text-sm font-semibold text-primary">{ev.club_name}</p>

              {ev.description && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{ev.description}</p>
              )}

              <div className="mt-4 flex-1 space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <Calendar className="size-3.5 shrink-0" />
                  {formatDateTime(ev.event_date)}
                </p>
                {ev.venue && (
                  <p className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" />
                    {ev.venue}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Users className="size-3.5 shrink-0" />
                  <strong className="font-semibold text-foreground">{ev.registration_count}</strong>
                  {ev.max_participants ? ` / ${ev.max_participants}` : ""} registered
                  {isFull(ev) && (
                    <StatusBadge tone="danger" className="ml-1">
                      Full
                    </StatusBadge>
                  )}
                </p>
              </div>

              {user?.role === "Student" && (
                <div className="mt-4 border-t pt-4">
                  {ev.is_registered ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{ev.attendance_qr_active ? "QR ready for check-in" : "Preparing your QR…"}</span>
                        {ev.attendance_qr_active && <StatusBadge tone="success">Active</StatusBadge>}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={() => setQrEvent(ev)}
                          disabled={!ev.attendance_qr_active}
                          className="flex-1"
                        >
                          Show my QR
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleUnregister(ev.id)}
                          disabled={actionInProgress === ev.id}
                          className="text-destructive hover:text-destructive"
                        >
                          {actionInProgress === ev.id ? "…" : "Cancel"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleRegister(ev.id)}
                      disabled={actionInProgress === ev.id || isFull(ev)}
                      className="w-full"
                    >
                      {actionInProgress === ev.id ? "Processing…" : isFull(ev) ? "Event full" : "Register"}
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {qrEvent && (
        <EventQRModal
          event={qrEvent}
          onClose={() => setQrEvent(null)}
          onAfterClose={() => {
            setQrEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};

export default EventDiscovery;
