import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { UserPlus } from "lucide-react-native";
import { createUser, getDepartments } from "../../api/users";
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

// The web version redirects to /admin/students, /admin/faculty, or /admin
// depending on the created user's role. This screen can be pushed from
// either the Dashboard tab's stack or the Users tab's stack (see
// AdminTabNavigator.jsx), so navigation.goBack() returns to whichever
// screen actually opened it, which is more correct than a hardcoded target.
const CreateUser = ({ navigation }) => {
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

  const setField = (name, value) => setFormData((f) => ({ ...f, [name]: value }));

  const handleSubmit = async () => {
    setError("");
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }
    setLoading(true);

    try {
      const payload = { ...formData };
      // Only send roll_number and branch for students.
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      }
      // Only send department for Faculty.
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
      navigation.goBack();
    } catch (err) {
      console.error("Failed to create user", err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.roll_number?.[0] ||
        err.response?.data?.email?.[0] ||
        "Failed to create user.";
      setError(detail);
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
              <UserPlus size={13} color="#FFFFFF" />
              <Text style={styles.eyebrowText}>New account</Text>
            </>
          }
          title="Add a user"
          subtitle="Create a new student, faculty, staff, or admin account."
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
            label="Password"
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

          <View style={styles.actionsRow}>
            <Button variant="outline" onPress={() => navigation.goBack()} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button onPress={handleSubmit} loading={loading} style={{ flex: 1 }}>
              {loading ? "Creating..." : "Create user"}
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
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
});

export default CreateUser;
