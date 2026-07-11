import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  Loader2,
  Plus,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { getDashboardStats } from "../../api/users";
import PageHeader from "@/components/PageHeader";
import InlineAlert from "@/components/InlineAlert";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_ICON = {
  brand: "bg-primary/10 text-primary",
  violet: "bg-violet-50 text-violet-700",
  accent: "bg-orange-50 text-orange-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
};

const TONE_GLOW = {
  brand: "bg-primary/20",
  violet: "bg-violet-400/20",
  accent: "bg-orange-400/20",
  amber: "bg-amber-400/20",
  sky: "bg-sky-400/20",
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now] = useState(() => new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getDashboardStats();
        setStats(res.data);
      } catch {
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, [now]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        <span>Loading dashboard…</span>
      </div>
    );
  }

  if (error) {
    return <InlineAlert type="error">{error}</InlineAlert>;
  }

  const cards = [
    { label: "Students", value: stats.total_students, Icon: GraduationCap, tone: "brand", link: "/admin/students", hint: "Enrolled this term" },
    { label: "Faculty", value: stats.total_faculty, Icon: Users, tone: "violet", link: "/admin/faculty", hint: "Across departments" },
    { label: "Clubs", value: stats.total_clubs, Icon: Building2, tone: "accent", link: "/admin/clubs", hint: "Active organizations" },
    { label: "Pending events", value: stats.pending_events, Icon: Clock, tone: "amber", link: "/admin/events?tab=pending", hint: "Awaiting your review" },
    { label: "Approved events", value: stats.approved_events, Icon: CalendarCheck, tone: "sky", link: "/admin/events?tab=approved", hint: "Live & upcoming" },
  ];

  const quickActions = [
    { to: "/admin/users/create", Icon: UserPlus, tone: "brand", title: "Add a user", sub: "Create student, faculty, or staff" },
    { to: "/admin/clubs/create", Icon: Plus, tone: "accent", title: "Create a club", sub: "Spin up a new organization" },
    { to: "/admin/events?tab=pending", Icon: ClipboardList, tone: "violet", title: "Review proposals", sub: `${stats.pending_events} event${stats.pending_events === 1 ? "" : "s"} waiting` },
    { to: "/admin/events?tab=approved", Icon: Calendar, tone: "sky", title: "View approved events", sub: "Manage attendance & certificates" },
  ];

  const activity = [
    { Icon: GraduationCap, tone: "brand", title: `${stats.total_students} active students`, meta: "Enrolled across all branches" },
    { Icon: Building2, tone: "accent", title: `${stats.total_clubs} clubs running`, meta: "Drives events on campus" },
    { Icon: Users, tone: "violet", title: `${stats.total_faculty} faculty coordinators`, meta: "Mentoring & supervising clubs" },
    { Icon: Clock, tone: "amber", title: `${stats.pending_events} pending proposals`, meta: "Last refreshed just now" },
  ];

  const totalEngagement = (stats.total_students || 0) + (stats.total_faculty || 0) + (stats.total_clubs || 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={<><ShieldCheck className="size-3.5" /> Admin overview</>}
        title={`${greeting}, Administrator`}
        subtitle={`${dateLabel} — ${totalEngagement} active members across students, faculty, and clubs.`}
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="group block">
            <Card className="relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className={cn("pointer-events-none absolute top-0 right-0 size-20 rounded-full opacity-30 blur-2xl transition-opacity group-hover:opacity-50", TONE_GLOW[card.tone])} />
              <div className={cn("relative z-10 flex size-11 items-center justify-center rounded-xl", TONE_ICON[card.tone])}>
                <card.Icon className="size-5" />
              </div>
              <p className="relative z-10 mt-4 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{card.label}</p>
              <p className="relative z-10 mt-1 text-3xl font-bold tracking-tight text-foreground">{card.value}</p>
              <p className="relative z-10 mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <ArrowUpRight className="size-3.5 text-emerald-600" />
                {card.hint}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two-column lower section: quick actions + today */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="gap-0 p-0 lg:col-span-3">
          <div className="border-b px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">Quick actions</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Common admin tasks at your fingertips.</p>
          </div>
          <div className="grid gap-2 p-4 sm:grid-cols-2">
            {quickActions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 rounded-xl border p-3 transition-all hover:translate-x-0.5 hover:border-primary/20 hover:bg-muted/40"
              >
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE_ICON[action.tone])}>
                  <action.Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold text-foreground">{action.title}</span>
                  <span className="text-xs text-muted-foreground">{action.sub}</span>
                </span>
                <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground/60" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="gap-0 p-0 lg:col-span-2">
          <div className="border-b px-5 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">Today</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Snapshot of your campus right now.</p>
          </div>
          <div>
            {activity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 border-b px-5 py-3.5 last:border-0">
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", TONE_ICON[item.tone])}>
                  <item.Icon className="size-4" />
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  <span className="text-xs text-muted-foreground">{item.meta}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
