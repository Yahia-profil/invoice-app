import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Box
} from '@mui/material';
import { getCompanyInfo, saveCompanyInfo, CompanyInfo } from '../utils/companyConfig';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const CompanySettingsDialog: React.FC<Props> = ({ open, onClose }) => {
  const current = getCompanyInfo();
  const [form, setForm] = useState<CompanyInfo>({ ...current });

  const handleSave = () => {
    saveCompanyInfo(form);
    toast.success('Informations société mises à jour');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Informations Société</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} fullWidth />
          <TextField label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
          <TextField label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <TextField label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} fullWidth />
          <TextField label="SIRET" value={form.siret} onChange={(e) => setForm({ ...form, siret: e.target.value })} fullWidth />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button onClick={handleSave} variant="contained">Enregistrer</Button>
      </DialogActions>
    </Dialog>
  );
};
