import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import Logo from "../../components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import InlineAlert from "@/components/InlineAlert";

// Mirrors the backend EMAIL_DOMAIN_PATTERN.
const EMAIL_ALLOWED_REGEX = /^[A-Za-z0-9._%+-]{1,64}@(?!-)(?:[A-Za-z0-9-]{1,63}\.)+(?:com|edu)$/i;
const MIN_SECOND_LEVEL_DOMAIN_LENGTHS = {
  com: 5,
  edu: 3,
};
const MIN_PASSWORD_LENGTH = 5;

function getEmailDomainInfo(email) {
  const at = email.lastIndexOf("@");
  if (at < 0) return { secondLevelLength: 0, tld: "" };

  const domain = email.slice(at + 1);
  const dot = domain.lastIndexOf(".");
  if (dot <= 0) return { secondLevelLength: 0, tld: "" };

  const labels = domain.slice(0, dot).split(".");
  return {
    secondLevelLength: labels[labels.length - 1].length,
    tld: domain.slice(dot + 1).toLowerCase(),
  };
}

function getLoginErrorMessage(err) {
  if (!err?.response) {
    return "Can't reach the server. Make sure the backend is running on port 8000.";
  }

  const data = err.response.data || {};
  return (
    data.detail ||
    data.message ||
    data.non_field_errors?.[0] ||
    "Login failed. Check your credentials and try again."
  );
}

// Where each role belongs after signing in. The saved "from" location can
// belong to the *previous* account's role (e.g. an admin logged out on
// /admin, then a student signs in) — following it blindly bounces the new
// user to /unauthorized. Only resume a location the new role may visit,
// and keep admins inside the admin console so they always land on the
// complete management interface.
function resolveLanding(role, from) {
  const home = role === "Admin" ? "/admin" : role === "Faculty" ? "/faculty" : "/dashboard";
  if (!from || from === "/login") return home;
  if (role === "Admin") return from.startsWith("/admin") ? from : home;
  if (role === "Faculty") {
    return from.startsWith("/faculty") || from.startsWith("/dashboard") ? from : home;
  }
  // Student: anything except the admin/faculty areas is fine.
  return from.startsWith("/admin") || from.startsWith("/faculty") ? home : from;
}

const features = [
  {
    n: "01",
    title: "One place for everyone",
    sub: "Students, faculty, and admins land in the right area.",
  },
  {
    n: "02",
    title: "Quick access",
    sub: "Use your email, roll number, or name to continue.",
  },
  {
    n: "03",
    title: "Ready for events",
    sub: "Jump back into attendance, approvals, and certificates.",
  },
];

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fromLocation = location.state?.from;
  const justRegistered = location.state?.registered;

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const role = await login(trimmedIdentifier, password);

      const from = fromLocation?.pathname;
      const landing = resolveLanding(role, from);
      // Resuming the saved location keeps its search params/state; a role
      // home is a plain path.
      navigate(landing === from ? fromLocation : landing, { replace: true });
    } catch (err) {
      setError(getLoginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      {/* Brand / hero panel */}
      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-[#F8F9FA] p-10 text-foreground lg:flex"
      >
        <div className="pointer-events-none absolute -top-20 -right-12 size-72 rounded-full bg-orange-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 size-64 rounded-full bg-sky-400/15 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-10">
          <Logo markSize={36} />
          <div>
            <span className="inline-flex items-center rounded-full border border-border bg-white px-3 py-1 text-[0.68rem] font-semibold tracking-[0.18em] text-muted-foreground uppercase shadow-sm">
              Campus portal
            </span>
            <h1 className="mt-4 max-w-[16ch] text-4xl leading-[1.1] font-bold tracking-tight text-foreground">
              Sign in and get back to the part that matters.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              A straightforward login screen for the event system. I kept it
              simple on purpose so it feels easy to use on a busy day.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {features.map((f) => (
                <div
                  key={f.n}
                  className="flex items-start gap-3 rounded-xl border border-border bg-white px-4 py-3 shadow-sm transition-all hover:translate-x-0.5 hover:shadow-md"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {f.n}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">{f.title}</span>
                    <span className="text-xs leading-snug text-muted-foreground">{f.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>Built for the Evento campus workflow</span>
          <span className="flex gap-1.5">
            <span className="h-1.5 w-5 rounded-full bg-orange-400" />
            <span className="size-1.5 rounded-full bg-border" />
            <span className="size-1.5 rounded-full bg-border" />
          </span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center bg-[#F8F9FA] px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <Logo compact markSize={36} />
          </Link>

          <div className="rounded-2xl border border-border bg-white p-8 shadow-sm sm:p-10">
            <span className="text-[0.68rem] font-bold tracking-[0.18em] text-primary uppercase">Welcome back</span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Sign in to Evento</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Use your college email, roll number, or name to continue.
            </p>

            {justRegistered && (
              <InlineAlert type="success" className="mt-5">
                Account created. You can sign in now.
              </InlineAlert>
            )}
            {error && (
              <InlineAlert type="error" className="mt-5">
                {error}
              </InlineAlert>
            )}

            <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5" autoComplete="on">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="identifier">Email, roll number, or name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="name@nce.edu or NCE078BCT012"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    autoComplete="username"
                    className="h-11 pl-9"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-[0.7rem] font-medium text-muted-foreground">secure connection</span>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="current-password"
                    className="h-11 pr-10 pl-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} size="lg" className="mt-2 h-11 gap-2 text-base">
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              New to Evento?{" "}
              <Link to="/register" className="font-semibold text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>

          <div className="mt-5 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            If login fails, check the backend and make sure the default admin
            setup has been run with{" "}
            <code className="rounded bg-background px-1 py-0.5 text-primary">python manage.py setup_defaults</code>. Start the
            server with{" "}
            <code className="rounded bg-background px-1 py-0.5 text-primary">python manage.py runserver</code>.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
