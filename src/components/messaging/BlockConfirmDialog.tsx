import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ShieldOff } from 'lucide-react';

interface BlockConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  userName: string;
  isBlocked: boolean;
}

export function BlockConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  userName,
  isBlocked,
}: BlockConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldOff className="w-5 h-5" />
            {isBlocked ? 'Desbloquear' : 'Bloquear'} a {userName}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBlocked ? (
              <>
                ¿Deseas desbloquear a {userName}? Podrán volver a enviarte mensajes y ver tu perfil.
              </>
            ) : (
              <>
                ¿Estás seguro que deseas bloquear a {userName}? No podrán enviarte mensajes ni ver tu perfil.
                Puedes desbloquearlo más tarde si cambias de opinión.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={isBlocked ? '' : 'bg-destructive hover:bg-destructive/90'}>
            {isBlocked ? 'Desbloquear' : 'Bloquear'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
