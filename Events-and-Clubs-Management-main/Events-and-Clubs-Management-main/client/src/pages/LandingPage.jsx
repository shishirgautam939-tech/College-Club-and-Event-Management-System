import { Link } from "react-router-dom";
import { ArrowRight, Award, ShieldCheck, Smartphone, Zap } from "lucide-react";
import Logo from "../components/Logo";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";

const features = [
  { Icon: Zap, title: "Proposals in minutes", sub: "Club managers submit, faculty approves — in a few clicks." },
  { Icon: Smartphone, title: "QR check-in", sub: "One scan marks attendance. No paper, no queues." },
  { Icon: Award, title: "Digital certificates", sub: "PDFs are issued automatically when an event wraps." },
  { Icon: ShieldCheck, title: "Role-aware access", sub: "Students, faculty and admins each get the right view." },
];

const flow = [
  { n: 1, text: <><strong>Propose</strong> an event from your club dashboard</> },
  { n: 2, text: <><strong>Approve</strong> from faculty — get live in minutes</> },
  { n: 3, text: <>Students <strong>scan</strong> the QR at the venue</> },
  { n: 4, text: <><strong>Certificates</strong> issued on completion</> },
];

const LandingPage = () => {
  return (
    <div className="flex min-h-svh flex-col bg-gradient-to-b from-background to-secondary/40">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="no-underline">
          <Logo compact markSize={36} />
        </Link>
        <Button variant="outline" nativeButton={false} render={<Link to="/login" />}>
          Sign in
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-8">
        <div className="grid w-full items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
          {/* Left — copy + features */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/8 px-3 py-1 text-xs font-semibold tracking-[0.1em] text-primary uppercase">
              <span aria-hidden="true">✦</span> Campus events, made simple
            </span>
            <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.05] font-extrabold tracking-tight text-foreground">
              One place for every <span className="text-primary">club, event</span> and certificate.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Evento brings proposals, registrations, QR check-in, attendance and digital
              certificates into a single calm workspace built for the whole campus.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2" nativeButton={false} render={<Link to="/login" />}>
                Sign in to your account
                <ArrowRight className="size-4" />
              </Button>
              <Button size="lg" variant="outline" nativeButton={false} render={<Link to="/register" />}>
                Create an account
              </Button>
            </div>

            <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-2.5 rounded-xl border bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:bg-card hover:shadow-sm"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <f.Icon className="size-4.5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — preview card */}
          <aside className="relative overflow-hidden rounded-2xl border bg-card p-6 shadow-md" aria-hidden="true">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-orange-500/5" />
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">This week</p>
                  <p className="mt-0.5 text-lg font-bold tracking-tight text-foreground">Campus at a glance</p>
                </div>
                <StatusBadge tone="success" dot>Live</StatusBadge>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ["12", "Upcoming"],
                  ["438", "Registered"],
                  ["96%", "Check-ins"],
                ].map(([num, label]) => (
                  <div key={label} className="rounded-xl border bg-background/80 p-3">
                    <div className="text-xl font-bold tracking-tight text-foreground">{num}</div>
                    <div className="mt-0.5 text-[0.68rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase">{label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-2.5">
                {flow.map((step) => (
                  <div key={step.n} className="flex items-center gap-3 rounded-xl border bg-background/80 p-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
                      {step.n}
                    </span>
                    <span className="text-sm text-foreground">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Evento · College Club and Event Management System
      </footer>
    </div>
  );
};

export default LandingPage;
