import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Code2, PenSquare, LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Code2 className="h-5 w-5 text-primary" />
          <span>DevVerse</span>
        </Link>
        <nav className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/write/new">
                  <PenSquare className="mr-1.5 h-4 w-4" /> Write
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth">Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
