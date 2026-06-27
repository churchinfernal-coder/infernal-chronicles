import React, { useRef, useCallback } from 'react';
import { Paperclip } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  activeChatId: string;
  authUserId: string;
  receiverId: string;
  onUploadComplete: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  activeChatId,
  authUserId,
  receiverId,
  onUploadComplete
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10485760) {
      toast.error('Archivo muy grande (máx 10MB)');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast. error('Tipo no soportado');
      return;
    }

    try {
      toast.info('Subiendo... ', { id: 'upload', duration: Infinity });

      const ext = file.name.split('.'). pop();
      const path = `${authUserId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('chat-attachments')
        .upload(path, file);

      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(path);

      const content = file.type.startsWith('image/')
        ? `📷 ${file.name}`
        : file.type.startsWith('video/')
        ? `🎥 ${file.name}`
        : `📎 ${file.name}`;

      await supabase.from('private_messages').insert({
        chat_id: activeChatId,
        sender_id: authUserId,
        receiver_id: receiverId,
        content,
        attachment_url: publicUrl,
        is_read: false
      });

      await supabase.from('private_chats').update({
        last_message: content,
        last_message_at: new Date().toISOString()
      }).eq('id', activeChatId);

      toast.dismiss('upload');
      toast.success('Archivo enviado');
      if (fileInputRef.current) fileInputRef.current.value = '';
      onUploadComplete();
    } catch (error: any) {
      toast.dismiss('upload');
      toast.error('Error al subir: ' + error.message);
    }
  }, [activeChatId, authUserId, receiverId, onUploadComplete]);

  return (
    <>
      <button
        className="icon-btn"
        onClick={() => fileInputRef.current?.click()}
        aria-label="Adjuntar archivo"
      >
        <Paperclip size={20} />
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept="image/*,video/*,. pdf"
        aria-label="Seleccionar archivo"
      />
    </>
  );
};