import * as React from 'react';
import { useMemo, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Button,
  ButtonGroup,
  TextField,
  Stack,
  useTheme,
  Paper,
} from '@mui/material';

const COLUMNS = [
  { field: 'id', headerName: 'ID', width: 80 },
  { field: 'nombre', headerName: 'Nombre', width: 200 },
  { field: 'edad', headerName: 'Edad', width: 100, type: 'number' },
  { field: 'ciudad', headerName: 'Ciudad', width: 160 },
  { field: 'pais', headerName: 'País', width: 140 },
];

const ROWS = [
  { id: 1, nombre: 'Andrés', edad: 28, ciudad: 'Cochabamba', pais: 'Bolivia' },
  { id: 2, nombre: 'Lucía', edad: 34, ciudad: 'La Paz', pais: 'Bolivia' },
  { id: 3, nombre: 'Carlos', edad: 22, ciudad: 'Santa Cruz', pais: 'Bolivia' },
];

const GROUPS = {
  TODOS: COLUMNS.map((c) => c.field),
  IDENTIFICACION: ['id', 'nombre', 'edad'],
  UBICACION: ['ciudad', 'pais'],
};

function makeVisibilityModel(fields) {
  const set = new Set(fields);
  return COLUMNS.reduce(
    (acc, c) => ({ ...acc, [c.field]: set.has(c.field) }),
    {}
  );
}

export default function TablaConToolbar() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [group, setGroup] = useState('TODOS');
  const [visibilityModel, setVisibilityModel] = useState(
    makeVisibilityModel(GROUPS.TODOS)
  );
  const [query, setQuery] = useState('');

  const handleGroup = (g) => {
    setGroup(g);
    setVisibilityModel(makeVisibilityModel(GROUPS[g]));
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROWS;
    return ROWS.filter((r) =>
      Object.values(r).some((v) =>
        String(v ?? '')
          .toLowerCase()
          .includes(q)
      )
    );
  }, [query]);

  const bg = isDark ? '#1e1e1e' : '#fff';
  const text = isDark ? '#f5f5f5' : '#000';
  const border = isDark ? '#444' : '#ddd';
  const hover = isDark ? '#2a2a2a' : '#f7f7f7';

  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: border,
        borderRadius: 2,
        overflow: 'hidden', // 👉 evita cualquier separación
        bgcolor: bg,
        color: text,
      }}
    >
      {/* Toolbar dentro del mismo Paper, solo con borde inferior */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          p: 1,
          bgcolor: bg,
          color: text,
          borderBottom: `1px solid ${border}`, // 👉 separador con el grid
        }}
      >
        <ButtonGroup size="small" variant="outlined">
          <Button
            onClick={() => handleGroup('TODOS')}
            variant={group === 'TODOS' ? 'contained' : 'outlined'}
          >
            Todos
          </Button>
          <Button
            onClick={() => handleGroup('IDENTIFICACION')}
            variant={group === 'IDENTIFICACION' ? 'contained' : 'outlined'}
          >
            Identificación
          </Button>
          <Button
            onClick={() => handleGroup('UBICACION')}
            variant={group === 'UBICACION' ? 'contained' : 'outlined'}
          >
            Ubicación
          </Button>
        </ButtonGroup>

        <Box sx={{ flex: 1 }} />
        <TextField
          size="small"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{
            '& .MuiInputBase-root': {
              bgcolor: isDark ? '#121212' : '#fff',
              color: text,
            },
            '& input::placeholder': { color: isDark ? '#aaa' : '#888' },
          }}
        />
      </Stack>

      {/* DataGrid sin su propio borde, para que se pegue a la toolbar */}
      <Box sx={{}}>
        <DataGrid
          rows={filteredRows}
          columns={COLUMNS}
          pageSize={5}
          disableRowSelectionOnClick
          columnVisibilityModel={visibilityModel}
          onColumnVisibilityModelChange={setVisibilityModel}
          sx={{
            border: 0, // 👉 sin borde propio
            bgcolor: bg,
            color: text,

            '& .MuiDataGrid-columnHeaders': {
              bgcolor: bg,
              borderBottom: `1px solid ${border}`,
              borderTop: 'none', // 👉 evita línea superior fantasma
            },
            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-topContainer': {
              bgcolor: bg,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              color: text,
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnSeparator': { color: border },
            '& .MuiDataGrid-cell': { borderRight: `1px solid ${border}` },
            '& .MuiDataGrid-row': {
              borderBottom: `1px solid ${border}`,
              '&:hover': { bgcolor: hover },
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus': {
              outline: 'none',
            },
            '& .MuiTablePagination-root': { bgcolor: bg, color: text },
          }}
        />
      </Box>
    </Paper>
  );
}
