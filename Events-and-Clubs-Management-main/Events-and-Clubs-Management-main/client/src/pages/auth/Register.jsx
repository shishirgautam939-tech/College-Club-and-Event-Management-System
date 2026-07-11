import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Briefcase, GraduationCap, IdCard, Loader2, Lock, Mail, ShieldCheck, User, Wrench } from "lucide-react";
import { registerUser } from "../../api/auth";
import { getDepartments } from "../../api/users";
import Logo from "../../components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";
import InlineAlert from "@/components/InlineAlert";
import { cn } from "@/lib/utils";

const BRANCH_MAP = {
  BCT: "BCT - Computer",
  BCE: "BCE - Civil",
  BEE: "BEE - Electrical",
  BEI: "BEI - Electronics",
};

const BRANCH_TONE = {
  BCT: "info",
  BCE: "success",
  BEE: "warning",
  BEI: "violet",
};

const ROLL_REGEX = /^NCE0\d{2}(BCT|BCE|BEE|BEI)0\d{2}$/i;
// Mirrors the backend EMAIL_DOMAIN_PATTERN. Anchors the TLD (.com / .edu)
// separately so typos like gmaix.com / gmai.com cannot pass. The
// second-level domain length check below catches common typos too.
const EMAIL_ALLOWED_REGEX = /^[A-Za-z0-9._%+-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+(?:com|edu)$/i;
const MIN_SECOND_LEVEL_DOMAIN_LENGTHS = {
  com: 5,
  edu: 3,
};

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

const ROLES = [
  { value: "Student", label: "Student", icon: GraduationCap },
  { value: "Faculty", label: "Faculty", icon: Briefcase },
  { value: "Staff", label: "Staff", icon: Wrench },
];

const Register = () => {
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
  const navigate = useNavigate();

  useEffect(() => {
    getDepartments()
      .then((res) => setDepartments(res.data))
      .catch(() => {});
  }, []);

  // Auto-detect branch from roll number
  const handleRollChange = (e) => {
    const val = e.target.value.toUpperCase();
    const match = val.match(/^NCE0\d{2}(BCT|BCE|BEE|BEI)/i);
    setForm({
      ...form,
      roll_number: val,
      branch: match ? match[1].toUpperCase() : "",
    });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    setLoading(true);
    try {
      const payload = { ...form, email: trimmedEmail };
      if (payload.user_type !== "Student") {
        delete payload.roll_number;
        delete payload.branch;
      } else {
        // Validate roll number format before sending
        if (!ROLL_REGEX.test(payload.roll_number)) {
          setError("Invalid roll number. Format: NCE0XXBRANCH0XX (e.g. NCE078BCT012)");
          setLoading(false);
          return;
        }
        payload.roll_number = payload.roll_number.toUpperCase();
        // Branch is auto-mapped on the backend from roll_number; remove explicit branch
        delete payload.branch;
      }
      if (payload.user_type !== "Faculty") {
        delete payload.department;
      } else if (departments.length === 0) {
        setError("Faculty registration is unavailable until departments are configured on the server.");
        setLoading(false);
        return;
      }
      // Convert department to number or remove if empty
      if (payload.department === "") {
        delete payload.department;
      } else if (payload.department) {
        payload.department = Number(payload.department);
      }
      await registerUser(payload);
      navigate("/login", { state: { registered: true } });
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
    <div className="grid min-h-svh bg-background lg:grid-cols-2">
      {/* Brand / hero panel */}
      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#14241a] via-[#1d2c20] to-[#2a3b2d] p-10 text-white lg:flex"
      >
        <div className="pointer-events-none absolute -top-20 -right-12 size-72 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 size-64 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-10">
          <Logo light markSize={36} />
          <div>
            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.68rem] font-semibold tracking-[0.18em] text-white/90 uppercase">
              Join Evento
            </span>
            <h1 className="mt-4 max-w-[18ch] text-4xl leading-[1.1] font-bold tracking-tight">
              Create your campus account in less than a minute.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/75">
              Sign up once and unlock event discovery, QR check-in, and digital
              certificates for everything your college has to offer.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              {[
                { Icon: ShieldCheck, title: "Tailored to your role", sub: "Students, faculty, and staff each get the right view." },
                { Icon: IdCard, title: "Verified roll numbers", sub: "Format NCE078BCT012 — branch is auto-detected." },
                { Icon: Lock, title: "Your data stays yours", sub: "Secure sign-in with email ending in .com or .edu." },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition-all hover:translate-x-0.5 hover:bg-white/10"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <f.Icon className="size-4" />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold">{f.title}</span>
                    <span className="text-xs leading-snug text-white/65">{f.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-white/60">
          <span>Already have an account?</span>
          <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-white/90 hover:text-white">
            Sign in <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center bg-gradient-to-b from-white/40 to-white/80 px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Link to="/" className="mb-6 flex items-center gap-2 lg:hidden">
            <Logo compact markSize={36} />
          </Link>

          <span className="text-[0.68rem] font-bold tracking-[0.18em] text-primary uppercase">Create account</span>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Join Evento</h2>
          <p className="mt-1 text-sm text-muted-foreground">Pick your role and tell us a little about you.</p>

          {error && (
            <InlineAlert type="error" className="mt-4">
              {error}
            </InlineAlert>
          )}

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" autoComplete="on">
            {/* Role tabs */}
            <div className="flex flex-col gap-1.5">
              <Label>I am a…</Label>
              <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl border bg-muted p-1">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    role="tab"
                    aria-selected={form.user_type === r.value}
                    onClick={() => setForm({ ...form, user_type: r.value })}
                    className={cn(
                      "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-semibold text-muted-foreground transition-all",
                      form.user_type === r.value && "bg-background text-foreground shadow-sm"
                    )}
                  >
                    <r.icon className="size-4" />
                    <span>{r.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="full_name">Full name</Label>
              <div className="relative">
                <User className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="full_name"
                  type="text"
                  name="full_name"
                  placeholder="e.g. Brishav Joshi"
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Email</Label>
                <span className="text-[0.7rem] font-medium text-muted-foreground">.com or .edu only</span>
              </div>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@gmail.com or name@nce.edu"
                  value={form.email}
                  onChange={handleChange}
                  required
                  pattern="[A-Za-z0-9._%+\-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)+(com|edu)"
                  title="Email must end with .com or .edu and use a full provider name (e.g. gmail.com, nce.edu)"
                  autoComplete="email"
                  className="h-10 pl-9"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="At least 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="h-10 pl-9"
                />
              </div>
            </div>

            {form.user_type === "Student" && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="roll_number">Roll number</Label>
                  <span className="text-[0.7rem] font-medium text-muted-foreground">NCE0XXBRANCH0XX</span>
                </div>
                <div className="relative">
                  <IdCard className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="roll_number"
                    type="text"
                    name="roll_number"
                    placeholder="NCE078BCT012"
                    value={form.roll_number}
                    onChange={handleRollChange}
                    required
                    maxLength={12}
                    autoComplete="off"
                    className="h-10 pl-9 uppercase"
                  />
                </div>
                {form.branch && (
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <StatusBadge tone={BRANCH_TONE[form.branch] || "brand"}>{form.branch}</StatusBadge>
                    {BRANCH_MAP[form.branch] || form.branch}
                  </div>
                )}
              </div>
            )}

            {form.user_type === "Faculty" && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="department">Department</Label>
                {departments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
                    No departments found yet. Ask an admin to run{" "}
                    <code className="rounded bg-background px-1 py-0.5 text-primary">python manage.py setup_defaults</code>.
                  </div>
                ) : (
                  <Select
                    value={form.department}
                    onValueChange={(value) => setForm({ ...form, department: value })}
                  >
                    <SelectTrigger id="department" className="h-10 w-full">
                      <SelectValue placeholder="Select department">
                        {() => departments.find((d) => String(d.id) === form.department)?.department_name ?? "Select department"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {dept.department_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <Button type="submit" disabled={loading} size="lg" className="mt-1 h-10 gap-2">
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Creating account…</span>
                </>
              ) : (
                <>
                  <span>Create my account</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <div className="mt-4 rounded-xl border border-dashed border-primary/25 bg-primary/5 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
            Admin accounts are created separately by a system administrator.
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
