import { useEffect, useState } from "react";

export type DraftMedia = {
  url: string;
  path: string;
  type: "photo" | "video";
};

const DRAFT_KEY = "infernal.post.draft";

type DraftState = {
  content: string;
  postType: "whisper" | "scream" | "incantation";
  media: DraftMedia | null;
};

const defaultState: DraftState = {
  content: "",
  postType: "whisper",
  media: null,
};

export function usePostDraft() {
  const [draft, setDraft] = useState<DraftState>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as DraftState) : defaultState;
    } catch {
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {}
  }, [draft]);

  const setContent = (content: string) => setDraft((d) => ({ ...d, content }));
  const setPostType = (postType: DraftState["postType"]) => setDraft((d) => ({ ...d, postType }));
  const setMedia = (media: DraftMedia | null) => setDraft((d) => ({ ...d, media }));
  const clear = () => setDraft(defaultState);

  return { draft, setContent, setPostType, setMedia, clear };
}
