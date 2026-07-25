import { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { PencilLine } from "lucide-react-native";
import { getMyClubs, proposeEvent } from "../../api/events";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import InlineAlert from "../../components/ui/InlineAlert";
import PageHeader from "../../components/ui/PageHeader";

// Two plain digit-entry fields stand in for the web's native
// <input type="datetime-local" /> — there's no date/time-picker dependency
// installed on mobile and we're not allowed to add new npm packages, so the
// student types the local date and time directly. Both are validated below
// before being combined into an ISO-like "YYYY-MM-DDTHH:mm" string, which is
// exactly the shape the backend already expects from the web client.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const initialForm = {
  club: "",
  title: "",
  description: "",
  venue: "",
  max_participants: "",
  eventDate: "",
  eventTime: "",
};

const ProposeEvent = () => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(initialForm);

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

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!form.club) {
      setError("Please select a club.");
      return;
    }
    if (!form.title.trim()) {
      setError("Please enter an event title.");
      return;
    }
    if (!DATE_RE.test(form.eventDate.trim())) {
      setError("Please enter the event date as YYYY-MM-DD.");
      return;
    }
    if (!TIME_RE.test(form.eventTime.trim())) {
      setError("Please enter the event time as HH:MM (24-hour).");
      return;
    }

    const eventDateValue = `${form.eventDate.trim()}T${form.eventTime.trim()}`;
    const submittedAt = new Date(eventDateValue);
    if (Number.isNaN(submittedAt.getTime())) {
      setError("That event date doesn't look valid. Please check it and try again.");
      return;
    }
    if (submittedAt.getTime() <= Date.now()) {
      setError("Event date must be in the future. Please pick a later date and time.");
      return;
    }

    setSubmitting(true);
    try {
      await proposeEvent({
        club: parseInt(form.club, 10),
        title: form.title,
        description: form.description,
        venue: form.venue,
        max_participants: form.max_participants ? parseInt(form.max_participants, 10) : null,
        event_date: eventDateValue,
      });
      setSuccess("Event proposed successfully! It is now pending review.");
      setForm(initialForm);
    } catch (err) {
      const data = err.response?.data;
      let message =
        (Array.isArray(data?.event_date) && data.event_date[0]) ||
        data?.event_date ||
        data?.title?.[0] ||
        data?.club?.[0] ||
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
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.mutedText}>Loading…</Text>
      </View>
    );
  }

  const selectedClub = clubs.find((c) => String(c.club_id) === form.club);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow={
            <>
              <PencilLine size={14} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>New proposal</Text>
            </>
          }
          title="Propose an event"
          subtitle="Submit a proposal for your club to run. Faculty will review and approve it before it goes live."
        />

        {clubs.length === 0 ? (
          <Card style={{ marginTop: spacing.lg, alignItems: "center", paddingVertical: spacing.xxl }}>
            <Text style={styles.emptyTitle}>No clubs to propose for</Text>
            <Text style={styles.emptySubtitle}>
              You are not an Event Manager in any club. Only Event Managers can propose events.
            </Text>
          </Card>
        ) : (
          <Card style={{ marginTop: spacing.lg, gap: spacing.md }}>
            {error ? <InlineAlert type="error">{error}</InlineAlert> : null}
            {success ? <InlineAlert type="success">{success}</InlineAlert> : null}

            <View style={{ gap: 6 }}>
              <Text style={styles.fieldLabel}>Club</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={form.club} onValueChange={(v) => set("club", v)}>
                  <Picker.Item label="Select a club" value="" />
                  {clubs.map((c) => (
                    <Picker.Item key={c.club_id} label={`${c.club_name} (${c.position})`} value={String(c.club_id)} />
                  ))}
                </Picker>
              </View>
              {selectedClub ? (
                <Text style={styles.pickerHint}>
                  {selectedClub.club_name} · {selectedClub.position}
                </Text>
              ) : null}
            </View>

            <Input
              label="Event title"
              placeholder="e.g. Annual Tech Fest 2026"
              value={form.title}
              onChangeText={(v) => set("title", v)}
            />

            <Input
              label="Description"
              placeholder="Brief description of the event..."
              value={form.description}
              onChangeText={(v) => set("description", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.textarea}
            />

            <View style={styles.row}>
              <Input
                label="Venue"
                placeholder="e.g. Main Auditorium, Block A"
                value={form.venue}
                onChangeText={(v) => set("venue", v)}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Max participants"
                hint="Optional"
                placeholder="Unlimited"
                value={form.max_participants}
                onChangeText={(v) => set("max_participants", v.replace(/[^0-9]/g, ""))}
                keyboardType="numeric"
                containerStyle={{ flex: 1 }}
              />
            </View>

            <View style={styles.row}>
              <Input
                label="Event date"
                hint="YYYY-MM-DD"
                placeholder="2026-08-15"
                value={form.eventDate}
                onChangeText={(v) => set("eventDate", v)}
                containerStyle={{ flex: 1 }}
              />
              <Input
                label="Event time"
                hint="24-hour, HH:MM"
                placeholder="14:30"
                value={form.eventTime}
                onChangeText={(v) => set("eventTime", v)}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <Text style={styles.futureHint}>Must be a future date and time.</Text>

            <View style={styles.submitRow}>
              <Button onPress={handleSubmit} disabled={submitting} loading={submitting}>
                Propose event
              </Button>
            </View>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: spacing.sm },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF" },

  emptyTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.base, color: colors.textPrimary },
  emptySubtitle: { marginTop: spacing.sm, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted, textAlign: "center" },

  fieldLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  pickerWrap: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, backgroundColor: colors.card, overflow: "hidden" },
  pickerHint: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.primary },

  textarea: { height: 96, paddingTop: 12 },
  row: { flexDirection: "row", gap: spacing.md },
  futureHint: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted },

  submitRow: { marginTop: spacing.sm, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.cardBorder, alignItems: "flex-end" },
});

export default ProposeEvent;
