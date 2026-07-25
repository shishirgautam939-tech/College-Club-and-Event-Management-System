import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { Building2 } from "lucide-react-native";
import { createClub } from "../../api/clubs";
import { getAllUsers } from "../../api/users";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import { Picker } from "@react-native-picker/picker";
import PageHeader from "../../components/ui/PageHeader";
import InlineAlert from "../../components/ui/InlineAlert";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";

const CreateClub = ({ navigation }) => {
  const [facultyList, setFacultyList] = useState([]);
  const [fetchingFaculty, setFetchingFaculty] = useState(true);
  const [formData, setFormData] = useState({
    club_name: "",
    description: "",
    faculty_coordinator: "",
    is_council: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const res = await getAllUsers();
        setFacultyList(res.data.filter((u) => u.user_type === "Faculty" || u.user_type === "Admin"));
      } catch {
        setError("Failed to load faculty list.");
      } finally {
        setFetchingFaculty(false);
      }
    };
    fetchFaculty();
  }, []);

  const set = (key, value) => setFormData((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...formData,
        faculty_coordinator: formData.faculty_coordinator ? parseInt(formData.faculty_coordinator, 10) : null,
      };
      await createClub(payload);
      navigation.navigate("Clubs");
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow={
            <>
              <Building2 size={13} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>New organization</Text>
            </>
          }
          title="Create a club"
          subtitle="Set up a new campus organization and assign a faculty coordinator."
        />

        <Card style={{ marginTop: spacing.lg }}>
          {error ? (
            <InlineAlert type="error" style={{ marginBottom: spacing.md }}>
              {error}
            </InlineAlert>
          ) : null}

          <View style={{ gap: spacing.md }}>
            <Input
              label="Club name"
              value={formData.club_name}
              onChangeText={(v) => set("club_name", v)}
              placeholder="e.g. NCE IT Club"
            />

            <Input
              label="Description"
              value={formData.description}
              onChangeText={(v) => set("description", v)}
              placeholder="Brief description of the club..."
              multiline
              numberOfLines={3}
              style={{ height: 90, paddingTop: 12, textAlignVertical: "top" }}
            />

            <View style={{ gap: 6 }}>
              <Text style={styles.fieldLabel}>Faculty coordinator</Text>
              <View style={styles.pickerWrap}>
                <Picker
                  selectedValue={formData.faculty_coordinator}
                  onValueChange={(v) => set("faculty_coordinator", v)}
                >
                  <Picker.Item label={fetchingFaculty ? "Loading…" : "— Select faculty —"} value="" />
                  {facultyList.map((f) => (
                    <Picker.Item key={f.id} label={`${f.full_name} (${f.email})`} value={String(f.id)} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Council</Text>
                <Text style={styles.switchHint}>This is a council (not a regular club)</Text>
              </View>
              <Switch
                value={formData.is_council}
                onValueChange={(v) => set("is_council", v)}
                trackColor={{ false: colors.cardBorder, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.actionsRow}>
              <Button style={{ flex: 1 }} variant="outline" onPress={() => navigation.navigate("Clubs")}>
                Cancel
              </Button>
              <Button style={{ flex: 1 }} onPress={handleSubmit} loading={loading}>
                Create club
              </Button>
            </View>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2 },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF", textTransform: "uppercase", letterSpacing: 0.6 },
  fieldLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  pickerWrap: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, backgroundColor: colors.card, overflow: "hidden" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  switchHint: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: spacing.lg },
});

export default CreateClub;
