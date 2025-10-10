import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Snackbar, Alert } from '@mui/material';
import { setNotifyImpl } from './notifier';

// Tipo: { message, severity, autoHideDuration }
const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const [queue, setQueue] = useState([]); // cola de notis
  const [open, setOpen] = useState(false);
  const current = useRef(null);

  const processQueue = useCallback(() => {
    if (current.current || queue.length === 0) return;
    current.current = queue[0];
    setQueue((q) => q.slice(1));
    setOpen(true);
  }, [queue]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  const handleExited = useCallback(() => {
    current.current = null;
    processQueue();
  }, [processQueue]);

  const notify = useCallback(
    (opts) => {
      const {
        message,
        severity = 'info',
        autoHideDuration = 3500,
      } = opts || {};
      setQueue((q) => [...q, { message, severity, autoHideDuration }]);
      // si no hay una notificación mostrándose, intenta procesar
      setTimeout(processQueue, 0);
    },
    [processQueue]
  );

  const api = useMemo(
    () => ({
      notify,
      success: (message, ms) =>
        notify({ message, severity: 'success', autoHideDuration: ms }),
      info: (message, ms) =>
        notify({ message, severity: 'info', autoHideDuration: ms }),
      warn: (message, ms) =>
        notify({ message, severity: 'warning', autoHideDuration: ms }),
      error: (message, ms) =>
        notify({ message, severity: 'error', autoHideDuration: ms }),
    }),
    [notify]
  );
  React.useEffect(() => {
    setNotifyImpl(api);
  }, [api]);

  // dispara el procesado cuando cambia la cola
  React.useEffect(() => {
    processQueue();
  }, [queue, processQueue]);

  return (
    <NotificationsContext.Provider value={api}>
      {children}

      {/* Snackbar global */}
      <Snackbar
        key={current.current ? current.current.message : undefined}
        open={open}
        onClose={handleClose}
        autoHideDuration={current.current?.autoHideDuration ?? 3500}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionProps={{ onExited: handleExited }}
      >
        <Alert
          onClose={handleClose}
          severity={current.current?.severity ?? 'info'}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {current.current?.message}
        </Alert>
      </Snackbar>
    </NotificationsContext.Provider>
  );
}

export function useNotify() {
  const ctx = useContext(NotificationsContext);
  if (!ctx)
    throw new Error('useNotify debe usarse dentro de <NotificationsProvider>');
  return ctx;
}
