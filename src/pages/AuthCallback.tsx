import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

// Define the Profile type matching your exact schema
interface Profile {
  id: string;
  user_id: string;
  username:  string;
  email: string;
  date_of_birth?:  string | null;
  age_verified?:  boolean | null;
  age_verified_at?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  is_premium?:  boolean | null;
  created_at?: string | null;
  updated_at?:  string | null;
  age?:  number | null;
  birthday?:  string | null;
  occupation?:  string | null;
  sexual_orientation?: string | null;
  relationship_status?: string | null;
  location?: string | null;
  website?: string | null;
  pronouns?: string | null;
  hometown?: string | null;
  currently_living?: string | null;
  nationality?: string | null;
  castle_music_url?: string | null;
  background_color?: string | null;
  background_gradient_from?: string | null;
  background_gradient_to?: string | null;
  use_gradient?: boolean | null;
  font_style?: string | null;
  text_color?: string | null;
  mood_status?: string | null;
  infernal_nickname?:  string | null;
  interests?:  string[] | null;
  infernal_identity?: string | null;
  header_image_url?:  string | null;
  header_position_x?: string | null;
  header_position_y?:  string | null;
  is_private?: boolean | null;
  is_verified?: boolean | null;
  purchased_skins?: string[] | null;
  tarot_credits?: number | null;
  tarot_credits_purchased_at?: string | null;
}

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase. auth.getSession();

        if (error) {
          console. error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (session?. user) {
          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            console.log('Profile error:', profileError);
            // Profile doesn't exist, redirect to profile setup
            navigate('/profile');
            return;
          }

          const userProfile = profile as Profile;

          // Check if profile is incomplete
          // Username is required but might be auto-generated from email
          const isEmailBasedUsername = userProfile.username. includes('@');
          const hasBasicInfo = userProfile.bio || userProfile.avatar_url;

          if (isEmailBasedUsername || ! hasBasicInfo) {
            console.log('Profile incomplete, redirecting to /profile');
            navigate('/profile');
            return;
          }

          // Profile exists and looks complete, go to dashboard
          console.log('Profile complete, redirecting to /dashboard');
          navigate('/dashboard');
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Callback handler error:', error);
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Completing your summoning ritual...</p>
      </div>
    </div>
  );
}