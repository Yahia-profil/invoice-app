import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Container, useTheme, alpha
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { Client } from '../types';
import { clientApi } from '../services/api';
import { ClientForm } from './ClientForm';
import { useData } from '../contexts/DataContext';

export const ClientList: React.FC = () => {
  const { clients, refreshClients } = useData();
  const theme = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>();

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`Supprimer le client "${client.nom}" ?`)) {
      try {
        await clientApi.delete(client.id);
        refreshClients();
        toast.success('Client supprimé!');
      } catch (err: any) {
        toast.error('Erreur: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleFormSave = () => {
    setShowForm(false);
    setSelectedClient(undefined);
    refreshClients();
  };

  if (showForm) {
    return <ClientForm client={selectedClient} onSave={handleFormSave} onCancel={() => { setShowForm(false); setSelectedClient(undefined); }} />;
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>Gestion des Clients</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>Ajouter un client</Button>
        </Box>

        {clients.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">Aucun client trouvé</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Téléphone</TableCell>
                  <TableCell>Adresse</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>{client.nom}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.tel}</TableCell>
                    <TableCell>{client.adresse}</TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEdit(client)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(client)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};
