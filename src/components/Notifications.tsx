import { useGame } from '@/context/GameContext';
import type { Notification } from '@/types';
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
  Package,
  Gift,
} from 'lucide-react';

export default function Notifications() {
  const { notifications } = useGame();

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-success-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-error-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case 'case':
        return <Gift className="w-5 h-5" style={{ color: '#f59e0b' }} />;
      case 'drop':
        return <Package className="w-5 h-5 text-primary-500" />;
      default:
        return <Info className="w-5 h-5 text-accent-500" />;
    }
  };

  const getBg = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-success-500/30 bg-success-500/10';
      case 'error':
        return 'border-error-500/30 bg-error-500/10';
      case 'warning':
        return 'border-warning-500/30 bg-warning-500/10';
      case 'case':
        return 'border-warning-500/30 bg-warning-500/10';
      default:
        return 'border-accent-500/30 bg-accent-500/10';
    }
  };

  return (
    <div className="fixed top-3 right-3 z-50 flex flex-col gap-2 pointer-events-none w-[calc(100%-1.5rem)] max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`card flex items-center gap-2.5 px-3 py-2.5 animate-slide-in-right ${getBg(notif.type)}`}
        >
          {getIcon(notif.type)}
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100 flex-1">
            {notif.message}
          </span>
        </div>
      ))}
    </div>
  );
}
