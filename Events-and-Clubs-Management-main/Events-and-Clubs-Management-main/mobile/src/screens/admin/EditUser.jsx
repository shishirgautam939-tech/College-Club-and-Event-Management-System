import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Check, PencilLine } from "lucide-react-native";
import { getAllUsers, updateUser, getDepartments } from "../../api/users";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import InlineAlert from "../../components/ui/InlineAlert";
import PageHeader from "../../components/ui/PageHeader";

const BRANCHES = [
  { value: "BCT", label: "BCT - Computer" },
  { value: "BCE", label: "BCE - Civil" },
  { value: "BEE", label: "BEE - Electrical" },
  { value: "BEI", label: "BEI - Electronics" },
];

const USER_TYPES = ["Student", "Faculty", "Staff", "Admin"];

// route.params.userId replaces the web version's useParams() :id URL param.
const EditUser = ({ navigation, route }) => {
  const userId = route.params?.userId;
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
        const [usersRes, deptsRes] = await Promise.all([getAllUsers(), getDepartments()]);
        setDepartments(deptsRes.data);
        const user = usersRes.data.find((u) => String(u.id) === String(userId));
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
          department: user.department ? String(user.department?.id ?? user.department) : "",
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
  }, [userId]);

  const setField = (name, value) => setFormData((f) => ({ ...f, [name]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!formData.full_name.trim() || !formData.email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    setSaving(true);

    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      }
      // Only send department for Faculty.
      if (payload.user_type !== "Faculty") {
        payload.department = null;
      }
      if (payload.department === "") {
        payload.department = null;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      if (payload.branch === "") {
        payload.branch = null;
      }

      await updateUser(userId, payload);
      navigation.goBack();
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
      <View style={styles.centered}>
        <Text style={styles.mutedText}>Loading user…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <PageHeader
          eyebrow={
            <>
              <PencilLine size={13} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>Editing account</Text>
            </>
          }
          title="Edit user"
          subtitle="Update account details and access."
        />

        <Card style={styles.card}>
          {error ? <InlineAlert type="error" style={{ marginBottom: spacing.md }}>{error}</InlineAlert> : null}

          <View style={styles.field}>
            <Text style={styles.label}>User type</Text>
            <View style={styles.pickerWrap}>
              <Picker selectedValue={formData.user_type} onValueChange={(v) => setField("user_type", v)}>
                {USER_TYPES.map((t) => (
                  <Picker.Item key={t} label={t} value={t} />
                ))}
              </Picker>
            </View>
          </View>

          {formData.user_type === "Student" && (
            <View style={styles.field}>
              <Text style={styles.label}>Branch</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={formData.branch} onValueChange={(v) => setField("branch", v)}>
                  <Picker.Item label="Select branch" value="" />
                  {BRANCHES.map((b) => (
                    <Picker.Item key={b.value} label={b.label} value={b.value} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {formData.user_type === "Faculty" && (
            <View style={styles.field}>
              <Text style={styles.label}>Department</Text>
              <View style={styles.pickerWrap}>
                <Picker selectedValue={formData.department} onValueChange={(v) => setField("department", v)}>
                  <Picker.Item label="Select department" value="" />
                  {departments.map((dept) => (
                    <Picker.Item key={dept.id} label={dept.department_name} value={String(dept.id)} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          <Input
            label="Full name"
            value={formData.full_name}
            onChangeText={(v) => setField("full_name", v)}
            autoCapitalize="words"
            autoComplete="name"
          />

          <Input
            label="Email"
            value={formData.email}
            onChangeText={(v) => setField("email", v)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
          />

          <Input
            label="New password"
            hint="Leave blank to keep current"
            value={formData.password}
            onChangeText={(v) => setField("password", v)}
            secureTextEntry
            autoComplete="new-password"
          />

          {formData.user_type === "Student" && (
            <Input
              label="Roll number"
              hint="Must be in format: NCE + 3 digits + 3 letters + 3 digits"
              placeholder="Format: NCE123ABC456"
              value={formData.roll_number}
              onChangeText={(v) => setField("roll_number", v)}
              autoCapitalize="characters"
            />
          )}

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setField("is_active", !formData.is_active)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: formData.is_active }}
          >
            <View style={[styles.checkbox, formData.is_active && styles.checkboxChecked]}>
              {formData.is_active && <Check size={14} color="#FFFFFF" />}
            </View>
            <Text style={styles.checkboxLabel}>Active</Text>
          </Pressable>

          <View style={styles.actionsRow}>
            <Button variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button onPress={handleSubmit} loading={saving} style={{ flex: 1 }}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.md },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  mutedText: { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.textMuted },
  eyebrowText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: "#FFFFFF", letterSpacing: 0.4 },

  card: { padding: spacing.lg, gap: spacing.md },
  field: { gap: 6 },
  label: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  pickerWrap: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.md,
    backgroundColor: colors.card,
    overflow: "hidden",
  },

  checkboxRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },

  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
});

export default EditUser;
