// recibo.pdf.jsx
import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';

// Colores/estilo
const GREEN = '#6aa84f';
const BORDER = '#444';

// Ancho máximo de “cuerpo” (tabla + totales) para alinear TOTAL y firmas
const CONTENT_WIDTH = 520; // ajusta si cambias márgenes

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10 },

  // Cada recibo ocupa aprox. media página carta
  receiptWrap: {
    width: CONTENT_WIDTH,
    alignSelf: 'center',
    marginBottom: 40, // separación entre recibos
  },

  titleRow: {
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: -6,
  },
  title: { textAlign: 'center', fontSize: 16, fontWeight: 'bold', flex: 1 },
  boxRight: { width: 190, borderWidth: 1, borderColor: BORDER },
  boxRow: { flexDirection: 'row' },
  boxCellLabel: {
    flex: 1,
    padding: 6,
    borderRightWidth: 1,
    borderColor: BORDER,
    fontWeight: 'bold',
  },
  boxCellValue: { flex: 1, padding: 6 },

  // Banda cliente
  clientBand: { marginTop: 6, marginBottom: 6, flexDirection: 'row' },
  clientLabel: {
    backgroundColor: GREEN,
    color: 'white',
    fontWeight: 'bold',
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
    width: 190,
    textAlign: 'center',
  },
  clientValue: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },

  // Tabla
  table: { borderWidth: 1, borderColor: BORDER },
  headRow: { flexDirection: 'row', backgroundColor: GREEN },
  headCell: {
    color: 'white',
    fontWeight: 'bold',
    padding: 4,
    borderRightWidth: 1,
    borderColor: BORDER,
    textAlign: 'center',
  },
  row: { flexDirection: 'row' },
  cell: {
    padding: 4,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: BORDER,
    height: 20,
  },

  // TOTAL (pegado al borde derecho del contenido)
  totalLine: {
    marginTop: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalBox: {
    width: 220,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 5,
    fontWeight: 'bold',
    textAlign: 'right',
  },

  amountWords: { marginTop: 8, fontStyle: 'italic' },
  obs: { marginTop: 4 },

  // Firmas alineadas a la derecha
  signaturesWrapRight: {
    alignSelf: 'flex-end',
    width: 360, // ancho del bloque de firmas
    marginTop: 14,
  },
  signaturesRow: { flexDirection: 'row' },
  signBox: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: BORDER,
  },
  signBoxRight: { marginLeft: 10 },
  signLabels: { flexDirection: 'row', marginTop: 6 },
  signLabel: { flex: 1, fontSize: 10, textAlign: 'center' },

  disclaimer: { marginTop: 10, fontSize: 9, color: '#444' },
});

const money = (n) =>
  (Number(n) || 0).toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ---------- Un recibo (medio pliego) ----------
function SingleReceipt({ recibo }) {
  const items = recibo.items || [];
  const maxRows = 6;
  const filled = [...items];
  while (filled.length < maxRows) filled.push({}); // filas vacías

  const totalCalc =
    recibo.total ?? items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);

  return (
    <View style={styles.receiptWrap}>
      {/* Título + caja derecha */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>RECIBO DE COMPRA DE RESIDUOS</Text>
        <View style={styles.boxRight}>
          <View style={styles.boxRow}>
            <Text style={styles.boxCellLabel}>No RECIBO</Text>
            <Text style={styles.boxCellValue}>{recibo.numero}</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              borderTopWidth: 1,
              borderColor: BORDER,
            }}
          >
            <Text style={styles.boxCellLabel}>FECHA</Text>
            <Text style={styles.boxCellValue}>{recibo.fecha}</Text>
          </View>
        </View>
      </View>

      {/* Banda cliente */}
      <View style={styles.clientBand}>
        <Text style={styles.clientLabel}>NOMBRE DEL CLIENTE</Text>
        <Text style={styles.clientValue}>{recibo.cliente}</Text>
      </View>

      {/* Tabla */}
      <View style={styles.table}>
        <View style={styles.headRow}>
          <Text style={[styles.headCell, { width: 40 }]}>ITEM</Text>
          <Text style={[styles.headCell, { flex: 3 }]}>DESCRIPCIÓN</Text>
          <Text style={[styles.headCell, { flex: 1 }]}>CANTIDAD</Text>
          <Text style={[styles.headCell, { width: 60 }]}>U.M.</Text>
          <Text style={[styles.headCell, { flex: 1 }]}>P.U. (Bs)</Text>
          <Text style={[styles.headCell, { flex: 1.2 }]}>TOTAL (Bs)</Text>
        </View>

        {filled.map((it, i) => (
          <View key={i} style={styles.row}>
            <Text style={[styles.cell, { width: 40, textAlign: 'center' }]}>
              {it.descripcion ? i + 1 : ''}
            </Text>
            <Text style={[styles.cell, { flex: 3 }]}>
              {it.descripcion || ''}
            </Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
              {it.cantidad ?? ''}
            </Text>
            <Text style={[styles.cell, { width: 60, textAlign: 'center' }]}>
              {it.um ?? ''}
            </Text>
            <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
              {it.precioUnit != null ? money(it.precioUnit) : ''}
            </Text>
            <Text style={[styles.cell, { flex: 1.2, textAlign: 'right' }]}>
              {it.total != null ? money(it.total) : ''}
            </Text>
          </View>
        ))}
      </View>

      {/* TOTAL (pegado a la derecha del bloque) */}

      {/* TOTAL, monto y observaciones alineados */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginTop: 1,
        }}
      >
        {/* Columna izquierda (monto y observaciones) */}
        <View style={{ flex: 1, paddingRight: 7 }}>
          <Text style={styles.amountWords}>
            {recibo.montoEnLetras
              ? recibo.montoEnLetras
              : '__________________________ BOLIVIANOS'}
          </Text>
          <Text style={styles.obs}>
            OBSERVACIONES: {recibo.observaciones || ''}
          </Text>
        </View>

        {/* Columna derecha (total) */}
        <View>
          <Text style={styles.totalBox}>TOTAL Bs.: {money(totalCalc)}</Text>
        </View>
      </View>

      {/* Firmas a la derecha (dos cajas) */}
      <View style={styles.signaturesWrapRight}>
        <View style={styles.signaturesRow}>
          <View style={styles.signBox} />
          <View style={[styles.signBox, styles.signBoxRight]} />
        </View>
        <View style={styles.signLabels}>
          <Text style={styles.signLabel}>Firma del comprador</Text>
          <Text style={styles.signLabel}>Firma del vendedor</Text>
        </View>
      </View>

      {/* Nota */}
      <Text style={styles.disclaimer}>
        El comprador es responsable de la disposición final de la compra a
        COBOCE - Cerámica.
      </Text>
    </View>
  );
}

// ---------- Documento con dos recibos por página carta ----------
export default function ReciboPDF({ recibo }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <SingleReceipt recibo={recibo} />
        <SingleReceipt recibo={recibo} />
      </Page>
    </Document>
  );
}
