import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Trash2, Send, EyeOff, Star, Eye } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ChatAdminPanelProps {
  onInjectMessage: (content: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onToggleVisibility: (messageId: string, currentVisibility: string) => void;
  onToggleFeatured: (messageId: string, currentFeatured: boolean) => void;
  messageId?: string;
  currentVisibility?: string;
  currentFeatured?: boolean;
}

export function ChatAdminPanel({
  onInjectMessage,
  onDeleteMessage,
  onToggleVisibility,
  onToggleFeatured,
  messageId,
  currentVisibility,
  currentFeatured,
}: ChatAdminPanelProps) {
  const [injectContent, setInjectContent] = useState("");

  const handleInject = () => {
    if (injectContent.trim()) {
      onInjectMessage(injectContent.trim());
      setInjectContent("");
    }
  };

  return (
    <Card className="p-4 space-y-4 bg-destructive/5 border-destructive/20">
      <div className="flex items-center gap-2 text-destructive">
        <span className="text-sm font-medium">⚠️ Admin Controls</span>
      </div>

      {/* Inject Message */}
      <div className="flex gap-2">
        <Input
          placeholder="Inject admin message..."
          value={injectContent}
          onChange={(e) => setInjectContent(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInject()}
          className="flex-1"
        />
        <Button onClick={handleInject} size="sm" variant="destructive">
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Message Controls */}
      {messageId && (
        <div className="flex gap-2">
          <Button
            onClick={() => onToggleVisibility(messageId, currentVisibility || "visible")}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            {currentVisibility === "visible" ? (
              <><EyeOff className="h-4 w-4 mr-2" />Hide</>
            ) : (
              <><Eye className="h-4 w-4 mr-2" />Show</>
            )}
          </Button>

          <Button
            onClick={() => onToggleFeatured(messageId, currentFeatured || false)}
            size="sm"
            variant="outline"
            className="flex-1"
          >
            <Star className={`h-4 w-4 mr-2 ${currentFeatured ? "fill-yellow-500" : ""}`} />
            {currentFeatured ? "Unfeature" : "Feature"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Purge Message</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this message. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDeleteMessage(messageId)}>
                  Purge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Card>
  );
}
