import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Skull, Flame } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateEmail = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-email', {
        body: { email }
      });

      if (error || !data?. valid) {
        toast({
          title: "Invalid Email",
          description: data?.reason || "Please use a valid email address",
          variant: "destructive"
        });
        return false;
      }
      return true;
    } catch (error) {
      console.error("Email validation error:", error);
      return false;
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Validate username
      if (username.length < 3) {
        toast({
          title:  "Invalid Username",
          description:  "Username must be at least 3 characters",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // 2. Validate password strength
      if (password.length < 8) {
        toast({
          title: "Weak Password",
          description: "Password must be at least 8 characters",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // 3. Validate email
      const isValidEmail = await validateEmail(email);
      if (!isValidEmail) {
        setLoading(false);
        return;
      }

      // 4. Check if username already exists
      const { data:  existingUser } = await supabase
        . from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingUser) {
        toast({
          title: "Username Taken",
          description: "This username is already in use",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // 5. Sign up WITHOUT email confirmation (auto-login)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options:  {
          data: {
            username:  username,
          }
        }
      });

      if (error) throw error;

      if (data?.user?.identities?.length === 0) {
        toast({
          title: "Email Already Registered",
          description: "This email is already registered. Try logging in instead.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Success - user is immediately logged in (no email confirmation)
      if (data.user && data.session) {
        setRedirecting(true);
        
        toast({
          title: "🏰 Welcome to the Infernal Realm",
          description: "Your castle awaits.. .",
          duration: 2000
        });

        // Redirect after 2.5 seconds of gothic animation
        setTimeout(() => {
          navigate('/profile');
        }, 2500);
      }

    } catch (error:  any) {
      toast({
        title: "Signup Failed",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  // Gothic Redirect Screen
  if (redirecting) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Blood Moon */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-red-600/30 rounded-full blur-3xl animate-pulse" />
          
          {/* Floating Particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-red-500/50 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-lg w-full mx-4">
          {/* Gothic Container */}
          <div className="relative border-2 border-red-900/50 rounded-lg bg-gradient-to-b from-gray-900 via-black to-gray-900 p-12 shadow-2xl backdrop-blur-sm">
            
            {/* Decorative Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-600 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-600 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-600 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-600 rounded-br-lg" />

            {/* Animated Castle Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-red-600/30 blur-2xl rounded-full animate-pulse" />
                
                {/* Main Icon Container */}
                <div className="relative bg-gradient-to-br from-red-950 via-black to-purple-950 p-8 rounded-full border-2 border-red-700/50 shadow-lg">
                  <div className="text-6xl animate-bounce">🏰</div>
                  
                  {/* Orbiting Skulls */}
                  <div className="absolute inset-0 animate-spin-slow">
                    <Skull className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-6 text-red-500" />
                  </div>
                  <div className="absolute inset-0 animate-spin-slow" style={{ animationDelay: '1s' }}>
                    <Flame className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Gothic Text */}
            <div className="text-center space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold font-serif">
                <span className="bg-gradient-to-r from-red-500 via-purple-500 to-red-500 bg-clip-text text-transparent animate-gradient gothic-glow">
                  Welcome, Infernal Soul
                </span>
              </h1>
              
              <div className="space-y-2">
                <p className="text-gray-400 text-lg font-serif italic tracking-wide">
                  The gates are opening... 
                </p>
                
                <p className="text-2xl md:text-3xl font-bold tracking-wider">
                  <span className="text-red-500 animate-flicker">⚔️</span>
                  {" "}
                  <span className="bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
                    YOUR INFERNAL CASTLE
                  </span>
                  {" "}
                  <span className="text-red-500 animate-flicker">⚔️</span>
                </p>

                <p className="text-sm text-gray-500 font-serif italic pt-2">
                  Preparing your throne of darkness...
                </p>
              </div>

              {/* Loading Animation */}
              <div className="flex justify-center items-center space-x-3 pt-6">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce shadow-lg shadow-red-500/50" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce shadow-lg shadow-purple-500/50" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-red-600 rounded-full animate-bounce shadow-lg shadow-red-500/50" style={{ animationDelay:  '300ms' }} />
              </div>

              {/* Dramatic Quote */}
              <div className="pt-4 border-t border-red-900/30 mt-8">
                <p className="text-xs text-gray-600 font-serif italic">
                  "Abandon all hope, ye who enter here..."
                </p>
                <p className="text-xs text-gray-700 mt-1">— Dante's Inferno</p>
              </div>
            </div>

            {/* Top Border Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse" />
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-600 to-transparent animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>

          {/* Skip Button */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full mt-6 text-gray-600 hover:text-red-500 transition-all duration-300 text-sm font-serif italic group"
          >
            <span className="group-hover:tracking-wider transition-all">
              Enter immediately →
            </span>
          </button>
        </div>
      </div>
    );
  }

  // Regular Signup Form
  return (
    <form onSubmit={handleSignup} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Username</label>
        <Input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="darkwitch666"
          required
          minLength={3}
          maxLength={20}
          className="border-red-900/30 focus:border-red-600"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          maxLength={320}
          autoComplete="email"
          className="border-red-900/30 focus:border-red-600"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Maximum 320 characters (RFC standard)
        </p>
      </div>

      <div>
        <label className="text-sm font-medium">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={8}
          autoComplete="new-password"
          className="border-red-900/30 focus:border-red-600"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Must be at least 8 characters
        </p>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-red-900 to-purple-900 hover:from-red-800 hover:to-purple-800 transition-all duration-300" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Summoning Your Castle...
          </>
        ) : (
          <>
            <Skull className="mr-2 h-4 w-4" />
            Enter the Infernal Realm
          </>
        )}
      </Button>
    </form>
  );
}