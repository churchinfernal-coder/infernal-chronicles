import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Wand2 } from "lucide-react";

interface WickedWorksInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WickedWorksInstructions = ({ open, onOpenChange }: WickedWorksInstructionsProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Wicked Works - User Guide
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Learn how to use our professional design tools and AI image generation
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="design" className="w-full mt-3 sm:mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="design" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Palette className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Design Editor</span>
              <span className="xs:hidden">Design</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
              <Wand2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">AI Generator</span>
              <span className="xs:hidden">AI</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-primary">Getting Started with Design Editor</h3>
              <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>Create a new project or open an existing one</li>
                <li>Use the toolbar to add shapes, text, and images to your canvas</li>
                <li>Select elements to customize their properties (color, size, position)</li>
                <li>Apply filters and effects to enhance your design</li>
                <li>Export your final design in various formats (PNG, JPG, SVG)</li>
              </ol>
            </div>

            <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-primary">Key Features</h3>
              <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><strong>Layers Panel:</strong> Organize and manage your design elements</li>
                <li><strong>Advanced Filters:</strong> Apply professional image filters and effects</li>
                <li><strong>Text Effects:</strong> Add stylized text with custom fonts and effects</li>
                <li><strong>Shape Tools:</strong> Create custom shapes and illustrations</li>
                <li><strong>Background Removal:</strong> AI-powered background removal tool</li>
                <li><strong>Image Upscaling:</strong> Enhance image quality up to 4x resolution</li>
              </ul>
            </div>

            <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-primary">Pro Tips</h3>
              <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>Use keyboard shortcuts for faster workflow (press ? for shortcuts)</li>
                <li>Group related elements together for easier management</li>
                <li>Save your work frequently to avoid losing progress</li>
                <li>Use templates to jumpstart your design process</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-base sm:text-lg font-semibold text-primary">AI Image Generation Basics</h3>
              <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>Enter a detailed text prompt describing what you want to create</li>
                <li>Select a style (Photorealistic, Fantasy, Cyberpunk, etc.)</li>
                <li>Choose color scheme, composition, and detail level</li>
                <li>Click "Generate" and wait for the AI to create your image</li>
                <li>Download or save to gallery once satisfied with the result</li>
              </ol>
            </div>

            <div className="space-y-2 sm:space-y-3 mt-4 sm:mt-6">
              <h3 className="text-base sm:text-lg font-semibold text-primary">Writing Effective Prompts</h3>
              <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li><strong>Be Specific:</strong> Include details about subject, setting, lighting, and mood</li>
                <li><strong>Use Descriptive Words:</strong> "vibrant sunset over misty mountains" vs "sunset"</li>
                <li><strong>Mention Style:</strong> Reference art styles, artists, or mediums</li>
                <li><strong>Include Composition:</strong> Specify camera angles, framing, or perspective</li>
                <li><strong>Add Quality Terms:</strong> "highly detailed", "8k resolution", "professional photography"</li>
              </ul>
            </div>

            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-semibold text-primary">Human Portrait Controls</h3>
              <p className="text-sm text-muted-foreground">
                For photorealistic human portraits, use the advanced Human Controls tab to specify:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                <li>Eye color, hair style, and skin tone</li>
                <li>Age range and facial expression</li>
                <li>Clothing style and background setting</li>
                <li>Pose and camera angle preferences</li>
              </ul>
            </div>

            <div className="space-y-3 mt-6">
              <h3 className="text-lg font-semibold text-primary">Example Prompts</h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground"><strong>Fantasy:</strong> "A mystical forest at twilight with glowing mushrooms and fireflies, magical atmosphere, highly detailed, fantasy art style"</p>
                <p className="text-muted-foreground"><strong>Portrait:</strong> "Professional headshot of a confident business woman, studio lighting, sharp focus, neutral background, 8k quality"</p>
                <p className="text-muted-foreground"><strong>Abstract:</strong> "Vibrant abstract geometric shapes, bold colors, modern minimalist style, clean composition"</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
