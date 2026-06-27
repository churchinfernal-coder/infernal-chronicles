import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PremiumGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  requiredPosts?:  number;
  requiredAccountAge?: number;
}

interface UserStats {
  postCount: number;
  accountAge: number;
  hasPremium: boolean;
}

export function PremiumGateModal({
  isOpen,
  onClose,
  serviceName,
  requiredPosts = 5,
  requiredAccountAge = 7,
}: PremiumGateModalProps) {
  const [userStats, setUserStats] = useState<UserStats>({
    postCount: 0,
    accountAge: 0,
    hasPremium:  false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      checkUserEligibility();
    }
  }, [isOpen]);

  async function checkUserEligibility() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (! user) {
        setUserStats({ postCount: 0, accountAge: 0, hasPremium: false });
        setLoading(false);
        return;
      }

      // Get user's post count
      const { count:  postCount } = await supabase
        .from('dungeon_albums')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Calculate account age in days
      const accountCreated = new Date(user.created_at);
      const now = new Date();
      const accountAge = Math.floor(
        (now. getTime() - accountCreated.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if user has any purchases
      let hasPremium = false;
      try {
        const { data: purchases, error } = await supabase
          .from('album_purchases')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!error && purchases && purchases.length > 0) {
          hasPremium = true;
        }
      } catch (err) {
        console.log('No purchases found or table not ready:', err);
        hasPremium = false;
      }

      setUserStats({
        postCount:  postCount || 0,
        accountAge,
        hasPremium,
      });
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setUserStats({ postCount: 0, accountAge: 0, hasPremium: false });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const meetsPostRequirement = userStats.postCount >= requiredPosts;
  const meetsAgeRequirement = userStats.accountAge >= requiredAccountAge;
  const canAccess = meetsPostRequirement && meetsAgeRequirement;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg border border-red-900/30 bg-black p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 transition-colors hover:text-white"
        >
          <X size={24} />
        </button>

        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-red-900/20 p-4">
            <svg
              className="h-12 w-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="mb-4 text-center text-2xl font-bold text-white">
          {serviceName}
        </h2>

        {loading ? (
          <div className="text-center text-gray-400">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-red-500"></div>
            <p>Checking your eligibility...</p>
          </div>
        ) : canAccess ? (
          <div className="text-center">
            <p className="mb-6 text-green-400">
              ✨ Coming Soon! This premium service is under construction. 
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            {/* Requirements */}
            <div className="mb-6 space-y-4">
              <p className="text-center text-gray-300">
                We're sorry, but you need to meet the following requirements to access premium services:
              </p>

              <div className="space-y-3">
                {/* Post Requirement */}
                <div
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    meetsPostRequirement
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {meetsPostRequirement ?  (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-sm text-gray-300">
                      Content Creation
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    {userStats.postCount} / {requiredPosts} posts
                  </span>
                </div>

                {/* Age Requirement */}
                <div
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    meetsAgeRequirement
                      ? 'border-green-500/30 bg-green-500/10'
                      : 'border-red-500/30 bg-red-500/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {meetsAgeRequirement ? (
                      <span className="text-green-400">✓</span>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                    <span className="text-sm text-gray-300">
                      Account Age
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-200">
                    {userStats.accountAge} / {requiredAccountAge} days
                  </span>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              {! meetsPostRequirement && (
                <button
                  onClick={onClose}
                  className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
                >
                  Create More Content
                </button>
              )}
              <button
                onClick={onClose}
                className="w-full rounded-lg border border-gray-700 px-6 py-3 font-semibold text-gray-300 transition-colors hover:bg-gray-900"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}