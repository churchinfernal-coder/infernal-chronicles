import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import Footer from "@/components/Footer";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Simple Header for Public Pages */}
      <header className="sticky top-0 z-50 h-14 border-b border-border bg-background">
        <div className="h-full flex items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-lg font-bold">Infernal Social</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
}