import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { PaymentSettingsPanel } from "@/components/admin/PaymentSettingsPanel";

interface SiteConfig {
  site_name: string;
  site_description: string;
  header_links: { label: string; url: string }[];
  footer_text: string;
  footer_links: { label: string; url: string }[];
}

export default function SiteConfigAdmin() {
  const [config, setConfig] = useState<SiteConfig>({
    site_name: "Devil's Diary",
    site_description: "Your infernal social network",
    header_links: [],
    footer_text: "",
    footer_links: []
  });

  const saveConfig = async () => {
    // Store in a site_config table or localStorage for now
    localStorage.setItem("site_config", JSON.stringify(config));
    toast({ title: "Site configuration saved" });
  };

  useEffect(() => {
    const saved = localStorage.getItem("site_config");
    if (saved) {
      setConfig(JSON.parse(saved));
    }
  }, []);

  const addHeaderLink = () => {
    setConfig({
      ...config,
      header_links: [...config.header_links, { label: "", url: "" }]
    });
  };

  const updateHeaderLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...config.header_links];
    updated[index][field] = value;
    setConfig({ ...config, header_links: updated });
  };

  const removeHeaderLink = (index: number) => {
    setConfig({
      ...config,
      header_links: config.header_links.filter((_, i) => i !== index)
    });
  };

  const addFooterLink = () => {
    setConfig({
      ...config,
      footer_links: [...config.footer_links, { label: "", url: "" }]
    });
  };

  const updateFooterLink = (index: number, field: "label" | "url", value: string) => {
    const updated = [...config.footer_links];
    updated[index][field] = value;
    setConfig({ ...config, footer_links: updated });
  };

  const removeFooterLink = (index: number) => {
    setConfig({
      ...config,
      footer_links: config.footer_links.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Site Name</label>
            <Input
              value={config.site_name}
              onChange={(e) => setConfig({ ...config, site_name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Site Description</label>
            <Textarea
              value={config.site_description}
              onChange={(e) => setConfig({ ...config, site_description: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Header Navigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {config.header_links.map((link, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="Label"
                value={link.label}
                onChange={(e) => updateHeaderLink(index, "label", e.target.value)}
              />
              <Input
                placeholder="URL"
                value={link.url}
                onChange={(e) => updateHeaderLink(index, "url", e.target.value)}
              />
              <Button variant="destructive" onClick={() => removeHeaderLink(index)}>
                Remove
              </Button>
            </div>
          ))}
          <Button onClick={addHeaderLink}>Add Header Link</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Footer Text</label>
            <Textarea
              value={config.footer_text}
              onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Footer Links</label>
            {config.footer_links.map((link, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Label"
                  value={link.label}
                  onChange={(e) => updateFooterLink(index, "label", e.target.value)}
                />
                <Input
                  placeholder="URL"
                  value={link.url}
                  onChange={(e) => updateFooterLink(index, "url", e.target.value)}
                />
                <Button variant="destructive" onClick={() => removeFooterLink(index)}>
                  Remove
                </Button>
              </div>
            ))}
            <Button onClick={addFooterLink}>Add Footer Link</Button>
          </div>
        </CardContent>
      </Card>

      <PaymentSettingsPanel />

      <Button onClick={saveConfig} className="w-full">
        <Save className="w-4 h-4 mr-2" />
        Save All Site Configuration
      </Button>
    </div>
  );
}
