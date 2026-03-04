import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from '../database';

interface DatabaseContextValue {
  db: SQLiteDatabase | null;
  isReady: boolean;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  isReady: false,
  error: null,
});

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getDatabase()
      .then((database) => {
        setDb(database);
        setIsReady(true);
      })
      .catch((err) => {
        console.error('Database initialization failed:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsReady(true);
      });
  }, []);

  return (
    <DatabaseContext.Provider value={{ db, isReady, error }}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

export function useDb(): SQLiteDatabase {
  const { db, isReady, error } = useDatabase();
  if (error) throw error;
  if (!isReady || !db) throw new Error('Database not ready');
  return db;
}
