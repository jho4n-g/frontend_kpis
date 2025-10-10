// AutoOpenPdf.jsx
import React, { useEffect } from 'react';
import { BlobProvider } from '@react-pdf/renderer';
import ReciboPDF from './recibo.jsx'; // ajusta la ruta

export default function AutoOpenPdf({ recibo, onDone }) {
  return (
    <BlobProvider document={<ReciboPDF recibo={recibo} />}>
      {({ url, loading, error }) => {
        useEffect(() => {
          if (!loading && url) {
            // abre en nueva pestaña
            window.open(url, '_blank', 'noopener,noreferrer');
            onDone?.();
          }
          if (error) {
            console.error(error);
            onDone?.(error);
          }
        }, [url, loading, error, onDone]);

        // No renderizamos nada visual
        return null;
      }}
    </BlobProvider>
  );
}
