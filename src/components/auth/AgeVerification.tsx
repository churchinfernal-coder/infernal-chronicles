// src/components/auth/AgeVerification.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface AgeVerificationProps {
  onVerified: (dateOfBirth: string) => void;
  isDarkMode: boolean;
}

export const AgeVerification = ({ onVerified, isDarkMode }: AgeVerificationProps) => {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState("");

  const verifyAge = () => {
    const birthDate = new Date(`${year}-${month. padStart(2, '0')}-${day.padStart(2, '0')}`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (isNaN(age) || age < 0 || age > 120) {
      setError("Please enter a valid date of birth");
      return;
    }

    if (age < 18) {
      setError("You must be 18 or older to create an account");
      return;
    }

    onVerified(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
  };

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-lg border ${
        isDarkMode ?  "bg-red-950/20 border-red-600/30" : "bg-red-50 border-red-200"
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-5 w-5 mt-0.5 ${isDarkMode ?  "text-red-400" :  "text-red-600"}`} />
          <div>
            <h3 className={`font-semibold mb-1 ${isDarkMode ?  "text-red-400" :  "text-red-600"}`}>
              Age Verification Required
            </h3>
            <p className={`text-sm ${isDarkMode ? "text-white/70" : "text-gray-700"}`}>
              You must be 18 years or older to access this platform.  Please verify your age to continue. 
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Label className={isDarkMode ? "text-white" : "text-gray-900"}>
          Date of Birth
        </Label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Input
              type="number"
              placeholder="MM"
              min="1"
              max="12"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value. slice(0, 2));
                setError("");
              }}
              className={isDarkMode 
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" 
                : "bg-gray-50 border-gray-300"
              }
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="DD"
              min="1"
              max="31"
              value={day}
              onChange={(e) => {
                setDay(e.target.value.slice(0, 2));
                setError("");
              }}
              className={isDarkMode 
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" 
                : "bg-gray-50 border-gray-300"
              }
            />
          </div>
          <div>
            <Input
              type="number"
              placeholder="YYYY"
              min="1900"
              max={new Date().getFullYear()}
              value={year}
              onChange={(e) => {
                setYear(e.target.value. slice(0, 4));
                setError("");
              }}
              className={isDarkMode 
                ? "bg-white/10 border-white/20 text-white placeholder:text-white/40" 
                : "bg-gray-50 border-gray-300"
              }
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <Button
        onClick={verifyAge}
        disabled={!month || !day || ! year}
        className="w-full bg-[#B91C1C] hover:bg-[#991B1B] text-white"
      >
        Verify Age
      </Button>

      <p className={`text-xs text-center ${isDarkMode ? "text-white/40" : "text-gray-500"}`}>
        Your date of birth is used solely for age verification and is stored securely.
      </p>
    </div>
  );
};