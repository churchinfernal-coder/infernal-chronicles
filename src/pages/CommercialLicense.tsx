import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CommercialLicense() {
  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Commercial License Agreement</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none">
          <p className="text-gray-400">Effective Date: January 2026</p>

          <h2>Grant of License</h2>
          <p>
            Wicked Works Pro subscribers are granted a non-exclusive, worldwide, royalty-free 
            commercial license to use, reproduce, display, and distribute designs created using 
            the Wicked Works Design Editor for commercial purposes.
          </p>

          <h2>Permitted Uses</h2>
          <ul>
            <li>✓ Commercial projects and client work</li>
            <li>✓ Marketing materials and advertisements</li>
            <li>✓ Print and digital products for sale</li>
            <li>✓ Business branding and logos</li>
            <li>✓ Social media content for commercial accounts</li>
            <li>✓ Website graphics and banners</li>
          </ul>

          <h2>Restrictions</h2>
          <ul>
            <li>✗ Cannot resell or redistribute templates as-is</li>
            <li>✗ Cannot claim ownership of AI-generated base images</li>
            <li>✗ Must maintain active subscription for continued commercial use</li>
          </ul>

          <h2>AI-Generated Content</h2>
          <p>
            Content generated using AI features is licensed for commercial use, but subscribers 
            acknowledge that AI-generated images may have similarities to other generated content. 
          </p>

          <h2>Attribution</h2>
          <p>
            No attribution is required for designs created with Wicked Works Pro. 
          </p>

          <h2>Termination</h2>
          <p>
            This license remains valid as long as you maintain an active Wicked Works Pro subscription.
            Upon cancellation, you retain rights to designs created during your active subscription period.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}