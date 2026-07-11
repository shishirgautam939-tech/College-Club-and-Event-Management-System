import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import useAuth from "../hooks/useAuth";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  const { user } = useAuth();
  // Send each role back to its own home — pointing an admin at the student
  // dashboard would strand them in the reduced shared layout.
  const home = user?.role === "Admin" ? "/admin" : user?.role === "Faculty" ? "/faculty" : "/dashboard";

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-8" />
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Access denied</h1>
        <p className="mt-1 text-sm text-muted-foreground">You don&apos;t have permission to view this page.</p>
      </div>
      <Button size="lg" className="mt-2" nativeButton={false} render={<Link to={home} />}>
        Go to your dashboard
      </Button>
    </div>
  );
};

export default Unauthorized;
