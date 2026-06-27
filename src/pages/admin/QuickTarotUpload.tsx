import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Check, X } from 'lucide-react';

export default function QuickTarotUpload() {
  const [cards, setCards] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    const { data } = await supabase
      . from('tarot_cards')
      .select('id, name, image_url')
      .is('image_url', null)
      .order('card_number');
    setCards(data || []);
  };

  const uploadImage = async (file: File, cardId: string, cardName: string) => {
    setUploading(true);
    try {
      const fileName = `${cardId}.png`;
      const { error } = await supabase.storage
        .from('tarot-images')
        .upload(`tarot-cards/${fileName}`, file, { upsert: true });

      if (error) throw error;

      const { data:  { publicUrl } } = supabase.storage
        .from('tarot-images')
        .getPublicUrl(`tarot-cards/${fileName}`);

      await supabase
        .from('tarot_cards')
        .update({ image_url: publicUrl })
        .eq('id', cardId);

      toast.success(`${cardName} uploaded! `);
      fetchCards();
    } catch (error:  any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Upload Tarot Card Images</h1>
      <p className="text-gray-400 mb-8">{cards.length} cards missing images</p>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
        {cards. map((card) => (
          <Card key={card.id} className="p-3 bg-gray-900 border-red-600/30">
            <p className="text-xs text-white mb-2 truncate font-bold">{card.name}</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target. files[0], card.id, card.name)}
              className="hidden"
              id={`upload-${card.id}`}
              disabled={uploading}
            />
            <Button
              size="sm"
              onClick={() => document.getElementById(`upload-${card.id}`)?.click()}
              disabled={uploading}
              className="w-full bg-red-600 hover:bg-red-700 text-xs"
            >
              <Upload className="h-3 w-3 mr-1" />
              Upload
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}