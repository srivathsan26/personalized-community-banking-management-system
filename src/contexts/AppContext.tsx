import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { getSyncQueueCount, initDB, initializeSystemData } from '@/services/localDB';
import { isOnline, setupConnectivityListeners, syncAllPending } from '@/services/api';

interface AppContextType {
  isOnline: boolean;
  syncQueueCount: number;
  isSyncing: boolean;
  refreshSyncCount: () => Promise<void>;
  triggerSync: () => Promise<{ synced: number; failed: number; total: number }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(isOnline());
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize database
  useEffect(() => {
    async function init() {
      try {
        await initDB();
        await initializeSystemData();
        await refreshSyncCount();
      } catch (error) {
        console.error('App initialization failed:', error);
      } finally {
        setIsInitialized(true);
      }
    }
    init();
  }, []);

  // Setup connectivity listeners
  useEffect(() => {
    const cleanup = setupConnectivityListeners(
      () => setOnline(true),
      () => setOnline(false)
    );
    return cleanup;
  }, []);

  const refreshSyncCount = useCallback(async () => {
    const count = await getSyncQueueCount();
    setSyncQueueCount(count);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!online || isSyncing) {
      return { synced: 0, failed: 0, total: 0 };
    }

    setIsSyncing(true);
    try {
      const result = await syncAllPending();
      await refreshSyncCount();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [online, isSyncing, refreshSyncCount]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ 
      isOnline: online, 
      syncQueueCount, 
      isSyncing,
      refreshSyncCount,
      triggerSync 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
