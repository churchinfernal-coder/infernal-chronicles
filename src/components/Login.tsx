import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Moon, Sun, Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import Footer from "@/components/Footer";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const { language, setLanguage } = useLanguage();

  const translations = {
    en: {
      loginSubtitle: "Sign in to access the platform",
      signupSubtitle: "Create your account",
      resetPasswordSubtitle: "Reset your password",
      emailPlaceholder: "Email address",
      passwordPlaceholder: "Password",
      loginButton: "Sign In",
      signupButton: "Sign Up",
      sendResetEmail: "Send Reset Email",
      loading: "Loading...",
      forgotPassword: "Forgot your password?",
      haveAccount: "Already have an account?",
      noAccount: "Don't have an account?",
      loginLink: "Sign in",
      signupLink: "Sign up",
      backToLogin: "Back to login",
      exclusivePlatform: "Exclusive platform for authorized users",
      loginSuccess: "Login successful!",
      signupSuccess: "Sign up successful!  Check your email to verify.",
      resetEmailSent: "Password reset email sent!  Check your inbox."
    },
    es: {
      loginSubtitle: "Inicia sesión para acceder a la plataforma",
      signupSubtitle: "Crea tu cuenta",
      resetPasswordSubtitle: "Recupera tu contraseña",
      emailPlaceholder: "Correo electrónico",
      passwordPlaceholder: "Contraseña",
      loginButton: "Iniciar Sesión",
      signupButton: "Crear Cuenta",
      sendResetEmail: "Enviar correo de recuperación",
      loading: "Cargando...",
      forgotPassword: "¿Olvidaste tu contraseña?",
      haveAccount: "¿Ya tienes cuenta? ",
      noAccount: "¿No tienes cuenta?",
      loginLink: "Inicia sesión",
      signupLink: "Regístrate",
      backToLogin: "Volver al inicio de sesión",
      exclusivePlatform: "Plataforma exclusiva para usuarios autorizados",
      loginSuccess: "¡Inicio de sesión exitoso!",
      signupSuccess: "¡Registro exitoso!  Revisa tu correo para verificar.",
      resetEmailSent: "¡Correo de recuperación enviado! Revisa tu bandeja de entrada."
    }
  };

  const t = (key: keyof typeof translations. en) => translations[language][key];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.session) {
        toast.success(t("loginSuccess"));
        window. location.href = "/dashboard";
      }
    } catch (err: any) {
      toast. error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      });

      if (error) {
        toast. error(error.message);
        return;
      }

      toast.success(t("signupSuccess"));
      setIsSignUp(false);
    } catch (err: any) {
      toast.error(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email. trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t("resetEmailSent"));
      setShowForgotPassword(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

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
                ? "bg-white/10 border-white/20 hover:bg-white/20" 
                : "bg-black/10 border-black/20 hover:bg-black/20"
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
              isDarkMode ?  "bg-white/10" : "bg-gray-100"
            }`}>
              <Lock className={`h-8 w-8 ${isDarkMode ? "text-white" : "text-gray-700"}`} />
            </div>
          </div>

          <h1 className={`text-3xl font-bold text-center mb-2 ${
            isDarkMode ?  "text-white" : "text-gray-900"
          }`}>
            Infernal Social
          </h1>
          <p className={`text-center mb-8 text-sm ${
            isDarkMode ? "text-white/60" : "text-gray-600"
          }`}>
            {showForgotPassword 
              ? t("resetPasswordSubtitle")
              : isSignUp
              ? t("signupSubtitle")
              : t("loginSubtitle")
            }
          </p>

          <form onSubmit={
            showForgotPassword ? handleForgotPassword : isSignUp ? handleSignUp : handleLogin
          } className="space-y-4">
            {/* Email Input */}
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
                    : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                }`}
              />
            </div>

            {/* Password Input */}
            {! showForgotPassword && (
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 ${
                  isDarkMode ?  "text-white/40" : "text-gray-400"
                }`} />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`pl-10 pr-10 ${
                    isDarkMode 
                      ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" 
                      : "bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                    isDarkMode ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold py-6 text-base"
            >
              {loading 
                ? t("loading")
                : showForgotPassword
                ? t("sendResetEmail")
                : isSignUp
                ? t("signupButton")
                : t("loginButton")
              }
            </Button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3">
            {! showForgotPassword && ! isSignUp && (
              <button
                onClick={() => setShowForgotPassword(true)}
                className={`w-full text-center text-sm hover:underline ${
                  isDarkMode ? "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {t("forgotPassword")}
              </button>
            )}

            {! showForgotPassword && (
              <div className={`text-center text-sm ${isDarkMode ? "text-white/60" : "text-gray-600"}`}>
                {isSignUp ? (
                  <>
                    {t("haveAccount")}{" "}
                    <button
                      onClick={() => setIsSignUp(false)}
                      className={`font-semibold hover:underline ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("loginLink")}
                    </button>
                  </>
                ) : (
                  <>
                    {t("noAccount")}{" "}
                    <button
                      onClick={() => setIsSignUp(true)}
                      className={`font-semibold hover:underline ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {t("signupLink")}
                    </button>
                  </>
                )}
              </div>
            )}

            {showForgotPassword && (
              <button
                onClick={() => setShowForgotPassword(false)}
                className={`w-full text-center text-sm hover:underline ${
                  isDarkMode ?  "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {t("backToLogin")}
              </button>
            )}
          </div>

          <p className={`text-center text-xs mt-8 ${
            isDarkMode ?  "text-white/40" : "text-gray-500"
          }`}>
            {t("exclusivePlatform")}
          </p>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};