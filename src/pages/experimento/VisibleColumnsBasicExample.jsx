import * as React from 'react';
import {
  DataGrid,
  gridClasses,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarQuickFilter,
} from '@mui/x-data-grid';
import { Box, Button, Menu, MenuItem } from '@mui/material';

const rows = [
  { id: 1, username: '@MUI', age: 38, desk: 'D-546' },
  { id: 2, username: '@MUI-X', age: 25, desk: 'D-042' },
];

// grupos de columnas (ajusta a tu tabla real)
const COLUMN_GROUPS = {
  Todos: ['username', 'age', 'desk'],
  Básicos: ['username', 'desk'],
  Numéricos: ['username', 'age'],
};

function CustomToolbar({ onSelectGroup }) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  return (
    <GridToolbarContainer>
      {/* Botones nativos */}
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter debounceMs={300} />
      {/* Grupo de columnas */}
      <Button
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ ml: 1 }}
      >
        Grupos
      </Button>
      <Menu open={open} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
        {Object.keys(COLUMN_GROUPS).map((g) => (
          <MenuItem
            key={g}
            onClick={() => {
              onSelectGroup(g);
              setAnchorEl(null);
            }}
          >
            {g}
          </MenuItem>
        ))}
      </Menu>
    </GridToolbarContainer>
  );
}

export default function VisibleColumnsBasicExample() {
  // modelo de visibilidad controlado para poder aplicar grupos
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState({
    username: true,
    age: true,
    desk: true,
  });

  const handleSelectGroup = (groupName) => {
    const all = Object.fromEntries(
      ['username', 'age', 'desk'].map((f) => [f, false])
    );
    // activa sólo las del grupo elegido
    COLUMN_GROUPS[groupName].forEach((f) => (all[f] = true));
    setColumnVisibilityModel(all);
  };

  return (
    <div style={{ height: 250, width: '100%' }}>
      <DataGrid
        columns={[
          {
            field: 'username',
            headerName: 'Usuario',
            hideable: false,
            flex: 1,
            minWidth: 140,
          },
          {
            field: 'age',
            headerName: 'Edad',
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            flex: 0.4,
            minWidth: 90,
          },
          { field: 'desk', headerName: 'Escritorio', flex: 0.6, minWidth: 120 },
        ]}
        rows={rows}
        showToolbar
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={setColumnVisibilityModel}
        // 👉 si usas Pro/Premium, puedes fijar usuario (descomenta):
        // pinnedColumns={{ left: ['username'] }}

        // toolbar con grupos + botones nativos
        slots={{
          toolbar: () => <CustomToolbar onSelectGroup={handleSelectGroup} />,
        }}
        getRowClassName={(p) =>
          p.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{
          // fondo y bordes exteriores negros
          backgroundColor: '#fff',
          border: '1px solid #000',
          borderRadius: 0,

          // borde superior (ya lo da el root) y línea bajo el toolbar
          '& .MuiDataGrid-toolbarContainer': {
            backgroundColor: '#fff',
            borderBottom: '1px solid #000',
          },

          // encabezados con línea inferior negra
          [`& .${gridClasses.columnHeaders}`]: {
            backgroundColor: '#fff',
            borderBottom: '1px solid #000',
          },
          '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 600 },

          // líneas verticales entre columnas (negras)
          '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
            borderRight: '1px solid #000',
            backgroundColor: '#fff',
          },
          '& .MuiDataGrid-columnHeader:last-of-type, & .MuiDataGrid-cell:last-of-type':
            {
              borderRight: 'none',
            },

          // líneas horizontales entre filas (negras)
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid #000',
            fontVariantNumeric: 'tabular-nums lining-nums',
          },

          // línea negra arriba del footer (si está visible)
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid #000',
            backgroundColor: '#fff',
          },

          // zebra + hover suaves (opcional; quita si no lo quieres)
          [`& .${gridClasses.row}.even`]: { backgroundColor: '#FAFAFA' },
          [`& .${gridClasses.row}:hover`]: { backgroundColor: '#F3F4F6' },

          // sin outline
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
          },
        }}
      />
    </div>
  );
}
