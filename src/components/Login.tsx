// src/components/Login.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Globe, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Footer from "@/components/Footer";
import { LoginForm } from "./auth/LoginForm";
import { SignupForm } from "./auth/SignupForm";
import { ForgotPasswordForm } from "./auth/ForgotPasswordForm";

export const Login = () => {
  const [view, setView] = useState<"login" | "signup" | "forgot">("login");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { language, setLanguage } = useLanguage();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "es" : "en");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className={`flex-1 flex items-center justify-center p-4 transition-colors ${
        isDarkMode ? "bg-black" : "bg-gray-100"
      }`}>
        {/* Theme & Language Toggles */}
        <div className="fixed top-4 right-4 flex gap-2 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className={`${
              isDarkMode 
                ?  "bg-white/10 border-white/20 hover:bg-white/20" 
                : "bg-black/10 border-black/20 hover: bg-black/20"
            }`}
          >
            {isDarkMode ?  <Sun className="h-5 w-5 text-white" /> : <Moon className="h-5 w-5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleLanguage}
            className={`${
              isDarkMode 
                ? "bg-white/10 border-white/20 hover:bg-white/20" 
                : "bg-black/10 border-black/20 hover:bg-black/20"
            }`}
          >
            <Globe className={`h-5 w-5 ${isDarkMode ? "text-white" : "text-black"}`} />
          </Button>
        </div>

        <div className={`w-full max-w-md border rounded-2xl p-8 transition-colors ${
          isDarkMode 
            ? "border-white/20 bg-black" 
            : "border-gray-300 bg-white shadow-xl"
        }`}>
          {/* Lock Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${
              isDarkMode ?  "bg-white/10" :  "bg-gray-100"
            }`}>
              <Lock className={`h-8 w-8 ${isDarkMode ?  "text-white" : "text-gray-700"}`} />
            </div>
          </div>

          {/* Render appropriate form */}
          {view === "login" && (
            <LoginForm
              isDarkMode={isDarkMode}
              onSwitchToSignup={() => setView("signup")}
              onSwitchToForgotPassword={() => setView("forgot")}
            />
          )}

          {view === "signup" && (
            <SignupForm
              isDarkMode={isDarkMode}
              onSwitchToLogin={() => setView("login")}
            />
          )}

          {view === "forgot" && (
            <ForgotPasswordForm
              isDarkMode={isDarkMode}
              onBack={() => setView("login")}
            />
          )}

          <p className={`text-center text-xs mt-8 ${
            isDarkMode ? "text-white/40" : "text-gray-500"
          }`}>
            {language === "en" 
              ? "Exclusive platform for authorized users 18+" 
              : "Plataforma exclusiva para usuarios autorizados 18+"
            }
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};