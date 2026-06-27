// 
// MAIN LANDING PAGE COMPONENT
// Mobile-First, SEO Optimized, Performance Focused
// 

import { useLandingPage } from '@/hooks/landing/useLandingPage';
import { generateBreadcrumbSchema } from '@/lib/landing/seo/seoHelpers';
import { LandingErrorBoundary } from '@/components/landing/LandingErrorBoundary';
import LandingLoading from '@/components/landing/LandingLoading';
import LandingSEO from '@/components/landing/seo/LandingSEO';
import Breadcrumb from '@/components/landing/shared/Breadcrumb';
import HeroSection from '@/components/landing/shared/HeroSection';
import AboutSection from '@/components/landing/shared/AboutSection';
import SubLocations from '@/components/landing/shared/SubLocations';
import FinalCTA from '@/components/landing/shared/FinalCTA';

export default function LandingPage() {
  const { loading, error, data } = useLandingPage();

  if (loading) {
    return <LandingLoading />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-gothic text-red-500">Location Not Found</h1>
          <p className="text-gray-400">{error || 'The requested location could not be found.'}</p>
        </div>
      </div>
    );
  }

  const { location, content, seo, subLocations } = data;
  const { country, state, city } = location;

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema(country, state, city);

  // Determine location type for sub-locations
  const locationType = city ? 'cities' : state ? 'cities' : 'states';
  const locationName = city?.name || state?.name || country.name;

  return (
    <LandingErrorBoundary>
      {/* SEO Meta Tags */}
      <LandingSEO metadata={seo} breadcrumbSchema={breadcrumbSchema} />

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 pt-8">
          <Breadcrumb country={country} state={state} city={city} />
        </div>

        <HeroSection
          h1Title={content.h1_title}
          h2Subtitle={content.h2_subtitle}
          heroDescription={content.hero_description}
          locationName={locationName}
          ctaPrimaryText={content.cta_primary_text}
          ctaSecondaryText={content.cta_secondary_text || undefined}
        />

        {/* About Section */}
        <AboutSection
          aboutTitle={content.about_title}
          aboutContent={content.about_content}
          feature1Title={content.feature_1_title || undefined}
          feature1Description={content.feature_1_description || undefined}
          feature2Title={content.feature_2_title || undefined}
          feature2Description={content.feature_2_description || undefined}
          feature3Title={content.feature_3_title || undefined}
          feature3Description={content.feature_3_description || undefined}
          locationName={locationName}
        />

        {/* Sub-Locations */}
        {subLocations.length > 0 && (
          <SubLocations
            locations={subLocations}
            countrySlug={country.slug}
            stateSlug={state?.slug}
            locationType={locationType as 'states' | 'cities'}
          />
        )}

        {/* Final CTA */}
        <FinalCTA />
      </div>
    </LandingErrorBoundary>
  );
}
