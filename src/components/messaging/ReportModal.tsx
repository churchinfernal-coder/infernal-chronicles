import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  reporterId: string;
}

export function ReportModal({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  reporterId,
}: ReportModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<'spam' | 'abuse' | 'impersonation' | 'other'>('spam');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona una razón',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: reporterId,
          target_id: targetUserId,
          reason,
          description: description.trim() || null,
        });

      if (error) throw error;

      toast({
        title: 'Reporte enviado',
        description: 'Hemos recibido tu reporte. Lo revisaremos pronto.',
      });

      onOpenChange(false);
      setReason('spam');
      setDescription('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el reporte. Intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Reportar a {targetUserName}
          </DialogTitle>
          <DialogDescription>
            Selecciona la razón del reporte. Nuestro equipo revisará el caso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Razón del reporte</Label>
            <RadioGroup value={reason} onValueChange={(value: any) => setReason(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="spam" id="spam" />
                <Label htmlFor="spam" className="font-normal cursor-pointer">
                  Spam o contenido no deseado
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="abuse" id="abuse" />
                <Label htmlFor="abuse" className="font-normal cursor-pointer">
                  Abuso o acoso
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="impersonation" id="impersonation" />
                <Label htmlFor="impersonation" className="font-normal cursor-pointer">
                  Suplantación de identidad
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Otro
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Detalles adicionales (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Describe el problema..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} variant="destructive">
            {submitting ? 'Enviando...' : 'Enviar reporte'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
