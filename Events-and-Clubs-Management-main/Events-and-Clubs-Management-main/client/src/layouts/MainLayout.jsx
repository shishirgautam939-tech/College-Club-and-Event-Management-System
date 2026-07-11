import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Calendar, Bookmark, ScanLine, Award, Plus, CheckSquare, LogOut, ShieldCheck } from "lucide-react";
import useAuth from "../hooks/useAuth";
import Logo from "../components/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const studentNav = [
  { to: "/dashboard", label: "Events", icon: Calendar },
  { to: "/my-events", label: "My Events", icon: Bookmark },
  { to: "/scan-attendance", label: "Scan QR", icon: ScanLine },
  { to: "/my-certificates", label: "Certificates", icon: Award },
  { to: "/events/propose", label: "Propose", icon: Plus },
];

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() || "")
    .join("") || "?";

const getNavItems = (role, eventsSubpath) => {
  if (role === "Faculty" || role === "Admin") {
    return [
      { to: "/dashboard", label: "Discover events", icon: Calendar },
      { to: "/faculty", label: "Approvals", icon: CheckSquare },
      // Admins browsing the shared layout always get a way back to the
      // full management console — the faculty view only exposes a subset
      // of the event tooling.
      ...(role === "Admin" ? [{ to: "/admin", label: "Admin console", icon: ShieldCheck }] : []),
      ...(eventsSubpath ? [{ to: eventsSubpath, label: "My event", icon: Bookmark }] : []),
    ];
  }
  return studentNav;
};

const getPageMeta = (pathname) => {
  if (pathname === "/dashboard") return { title: "Discover events", meta: "Browse and register for campus events" };
  if (pathname === "/my-events") return { title: "My events", meta: "Track registrations, attendance and certificates" };
  if (pathname === "/scan-attendance") return { title: "Check in with QR", meta: "Scan the code at the venue to mark attendance" };
  if (pathname === "/my-certificates") return { title: "My certificates", meta: "Download your participation certificates" };
  if (pathname === "/events/propose") return { title: "Propose an event", meta: "Submit a proposal for your club to run" };
  if (pathname.startsWith("/faculty")) return { title: "Approvals", meta: "Review and manage event proposals" };
  return { title: "Evento", meta: "" };
};

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const items = getNavItems(user?.role);
  const pageMeta = getPageMeta(location.pathname);
  const isActive = (to) => location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-2 py-3">
          <Logo light compact markSize={32} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton isActive={isActive(item.to)} render={<Link to={item.to} />}>
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton size="lg" className="data-popup-open:bg-sidebar-accent" />
              }
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {initialsOf(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-medium">{user?.name}</span>
                <span className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">{user?.role}</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur supports-backdrop-filter:bg-background/80 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{pageMeta.title}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="hidden sm:inline">Signed in as {user?.role}</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
