import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Check, Loader2, Search, Ticket, Users, X } from "lucide-react";
import {
  getEventAttendance,
  markAttendance,
  getEventQRAttendance,
  activateEventQR,
  deactivateEventQR,
  generateEventCertificates,
} from "../../api/participation";
import { completeEvent } from "../../api/events";
import { TableAvatar, TableEmpty } from "../../components/TableBits";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EventAttendance = () => {
  const { eventId } = useParams();
  const [activeTab, setActiveTab] = useState("manual");
  const [eventInfo, setEventInfo] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getEventAttendance(eventId);
      const nextParticipants = Array.isArray(res.data.participants) ? res.data.participants : [];
      setEventInfo({
        event_id: res.data.event_id,
        event_title: res.data.event_title,
        event_status: res.data.event_status,
      });
      setParticipants(
        nextParticipants.map((p) => ({
          ...p,
          present: p.present ?? false,
        })),
      );
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load attendance data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchQR = async () => {
    setQrLoading(true);
    try {
      const res = await getEventQRAttendance(eventId);
      setQrData(res.data);
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not load QR attendance.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "qr") {
      fetchQR();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, eventId]);

  useEffect(() => {
    if (activeTab !== "qr" || eventInfo?.event_status !== "Approved") return;
    if (qrLoading || qrData?.qr_active) return;
    handleActivateQR();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, eventInfo?.event_status, qrData?.qr_active, qrLoading]);

  const filteredParticipants = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return participants;

    return participants.filter((participant) => {
      const haystack = [
        participant.user_name,
        participant.user_email,
        participant.roll_number,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [participants, search]);

  const togglePresent = (userId) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.user_id === userId ? { ...p, present: !p.present } : p,
      ),
    );
  };

  const markAllPresent = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, present: true })));
  };

  const markAllAbsent = () => {
    setParticipants((prev) => prev.map((p) => ({ ...p, present: false })));
  };

  const handleSave = async () => {
    setActionMsg({ type: "", text: "" });
    setSaving(true);
    try {
      const attendanceData = participants.map((p) => ({
        user_id: p.user_id,
        present: p.present,
      }));
      const res = await markAttendance(eventId, attendanceData);
      setActionMsg({ type: "success", text: res.data.detail });
      fetchAttendance();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Failed to save attendance.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivateQR = async () => {
    setActionMsg({ type: "", text: "" });
    setQrLoading(true);
    try {
      const res = await activateEventQR(eventId);
      setQrData(res.data);
      setActionMsg({ type: "success", text: "QR check-in is now live for students." });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not activate QR attendance.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleDeactivateQR = async () => {
    setQrLoading(true);
    try {
      await deactivateEventQR(eventId);
      await fetchQR();
      setActionMsg({ type: "success", text: "QR check-in has been turned off." });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not deactivate QR attendance.",
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleCompleteEvent = async () => {
    setActionMsg({ type: "", text: "" });
    try {
      const res = await completeEvent(eventId);
      setActionMsg({
        type: "success",
        text: `${res.data.detail} ${res.data.certificates_issued || 0} certificate(s) issued.`,
      });
      fetchAttendance();
      if (activeTab === "qr") fetchQR();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not complete event.",
      });
    }
  };

  const handleGenerateCertificates = async () => {
    setActionMsg({ type: "", text: "" });
    try {
      const res = await generateEventCertificates(eventId);
      setActionMsg({ type: "success", text: res.data.detail });
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err.response?.data?.detail || "Could not generate certificates.",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading attendance…</span>
      </div>
    );
  }

  if (error) {
    return <InlineAlert type="error">{error}</InlineAlert>;
  }

  const presentCount = participants.filter((p) => p.present).length;
  const presentPct = participants.length > 0
    ? Math.round((presentCount / participants.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={`Attendance · ${eventInfo?.event_status}`}
        title={eventInfo?.event_title}
        subtitle={`${presentCount} of ${participants.length} marked present · ${presentPct}% attendance`}
        actions={
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              <Check className="size-3.5" /> <strong>{presentCount}</strong> present
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              <Users className="size-3.5" /> <strong>{participants.length}</strong> registered
            </span>
          </>
        }
      />

      {actionMsg.text && <InlineAlert type={actionMsg.type}>{actionMsg.text}</InlineAlert>}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="manual">Manual list</TabsTrigger>
          <TabsTrigger value="qr">QR check-in</TabsTrigger>
        </TabsList>

        {eventInfo?.event_status === "Approved" && (
          <Card className="mt-4 flex flex-row flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted-foreground">
              When the event ends, mark it complete to issue certificates to attendees.
            </p>
            <Button onClick={handleCompleteEvent}>Complete event &amp; issue certificates</Button>
          </Card>
        )}

        {eventInfo?.event_status === "Completed" && (
          <Card className="mt-4 flex flex-row flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-muted-foreground">Regenerate certificates for all present attendees if needed.</p>
            <Button variant="outline" onClick={handleGenerateCertificates}>Regenerate certificates</Button>
          </Card>
        )}

        <TabsContent value="manual" className="mt-4">
          <Card className="gap-0 p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                Attendees <span className="font-normal text-muted-foreground">· {filteredParticipants.length} of {participants.length}</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-56 max-w-full">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search name, roll, email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9 pl-9"
                  />
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-1.5 text-emerald-700 hover:text-emerald-700" onClick={markAllPresent}>
                  <Check className="size-3.5" /> Mark all present
                </Button>
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={markAllAbsent}>
                  <X className="size-3.5" /> Mark all absent
                </Button>
                <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save attendance"}
                </Button>
              </div>
            </div>

            {participants.length === 0 ? (
              <TableEmpty icon={<Ticket className="size-5" />} title="No registrations yet" sub="Students will appear here once they register for the event." />
            ) : filteredParticipants.length === 0 ? (
              <TableEmpty title="No matches" sub="Try a different search term." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll no.</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((p, idx) => (
                    <TableRow key={p.user_id} className={p.present ? "bg-emerald-50/60" : undefined}>
                      <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <TableAvatar name={p.user_name} tone={p.present ? "brand" : "muted"} />
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{p.user_name}</span>
                            <span className="text-xs text-muted-foreground">{p.present ? "Present" : "Not yet checked in"}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{p.roll_number || "—"}</code>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.user_email}</TableCell>
                      <TableCell className="text-center">
                        <label className="inline-flex cursor-pointer items-center gap-2">
                          <Checkbox checked={p.present} onCheckedChange={() => togglePresent(p.user_id)} />
                          <StatusBadge tone={p.present ? "success" : "muted"}>{p.present ? "Present" : "Absent"}</StatusBadge>
                        </label>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="mt-4 grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Display this at the venue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Students scan the code with their phone to check in. Only registered students can verify.
            </p>

            {qrLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading QR...
              </div>
            ) : qrData?.qr_active && qrData?.qr_image_base64 ? (
              <div className="mt-4 flex flex-col items-center gap-4">
                <img
                  src={`data:image/png;base64,${qrData.qr_image_base64}`}
                  alt="Event attendance QR code"
                  className="size-64 rounded-xl border bg-white p-3"
                />
                <p className="text-xs text-muted-foreground">
                  Expires: {qrData.expires_at ? new Date(qrData.expires_at).toLocaleString() : "—"}
                </p>
                <Button variant="outline" onClick={handleDeactivateQR}>
                  Turn off QR check-in
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-col items-center gap-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">QR check-in is not active yet.</p>
                <Button onClick={handleActivateQR}>Start QR check-in</Button>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-foreground">How it works</h2>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>Start QR check-in when the event begins.</li>
              <li>Display the code on a screen or print it at the entrance.</li>
              <li>Students open Scan QR from the menu and point their camera.</li>
              <li>Attendance is recorded instantly for registered participants.</li>
              <li>Complete the event when finished to send certificates.</li>
            </ol>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventAttendance;
