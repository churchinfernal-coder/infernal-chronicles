// src/components/auth/ForgotPasswordForm.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ForgotPasswordFormProps {
  isDarkMode: boolean;
  onBack: () => void;
}

export const ForgotPasswordForm = ({ isDarkMode, onBack }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Reset Password",
      subtitle: "Enter your email to receive reset instructions",
      emailPlaceholder: "Email address",
      sendButton: "Send Reset Email",
      loading: "Sending.. .",
      backToLogin: "Back to login",
      resetEmailSent: "Password reset email sent!  Check your inbox."
    },
    es: {
      title: "Recuperar Contraseña",
      subtitle: "Ingresa tu correo para recibir instrucciones",
      emailPlaceholder: "Correo electrónico",
      sendButton: "Enviar Correo",
      loading: "Enviando...",
      backToLogin: "Volver al inicio de sesión",
      resetEmailSent: "¡Correo enviado!  Revisa tu bandeja de entrada."
    }
  };

  const t = (key: keyof typeof translations.en) => translations[language][key];

  const handleForgotPassword = async (e:  React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email. trim(), {
  redirectTo: 'https://infernalsocial.com/auth/reset-password', // ✅ FIXED
});

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(t("resetEmailSent"));
      setTimeout(() => onBack(), 2000);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset email");
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

      <form onSubmit={handleForgotPassword} className="space-y-4">
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
                ? "bg-white/10 border-white/20 text-white placeholder: text-white/40" 
                : "bg-gray-50 border-gray-300"
            }`}
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold py-6"
        >
          {loading ? t("loading") : t("sendButton")}
        </Button>
      </form>

      <button
        onClick={onBack}
        className={`w-full text-center text-sm mt-6 hover:underline ${
          isDarkMode ? "text-white/60 hover:text-white/80" : "text-gray-600 hover:text-gray-800"
        }`}
      >
        {t("backToLogin")}
      </button>
    </div>
  );
};