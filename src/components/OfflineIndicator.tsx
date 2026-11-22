import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white shadow-lg print:hidden">
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Mode Offline — Data tersimpan lokal tetap bisa digunakan</span>
    </div>
  );
};
