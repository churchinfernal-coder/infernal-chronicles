// src/components/auth/LoginForm.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LoginFormProps {
  isDarkMode: boolean;
  onSwitchToSignup: () => void;
  onSwitchToForgotPassword: () => void;
}

export const LoginForm = ({ isDarkMode, onSwitchToSignup, onSwitchToForgotPassword }:  LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Infernal Social",
      subtitle: "Welcome to The Left Hand Path Community",
      emailPlaceholder: "Email address",
      passwordPlaceholder:  "Password",
      loginButton: "Sign In",
      loading: "Signing in...",
      forgotPassword: "Forgot your password?",
      noAccount: "Don't have an account?",
      signupLink: "Sign up",
      loginSuccess: "Login successful!"
    },
    es: {
      title: "Bienvenido de Nuevo",
      subtitle: "Inicia sesión en tu cuenta",
      emailPlaceholder: "Correo electrónico",
      passwordPlaceholder: "Contraseña",
      loginButton: "Iniciar Sesión",
      loading: "Iniciando sesión...",
      forgotPassword: "¿Olvidaste tu contraseña?",
      noAccount: "¿No tienes cuenta?",
      signupLink: "Regístrate",
      loginSuccess: "¡Inicio de sesión exitoso!"
    }
  };

  const t = (key: keyof typeof translations.en) => translations[language][key];

  const handleLogin = async (e: React. FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:  email.trim(),
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success(t("loginSuccess"));
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className={`text-3xl font-bold text-center mb-2 ${
        isDarkMode ? "text-white" : "text-gray-900"
      }`}>
        {t("title")}
      </h1>
      <p className={`text-center mb-8 text-sm ${
        isDarkMode ? "text-white/60" : "text-gray-600"
      }`}>
        {t("subtitle")}
      </p>

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div className="relative">
          <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
            isDarkMode ? "text-white/40" : "text-gray-400"
          }`} />
          <Input
            type="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`pl-10 ${
              isDarkMode 
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" 
                : "bg-gray-50 border-gray-300"
            }`}
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
            isDarkMode ? "text-white/40" : "text-gray-400"
          }`} />
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t("passwordPlaceholder")}
            value={password}
            onChange={(e) => setPassword(e.target. value)}
            required
            className={`pl-10 pr-10 ${
              isDarkMode 
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" 
                :  "bg-gray-50 border-gray-300"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(! showPassword)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 ${
              isDarkMode ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {showPassword ?  <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold py-6"
        >
          {loading ? t("loading") : t("loginButton")}
        </Button>
      </form>

      {/* Links */}
      <div className="mt-6 space-y-3">
        <button
          onClick={onSwitchToForgotPassword}
          className={`w-full text-center text-sm hover:underline ${
            isDarkMode ? "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {t("forgotPassword")}
        </button>

        <div className={`text-center text-sm ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
          {t("noAccount")}{" "}
          <button
            onClick={onSwitchToSignup}
            className={`font-semibold hover:underline ${
              isDarkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {t("signupLink")}
          </button>
        </div>
      </div>
    </div>
  );
};