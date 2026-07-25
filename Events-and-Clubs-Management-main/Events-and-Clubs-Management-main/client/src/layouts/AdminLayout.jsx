import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  LayoutGrid,
  Calendar,
  ChevronRight,
  UserPlus,
  FolderPlus,
  LogOut,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { getClubs } from "../api/clubs";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
import { cn } from "@/lib/utils";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: Home },
  { to: "/admin/students", label: "Students", icon: Users },
  { to: "/admin/faculty", label: "Faculty", icon: Users },
  { to: "/admin/clubs", label: "Clubs", icon: LayoutGrid, hasSubmenu: "clubs" },
  { to: "/admin/events", label: "Events", icon: Calendar, hasSubmenu: "events" },
];

const initialsOf = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase() || "").join("") || "?";

const getPageMeta = (pathname) => {
  if (pathname === "/admin") return { title: "Overview", meta: "Snapshot of the campus" };
  if (pathname === "/admin/students") return { title: "Students", meta: "Browse and manage student records" };
  if (pathname === "/admin/faculty") return { title: "Faculty", meta: "Faculty members by department" };
  if (pathname === "/admin/clubs") return { title: "Clubs", meta: "Clubs, members, and coordinators" };
  if (pathname.startsWith("/admin/clubs/create")) return { title: "Create a club", meta: "Set up a new campus organization" };
  if (pathname === "/admin/events") return { title: "Events", meta: "Approve, run, and complete events" };
  if (pathname.includes("/attendance")) return { title: "Attendance", meta: "Mark attendance and complete the event" };
  if (pathname.includes("/users/create")) return { title: "Add a user", meta: "Create a new account" };
  if (pathname.includes("/users/") && pathname.includes("/edit")) return { title: "Edit user", meta: "Update account details" };
  return { title: "Admin", meta: "" };
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isClubsMenuOpen, setIsClubsMenuOpen] = useState(false);
  const [isEventsMenuOpen, setIsEventsMenuOpen] = useState(false);
  const [clubs, setClubs] = useState([]);
  const clubsRef = useRef(null);
  const eventsRef = useRef(null);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await getClubs();
        setClubs(res.data);
      } catch {
        // Silently fail — nav still works
      }
    };
    fetchClubs();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (clubsRef.current && !clubsRef.current.contains(e.target)) {
        setIsClubsMenuOpen(false);
      }
      if (eventsRef.current && !eventsRef.current.contains(e.target)) {
        setIsEventsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsClubsMenuOpen(false);
    setIsEventsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageMeta = getPageMeta(location.pathname);
  const isActive = (to) => location.pathname === to || (to !== "/admin" && location.pathname.startsWith(to + "/"));

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="px-2 py-3">
          <Logo light compact markSize={32} />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Manage</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => {
                  if (item.hasSubmenu === "clubs") {
                    return (
                      <SidebarMenuItem key={item.to}>
                        <div ref={clubsRef}>
                          <SidebarMenuButton
                            isActive={isActive(item.to)}
                            onClick={() => {
                              setIsClubsMenuOpen((prev) => !prev);
                              setIsEventsMenuOpen(false);
                            }}
                          >
                            <item.icon />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight className={cn("size-4 transition-transform", isClubsMenuOpen && "rotate-90")} />
                          </SidebarMenuButton>
                          {isClubsMenuOpen && (
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton render={<Link to="/admin/clubs" />}>All clubs</SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              {clubs.map((club) => (
                                <SidebarMenuSubItem key={club.id}>
                                  <SidebarMenuSubButton
                                    render={<Link to={`/admin/clubs?name=${encodeURIComponent(club.club_name)}`} />}
                                  >
                                    {club.club_name}
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          )}
                        </div>
                      </SidebarMenuItem>
                    );
                  }
                  if (item.hasSubmenu === "events") {
                    return (
                      <SidebarMenuItem key={item.to}>
                        <div ref={eventsRef}>
                          <SidebarMenuButton
                            isActive={isActive(item.to)}
                            onClick={() => {
                              setIsEventsMenuOpen((prev) => !prev);
                              setIsClubsMenuOpen(false);
                            }}
                          >
                            <item.icon />
                            <span className="flex-1 text-left">{item.label}</span>
                            <ChevronRight className={cn("size-4 transition-transform", isEventsMenuOpen && "rotate-90")} />
                          </SidebarMenuButton>
                          {isEventsMenuOpen && (
                            <SidebarMenuSub>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton render={<Link to="/admin/events?tab=pending" />}>Pending</SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton render={<Link to="/admin/events?tab=approved" />}>Approved</SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                              <SidebarMenuSubItem>
                                <SidebarMenuSubButton render={<Link to="/admin/events?tab=all" />}>All</SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            </SidebarMenuSub>
                          )}
                        </div>
                      </SidebarMenuItem>
                    );
                  }
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton isActive={isActive(item.to)} render={<Link to={item.to} />}>
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Quick</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/admin/users/create" />}>
                    <UserPlus />
                    <span>Add user</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/admin/clubs/create" />}>
                    <FolderPlus />
                    <span>Add club</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                <span className="text-xs text-sidebar-foreground/60 uppercase tracking-wide">Admin</span>
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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{pageMeta.title}</p>
            {pageMeta.meta && (
              <p className="hidden truncate text-xs text-muted-foreground sm:block">{pageMeta.meta}</p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-xs">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <span className="hidden sm:inline">Signed in as Admin</span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default AdminLayout;
