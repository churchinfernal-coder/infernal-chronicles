// src/pages/OccultLibraryPdfReader.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2, Lock, RefreshCw } from "lucide-react";

export default function OccultLibraryPdfReader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [url, setUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPdf = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Access is verified server-side; we only ever receive a short-lived
      // signed URL when the user is genuinely entitled.
      const { data, error: fnError } = await supabase.functions.invoke("get-book-file", {
        body: { bookId },
      });

      if (fnError) {
        // Supabase wraps non-2xx responses; surface a readable message.
        const message = (fnError as any)?.context?.error || fnError.message || "Unable to open book";
        throw new Error(message);
      }
      if (!data?.url) {
        throw new Error(data?.error || "Unable to open book");
      }

      setUrl(data.url);
      setTitle(data.title || "");
    } catch (e: any) {
      setError(e.message || "Unable to open book");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPdf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between gap-4 p-4 border-b border-red-600/30 bg-gray-900">
        <Button
          onClick={() => navigate("/occult-library")}
          variant="outline"
          size="sm"
          className="border-red-600/50"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Library
        </Button>
        <h1 className="text-lg font-bold text-red-500 truncate flex-1 text-center">
          {title || "Occult Library"}
        </h1>
        <Button
          onClick={loadPdf}
          variant="outline"
          size="sm"
          className="border-red-600/50"
          disabled={loading}
          title="Refresh access link"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin text-red-500" />
            <p>Unlocking your book…</p>
          </div>
        ) : error ? (
          <div className="max-w-md text-center space-y-4">
            <Lock className="h-10 w-10 mx-auto text-red-500" />
            <p className="text-gray-300">{error}</p>
            <Button
              onClick={() => navigate("/occult-library")}
              className="bg-red-600 hover:bg-red-700"
            >
              Back to Library
            </Button>
          </div>
        ) : url ? (
          <iframe
            src={url}
            title={title || "Occult Library PDF"}
            className="w-full h-[calc(100vh-73px)] rounded border border-red-600/30 bg-white"
          />
        ) : null}
      </div>
    </div>
  );
}
