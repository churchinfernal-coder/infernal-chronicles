import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Template {
  id: string;
  name: string;
  width: number;
  height: number;
  thumbnail?: string;
}

interface DesignTemplatesProps {
  onSelectTemplate: (template: Template) => void;
}

export function DesignTemplates({ onSelectTemplate }: DesignTemplatesProps) {
  const templates: Template[] = [
    { id: 'instagram-post', name: 'Instagram Post', width: 1080, height: 1080 },
    { id: 'instagram-story', name: 'Instagram Story', width: 1080, height: 1920 },
    { id: 'facebook-post', name: 'Facebook Post', width: 1200, height: 630 },
    { id: 'twitter-post', name: 'Twitter Post', width: 1200, height: 675 },
    { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', width: 1280, height: 720 },
    { id: 'linkedin-post', name: 'LinkedIn Post', width: 1200, height: 627 },
    { id: 'pinterest-pin', name: 'Pinterest Pin', width: 1000, height: 1500 },
    { id: 'custom', name: 'Custom Size', width: 1200, height: 800 },
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-sm font-semibold mb-3">Templates</h3>
        <ScrollArea className="h-[300px]">
          <div className="grid grid-cols-2 gap-2">
            {templates.map((template) => (
              <Button
                key={template.id}
                variant="outline"
                className="h-auto flex flex-col items-start p-3 hover:bg-primary/10"
                onClick={() => onSelectTemplate(template)}
              >
                <div className="w-full aspect-video bg-muted rounded mb-2 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">
                    {template.width}×{template.height}
                  </span>
                </div>
                <span className="text-xs font-medium">{template.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
