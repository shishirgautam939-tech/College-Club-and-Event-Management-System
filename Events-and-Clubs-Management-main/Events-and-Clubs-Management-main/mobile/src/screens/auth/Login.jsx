import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowRight, Eye, EyeOff } from "lucide-react-native";
import useAuth from "../../hooks/useAuth";
import { colors, spacing } from "../../theme/colors";
import { fontFamily, fontSize } from "../../theme/typography";
import Logo from "../../components/Logo";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import InlineAlert from "../../components/ui/InlineAlert";

// Mirrors the backend EMAIL_DOMAIN_PATTERN (client/src/pages/auth/Login.jsx).
const EMAIL_ALLOWED_REGEX = /^[A-Za-z0-9._%+-]{1,64}@(?!-)(?:[A-Za-z0-9-]{1,63}\.)+(?:com|edu)$/i;
const MIN_SECOND_LEVEL_DOMAIN_LENGTHS = { com: 5, edu: 3 };
const MIN_PASSWORD_LENGTH = 5;

function getEmailDomainInfo(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return { secondLevelLength: 0, tld: "" };
  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  if (dot <= 0) return { secondLevelLength: 0, tld: "" };
  const labels = domain.slice(0, dot).split(".");
  return { secondLevelLength: labels[labels.length - 1].length, tld: domain.slice(dot + 1).toLowerCase() };
}

function getLoginErrorMessage(err) {
  if (!err?.response) {
    return "Can't reach the server. Check your network connection and the API URL in mobile/.env.";
  }
  const data = err.response.data || {};
  return (
    data.detail ||
    data.message ||
    data.non_field_errors?.[0] ||
    "Login failed. Check your credentials and try again."
  );
}

const Login = ({ navigation, route }) => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const justRegistered = route?.params?.registered;

  const handleSubmit = async () => {
    setError("");
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError("Enter your email, roll number, or name.");
      return;
    }
    if (trimmedIdentifier.includes("@") && !EMAIL_ALLOWED_REGEX.test(trimmedIdentifier)) {
      setError("Enter a valid email ending with .com or .edu (for example, name@gmail.com or name@nce.edu).");
      return;
    }
    if (trimmedIdentifier.includes("@")) {
      const { secondLevelLength, tld } = getEmailDomainInfo(trimmedIdentifier);
      if (MIN_SECOND_LEVEL_DOMAIN_LENGTHS[tld] && secondLevelLength < MIN_SECOND_LEVEL_DOMAIN_LENGTHS[tld]) {
        setError("That email domain looks incomplete. Use a full provider name like gmail.com, outlook.com, or your college's .edu address.");
        return;
      }
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);
    try {
      // No explicit redirect needed: once `login()` sets `user`, RootNavigator
      // swaps to that role's tab navigator on its own (see
      // src/navigation/RootNavigator.jsx) — there's no "from" location to
      // resume on native the way client/src/pages/auth/Login.jsx does.
      await login(trimmedIdentifier, password);
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Logo compact markSize={40} />

          <Text style={styles.eyebrow}>Welcome back</Text>
          <Text style={styles.title}>Sign in to Evento</Text>
          <Text style={styles.subtitle}>Use your college email, roll number, or name to continue.</Text>

          {justRegistered ? (
            <InlineAlert type="success" style={{ marginTop: spacing.md }}>
              Account created. You can sign in now.
            </InlineAlert>
          ) : null}
          {error ? <InlineAlert type="error" style={{ marginTop: spacing.md }}>{error}</InlineAlert> : null}

          <View style={styles.form}>
            <Input
              label="Email, roll number, or name"
              placeholder="name@nce.edu or NCE078BCT012"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
            />
            <View style={{ gap: 6 }}>
              <Text style={styles.fieldLabel}>Password</Text>
              <View style={styles.passwordWrap}>
                <Input
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  containerStyle={{ flex: 1, gap: 0 }}
                  style={{ paddingRight: 44 }}
                />
                <Pressable
                  onPress={() => setShowPassword((p) => !p)}
                  hitSlop={8}
                  style={styles.passwordToggle}
                >
                  {showPassword ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
                </Pressable>
              </View>
            </View>

            <Button size="lg" onPress={handleSubmit} loading={loading} icon={<ArrowRight size={16} color="#FFFFFF" />}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>New to Evento? </Text>
            <Pressable onPress={() => navigation.navigate("Register")}>
              <Text style={styles.footerLink}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, gap: 2 },
  eyebrow: {
    marginTop: spacing.xl,
    fontFamily: fontFamily.bold,
    fontSize: fontSize.xs,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: colors.primary,
  },
  title: { marginTop: 4, fontFamily: fontFamily.extrabold, fontSize: fontSize.xxl, color: colors.textPrimary },
  subtitle: { marginTop: 6, fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  form: { marginTop: spacing.xl, gap: spacing.lg },
  fieldLabel: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.textPrimary },
  passwordWrap: { position: "relative", justifyContent: "center" },
  passwordToggle: { position: "absolute", right: 14, height: "100%", justifyContent: "center" },
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: spacing.xl },
  footerText: { fontFamily: fontFamily.regular, fontSize: fontSize.sm, color: colors.textMuted },
  footerLink: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm, color: colors.primary },
});

export default Login;
