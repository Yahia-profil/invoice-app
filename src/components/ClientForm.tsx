import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Box, Paper, TextField, Button, Typography, Container, alpha } from '@mui/material';
import { Client } from '../types';
import { clientApi } from '../services/api';

interface ClientFormProps {
  client?: Client;
  onSave: () => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({ client, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Omit<Client, 'id'>>({
    nom: client?.nom || '',
    email: client?.email || '',
    tel: client?.tel || '',
    adresse: client?.adresse || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (client) {
        await clientApi.update(client.id, formData);
        toast.success('Client modifié!');
      } else {
        await clientApi.create(formData);
        toast.success('Client ajouté!');
      }
      onSave();
    } catch (err: any) {
      toast.error('Erreur: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3, background: alpha('#ffffff', 0.8), backdropFilter: 'blur(10px)', border: 1, borderColor: 'divider' }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          {client ? 'Modifier le client' : 'Ajouter un client'}
        </Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(['nom', 'email', 'tel'] as const).map(field => (
              <TextField key={field} required fullWidth label={field === 'nom' ? 'Nom' : field === 'email' ? 'Email' : 'Téléphone'}
                name={field} type={field === 'email' ? 'email' : 'text'}
                value={formData[field]} onChange={handleChange} disabled={loading} />
            ))}
            <TextField required fullWidth multiline rows={3} label="Adresse"
              name="adresse" value={formData.adresse} onChange={handleChange} disabled={loading} />
          </Box>
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'En cours...' : (client ? 'Modifier' : 'Ajouter')}
            </Button>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>Annuler</Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};
