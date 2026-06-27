// 
// ANALYTICS UTILITIES - Track Performance & User Behavior
// 

import { supabase } from '@/lib/supabase';

interface PageViewData {
  entity_type: 'country' | 'state' | 'city';
  entity_id: string;
  referrer?: string;
  language?: string;
}

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

class LandingAnalytics {
  private sessionId: string;
  private sessionStart: number;
  private maxScrollDepth: number;
  private pageViewId: string | null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.sessionStart = Date.now();
    this.maxScrollDepth = 0;
    this.pageViewId = null;
    this.initTracking();
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('landing_session_id');
    if (stored) return stored;

    const newId = generateSessionId();
    sessionStorage.setItem('landing_session_id', newId);
    return newId;
  }

  /**
   * Initialize tracking listeners
   */
  private initTracking() {
    // Track scroll depth
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });

    // Track visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Track before unload
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  /**
   * Track page view
   */
  async trackPageView(data: PageViewData): Promise<void> {
    try {
      const { data: viewData, error } = await supabase
        .from('landing_page_views')
        .insert({
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          session_id: this.sessionId,
          user_agent: navigator.userAgent,
          referrer: data.referrer || document.referrer || 'direct',
          language: data.language || navigator.language,
          device_type: this.getDeviceType(),
          browser: this.getBrowser(),
          os: this.getOS(),
          screen_resolution: `${window.screen.width}x${window.screen.height}`,
        })
        .select()
        .single();

      if (!error && viewData) {
        this.pageViewId = viewData.id;
      }
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  /**
   * Track CTA click
   */
  async trackCTAClick(ctaName: string, destination: string): Promise<void> {
    if (!this.pageViewId) return;

    try {
      await supabase
        .from('landing_page_views')
        .update({
          clicked_cta: true,
          cta_name: ctaName,
        })
        .eq('id', this.pageViewId);
    } catch (error) {
      console.error('Failed to track CTA click:', error);
    }
  }

  /**
   * Handle scroll tracking
   */
  private handleScroll() {
    const scrollPercentage = Math.round(
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100
    );

    if (scrollPercentage > this.maxScrollDepth) {
      this.maxScrollDepth = Math.min(scrollPercentage, 100);
    }
  }

  /**
   * Handle visibility change
   */
  private handleVisibilityChange() {
    if (document.hidden) {
      this.updateTimeOnPage();
    }
  }

  /**
   * Handle before unload
   */
  private handleBeforeUnload() {
    this.updateTimeOnPage();
  }

  /**
   * Update time on page
   */
  private async updateTimeOnPage() {
    if (!this.pageViewId) return;

    const timeOnPage = Math.round((Date.now() - this.sessionStart) / 1000);

    try {
      await supabase
        .from('landing_page_views')
        .update({
          time_on_page: timeOnPage,
          scroll_depth: this.maxScrollDepth,
        })
        .eq('id', this.pageViewId);
    } catch (error) {
      console.error('Failed to update time on page:', error);
    }
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get browser name
   */
  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Get OS name
   */
  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Win')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Get session duration
   */
  getSessionDuration(): number {
    return Date.now() - this.sessionStart;
  }

  /**
   * Get max scroll depth
   */
  getMaxScrollDepth(): number {
    return this.maxScrollDepth;
  }
}

// Singleton instance
export const analytics = new LandingAnalytics();
