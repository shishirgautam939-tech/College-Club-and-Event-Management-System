import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Zap, Smartphone, Award, ShieldCheck } from "lucide-react-native";
import { colors, radii, spacing } from "../theme/colors";
import { fontFamily, fontSize } from "../theme/typography";
import Logo from "../components/Logo";
import Button from "../components/ui/Button";

const features = [
  { Icon: Zap, title: "Proposals in minutes", sub: "Club managers submit, faculty approves — in a few taps." },
  { Icon: Smartphone, title: "QR check-in", sub: "One scan marks attendance. No paper, no queues." },
  { Icon: Award, title: "Digital certificates", sub: "Issued automatically when an event wraps." },
  { Icon: ShieldCheck, title: "Role-aware access", sub: "Students, faculty and admins each get the right view." },
];

const Landing = ({ navigation }) => (
  <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Logo compact markSize={40} />

      <Text style={styles.eyebrow}>Campus events, made simple</Text>
      <Text style={styles.title}>One place for every club, event and certificate.</Text>
      <Text style={styles.subtitle}>
        Evento brings proposals, registrations, QR check-in, attendance and digital certificates
        into a single calm workspace built for the whole campus.
      </Text>

      <View style={styles.actions}>
        <Button size="lg" onPress={() => navigation.navigate("Login")}>
          Sign in to your account
        </Button>
        <Button size="lg" variant="outline" onPress={() => navigation.navigate("Register")}>
          Create an account
        </Button>
      </View>

      <View style={styles.features}>
        {features.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <f.Icon size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={styles.footer}>
        © {new Date().getFullYear()} Evento · College Club and Event Management System
      </Text>
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, gap: spacing.sm },
  eyebrow: {
    marginTop: spacing.xl,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.primary,
  },
  title: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.extrabold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.regular,
    fontSize: fontSize.base,
    lineHeight: 22,
    color: colors.textMuted,
  },
  actions: { marginTop: spacing.xl, gap: spacing.sm },
  features: { marginTop: spacing.xxl, gap: spacing.lg },
  featureRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  featureTitle: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  featureSub: { marginTop: 2, fontFamily: fontFamily.regular, fontSize: fontSize.xs, color: colors.textMuted, lineHeight: 17 },
  footer: {
    marginTop: spacing.xxl,
    textAlign: "center",
    fontFamily: fontFamily.regular,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
});

export default Landing;
