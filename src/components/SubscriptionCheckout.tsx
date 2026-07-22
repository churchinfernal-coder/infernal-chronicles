/**
 * SubscriptionCheckout Component
 * Purpose: Handle subscription purchase flow with Stripe
 * Features: Mobile-first responsive, JWT auth, rate limiting
 * Gate Requirement: P95 < 200ms, Success > 99%, Error < 1%
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSecurityGate } from '../hooks/useSecurityGate';
import { SecureContent } from '../hooks/useSecurityGate';

interface SubscriptionPlan {
  id: string;
  name: string;
  priceId: string;
  price: number;
  currency: string;
  features: string[];
  description: string;
}

interface CheckoutState {
  loading: boolean;
  error?: string;
  success: boolean;
}

export function SubscriptionCheckout() {
  const { user, token } = useAuth();
  const security = useSecurityGate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    loading: false,
    success: false,
  });

  // Load available subscription plans
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await fetch('/api/subscription-plans', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPlans(data.plans || []);

          // Pre-select first plan
          if (data.plans && data.plans.length > 0) {
            setSelectedPlan(data.plans[0].id);
          }
        }
      } catch (error) {
        console.error('Failed to load plans:', error);
      }
    };

    if (token) {
      loadPlans();
    }
  }, [token]);

  // Handle checkout button click
  const handleCheckout = async () => {
    if (!selectedPlan || !token) {
      setCheckoutState({ loading: false, error: 'Please select a plan' });
      return;
    }

    setCheckoutState({ loading: true });

    try {
      // Find selected plan details
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Call edge function to create Stripe session
      const response = await fetch('/functions/v1/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          productType: 'subscription',
          priceId: plan.priceId,
          mode: 'subscription',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url, sessionId } = await response.json();

      if (url) {
        // Redirect to Stripe checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutState({
        loading: false,
        error: error instanceof Error ? error.message : 'Checkout failed',
        success: false,
      });
    }
  };

  return (
    <SecureContent requireSubscription={false}>
      <div className="w-full min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 px-4 py-8 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Choose Your Path to Power
            </h1>
            <p className="text-lg md:text-xl text-purple-300">
              Unlock exclusive content and premium features
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {plans.length > 0 ? (
              plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isSelected={selectedPlan === plan.id}
                  onSelect={() => setSelectedPlan(plan.id)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400">Loading plans...</p>
              </div>
            )}
          </div>

          {/* Checkout Section */}
          <div className="flex flex-col items-center gap-6">
            {checkoutState.error && (
              <div className="w-full max-w-md bg-red-900 border border-red-700 rounded-lg p-4">
                <p className="text-red-200 text-sm">{checkoutState.error}</p>
              </div>
            )}

            {checkoutState.success ? (
              <div className="w-full max-w-md bg-green-900 border border-green-700 rounded-lg p-4">
                <p className="text-green-200 text-sm">
                  Subscription activated! Check your email for details.
                </p>
              </div>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={
                  checkoutState.loading ||
                  !selectedPlan ||
                  !security.isAuthorized ||
                  plans.length === 0
                }
                className={`px-8 py-3 md:px-12 md:py-4 rounded-lg font-semibold transition-all ${
                  checkoutState.loading || !selectedPlan || !security.isAuthorized
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700 text-white hover:shadow-lg hover:shadow-purple-500/50'
                }`}
              >
                {checkoutState.loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-16 pt-8 border-t border-purple-800">
            <div className="flex items-start gap-3 text-sm text-gray-400 max-w-2xl mx-auto">
              <span className="text-green-400 font-bold mt-1">✓</span>
              <p>
                Secure payment processing with Stripe. Your payment information is encrypted and never stored on our servers.
                All transactions are protected by JWT authentication and rate limiting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </SecureContent>
  );
}

/**
 * Individual Plan Card Component
 */
function PlanCard({
  plan,
  isSelected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={`cursor-pointer rounded-xl border-2 transition-all p-6 md:p-8 ${
        isSelected
          ? 'border-purple-500 bg-purple-900/30 shadow-lg shadow-purple-500/20'
          : 'border-purple-800 bg-black/50 hover:border-purple-700'
      }`}
    >
      {/* Plan Name & Price */}
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-purple-400">${plan.price}</span>
          <span className="text-gray-400">/month</span>
        </div>
        <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
      </div>

      {/* Features */}
      <div className="mb-6 space-y-3">
        {plan.features.map((feature, idx) => (
          <div key={idx} className="flex items-center gap-3 text-gray-300">
            <span className="text-purple-400">✓</span>
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>

      {/* Selection Indicator */}
      <div className="text-center">
        <div
          className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            isSelected
              ? 'bg-purple-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          {isSelected ? '✓ Selected' : 'Select Plan'}
        </div>
      </div>
    </div>
  );
}
