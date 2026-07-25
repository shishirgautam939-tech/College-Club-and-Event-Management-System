import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ArrowRight, GraduationCap, Briefcase, Wrench } from "lucide-react-native";
import { registerUser } from "../../api/auth";
import { getDepartments } from "../../api/users";
import { colors, radii, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Logo from "../../components/Logo";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import InlineAlert from "../../components/ui/InlineAlert";
import StatusBadge from "../../components/ui/StatusBadge";

const BRANCH_MAP = { BCT: "BCT - Computer", BCE: "BCE - Civil", BEE: "BEE - Electrical", BEI: "BEI - Electronics" };
const BRANCH_TONE = { BCT: "info", BCE: "success", BEE: "warning", BEI: "violet" };
const ROLL_REGEX = /^NCE0\d{2}(BCT|BCE|BEE|BEI)0\d{2}$/i;
const EMAIL_ALLOWED_REGEX = /^[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:com|edu)$/i;
const MIN_SECOND_LEVEL_DOMAIN_LENGTHS = { com: 5, edu: 3 };

function getEmailDomainInfo(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return { secondLevelLength: 0, tld: "" };
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  if (dot <= 0) return { secondLevelLength: 0, tld: "" };
  const labels = domain.slice(0, dot).split(".");
  return { secondLevelLength: labels[labels.length - 1].length, tld: domain.slice(dot + 1).toLowerCase() };
}

const ROLES = [
  { value: "Student", label: "Student", Icon: GraduationCap },
  { value: "Faculty", label: "Faculty", Icon: Briefcase },
  { value: "Staff", label: "Staff", Icon: Wrench },
];

const Register = ({ navigation }) => {
  const [form, setForm] = useState({
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

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleRollChange = (val) => {
    const upper = val.toUpperCase();
    const match = upper.match(/^NCE0\d{2}(BCT|BCE|BEE|BEI)/i);
    setForm((f) => ({ ...f, roll_number: upper, branch: match ? match[1].toUpperCase() : "" }));
  };

  const handleSubmit = async () => {
    setError("");
    const trimmedEmail = form.email.trim();
    if (!EMAIL_ALLOWED_REGEX.test(trimmedEmail)) {
      setError("Enter a valid email ending with .com or .edu (e.g. name@gmail.com or name@nce.edu).");
      return;
    }
    const { secondLevelLength, tld } = getEmailDomainInfo(trimmedEmail);
    if (MIN_SECOND_LEVEL_DOMAIN_LENGTHS[tld] && secondLevelLength < MIN_SECOND_LEVEL_DOMAIN_LENGTHS[tld]) {
      setError("That email domain looks incomplete. Use a full provider name like gmail.com, outlook.com, or your college's .edu address.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, email: trimmedEmail };
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      } else {
        if (!ROLL_REGEX.test(payload.roll_number)) {
          setError("Invalid roll number. Format: NCE0XXBRANCH0XX (e.g. NCE078BCT012)");
          setLoading(false);
          return;
        }
        payload.roll_number = payload.roll_number.toUpperCase();
        delete payload.branch;
      }
      if (payload.user_type !== "Faculty") {
        delete payload.department;
      } else if (departments.length === 0) {
        setError("Faculty registration is unavailable until departments are configured on the server.");
        setLoading(false);
        return;
      }
      if (payload.department === "") {
        delete payload.department;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      await registerUser(payload);
      navigation.navigate("Login", { registered: true });
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const messages = Object.values(data).flat().join(" ");
        setError(messages || "Registration failed.");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Logo compact markSize={40} />

        <Text style={styles.eyebrow}>Create account</Text>
        <Text style={styles.title}>Join Evento</Text>
        <Text style={styles.subtitle}>Pick your role and tell us a little about you.</Text>

        {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}

        <View style={styles.form}>
          <View style={{ gap: 6 }}>
            <Text style={styles.fieldLabel}>I am a…</Text>
            <View style={styles.roleTabs}>
              {ROLES.map((r) => {
                const active = form.user_type === r.value;
                return (
                  <Pressable
                    key={r.value}
                    onPress={() => set("user_type", r.value)}
                    style={[styles.roleTab, active && styles.roleTabActive]}
                  >
                    <r.Icon size={15} color={active ? colors.textPrimary : colors.textMuted} />
                    <Text style={[styles.roleTabText, active && styles.roleTabTextActive]}>{r.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Input
            label="Full name"
            placeholder="e.g. Brishav Joshi"
            value={form.full_name}
            onChangeText={(v) => set("full_name", v)}
            autoCapitalize="words"
          />

          <Input
            label="Email"
            hint=".com or .edu only"
            placeholder="name@gmail.com or name@nce.edu"
            value={form.email}
            onChangeText={(v) => set("email", v)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <Input
            label="Password"
            placeholder="At least 6 characters"
            value={form.password}
            onChangeText={(v) => set("password", v)}
            secureTextEntry
          />

          {form.user_type === "Student" && (
            <View style={{ gap: 6 }}>
              <Input
                label="Roll number"
                hint="NCE0XXBRANCH0XX"
                placeholder="NCE078BCT012"
                value={form.roll_number}
                onChangeText={handleRollChange}
                autoCapitalize="characters"
                maxLength={12}
              />
              {form.branch ? (
                <View style={styles.branchRow}>
                  <StatusBadge tone={BRANCH_TONE[form.branch] || "brand"}>{form.branch}</StatusBadge>
                  <Text style={styles.branchLabel}>{BRANCH_MAP[form.branch] || form.branch}</Text>
                </View>
              ) : null}
            </View>
          )}

          {form.user_type === "Faculty" && (
            <View style={{ gap: 6 }}>
              <Text style={styles.fieldLabel}>Department</Text>
              {departments.length === 0 ? (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeText}>
                    No departments found yet. Ask an admin to run{" "}
                    <Text style={styles.code}>python manage.py setup_defaults</Text>.
                  </Text>
                </View>
              ) : (
                <View style={styles.pickerWrap}>
                  <Picker
                    selectedValue={form.department}
                    onValueChange={(v) => set("department", v)}
                  >
                    <Picker.Item label="Select department" value="" />
                    {departments.map((dept) => (
                      <Picker.Item key={dept.id} label={dept.department_name} value={String(dept.id)} />
                    ))}
                  </Picker>
                </View>
              )}
            </View>
          )}

          <Button size="lg" onPress={handleSubmit} loading={loading} icon={<ArrowRight size={16} color="#FFFFFF" />}>
            {loading ? "Creating account…" : "Create my account"}
          </Button>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>Admin accounts are created separately by a system administrator.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xxl * 2, gap: 2 },
  eyebrow: {
    marginTop: spacing.xl,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.primary,
  },
  title: { marginTop: 2, fontFamily: fontFamily.bold, fontSize: fontSize.xl, color: colors.textPrimary },
  subtitle: { marginTop: 4, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  form: { marginTop: spacing.lg, gap: spacing.md },
  fieldLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  roleTabs: { flexDirection: "row", gap: 4, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, padding: 4 },
  roleTab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: radii.sm },
  roleTabActive: { backgroundColor: colors.card, ...({ shadowOpacity: 0.05 }) },
  roleTabText: { fontFamily: fontFamily.semibold, fontSize: fontSize.xs, color: colors.textMuted },
  roleTabTextActive: { color: colors.textPrimary },
  branchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  branchLabel: { fontFamily: fontFamily.medium, fontSize: fontSize.xs, color: colors.primary },
  pickerWrap: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, backgroundColor: colors.card, overflow: "hidden" },
  noticeBox: {
    marginTop: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primaryMuted,
    backgroundColor: colors.primaryMuted,
    padding: spacing.md,
  },
  noticeText: { fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 18 },
  code: { fontFamily: fontFamily.medium, color: colors.primary },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  footerText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  footerLink: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.primary },
});

export default Register;
