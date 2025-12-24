import React from "react";

interface MediaPreviewProps {
  src: string;
  type: "photo" | "video";
}

export const MediaPreview: React.FC<MediaPreviewProps> = ({ src, type }) => {
  const [errored, setErrored] = React.useState(false);

  if (!src) return null;

  return (
    <div className="relative mt-2">
      {!errored ? (
        type === "photo" ? (
          <img
            src={src}
            alt="Selected media preview"
            loading="lazy"
            className="max-h-48 rounded-lg w-auto"
            onError={() => setErrored(true)}
          />
        ) : (
          <video
            src={src}
            controls
            className="max-h-48 rounded-lg w-auto"
            onError={() => setErrored(true)}
          />
        )
      ) : (
        <div className="max-h-48 rounded-lg border border-border bg-muted/20 text-muted-foreground flex items-center justify-center p-6">
          Media failed to load. You can remove it and try again.
        </div>
      )}
    </div>
  );
};
