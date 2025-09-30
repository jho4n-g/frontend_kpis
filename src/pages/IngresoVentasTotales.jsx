import React, { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { LinearProgress } from '@mui/material';

import {
  formatMonthYear,
  formatPercent,
  formatNumber,
} from '../lib/convert.js';

export default function IngresoVentasTotales() {
  return <h1>Hola Mundo</h1>;
}
