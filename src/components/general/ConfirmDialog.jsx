import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';

export default function ConfirmDialog({ open, title, subtitle, onClose }) {
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography>{subtitle}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose(false)}>Cancelar</Button>
        <Button variant="contained" onClick={() => onClose(true)}>
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
