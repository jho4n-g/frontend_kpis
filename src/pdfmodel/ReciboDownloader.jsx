// ReciboDownloader.jsx
import React, { useMemo } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BlobProvider } from '@react-pdf/renderer';
import ReciboPDF from './recibo.jsx'; // Asegúrate de la ruta correcta

export default function ReciboDownloader(recibo) {
  // const recibo = {
  //   numero: 1198,
  //   fecha: '08/10/2025',
  //   cliente: 'Jhoan Sebastian Gutierrez Veleaco',
  //   items: [
  //     {
  //       descripcion: 'Cartón',
  //       cantidad: 5,
  //       um: 'Kg',
  //       precioUnit: 10,
  //       total: 50,
  //     },
  //     {
  //       descripcion: 'Cartón',
  //       cantidad: 5,
  //       um: 'Kg',
  //       precioUnit: 10,
  //       total: 50,
  //     },
  //     {
  //       descripcion: 'Cartón',
  //       cantidad: 5,
  //       um: 'Kg',
  //       precioUnit: 10,
  //       total: 50,
  //     },
  //     {
  //       descripcion: 'Cartón',
  //       cantidad: 5,
  //       um: 'Kg',
  //       precioUnit: 10,
  //       total: 50,
  //     },
  //     {
  //       descripcion: 'Cartón',
  //       cantidad: 5,
  //       um: 'Kg',
  //       precioUnit: 10,
  //       total: 50,
  //     },
  //     {
  //       descripcion: 'Cartón',
  //       cantidad: 5,
  //       um: 'Kg',
  //       precioUnit: 10,
  //       total: 50,
  //     },

  //     // agrega más ítems si quieres
  //   ],
  //   total: 50,
  //   montoEnLetras: 'CINCUENTA 00/100 BOLIVIANOS',
  //   observaciones: 'MATERIAL EN DESUSO',
  // };

  // Evita recrear el <Document> en cada render
  const doc = useMemo(() => <ReciboPDF recibo={recibo} />, [recibo]);

  return (
    <BlobProvider
      document={doc}
      fileName={`recibo_residuos_${recibo.numero}.pdf`}
    >
      {({ url, loading, error }) =>
        loading ? (
          'Generando vista...'
        ) : (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 14px',
              borderRadius: 8,
              background: '#2e7d32',
              color: 'white',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ver Recibo
          </a>
        )
      }
    </BlobProvider>
  );
}
