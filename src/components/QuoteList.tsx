import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Container, useTheme, alpha, Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { quoteApi } from '../services/api';
import { Quote } from '../types';

export const QuoteList: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [quotes, setQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    quoteApi.list().then(setQuotes).catch(() => toast.error('Erreur chargement devis'));
  }, []);

  const statusLabel: Record<string, { label: string; color: string }> = {
    envoye: { label: 'Envoyé', color: '#3b82f6' },
    accepte: { label: 'Accepté', color: '#10b981' },
    rejete: { label: 'Rejeté', color: '#ef4444' },
    expire: { label: 'Expiré', color: '#6b7280' },
  };

  return (
    <Container maxWidth="lg">
      <Paper elevation={0} sx={{ p: 4, mt: 2, borderRadius: 3, background: alpha(theme.palette.background.paper, 0.8), backdropFilter: 'blur(10px)', border: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>Liste des Devis</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/quote-form')}>
            Créer un devis
          </Button>
        </Box>

        {quotes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">Aucun devis trouvé</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>N° Devis</TableCell>
                  <TableCell>Client</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Validité</TableCell>
                  <TableCell>Total TTC</TableCell>
                  <TableCell>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {quotes.map((q) => {
                  const cfg = statusLabel[q.statut] || { label: q.statut, color: '#6b7280' };
                  return (
                    <TableRow key={q.id}>
                      <TableCell>{q.numero_devis}</TableCell>
                      <TableCell>{q.client_nom}</TableCell>
                      <TableCell>{new Date(q.date_creation).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{new Date(q.date_validite).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{q.total_ttc.toFixed(2)}€</TableCell>
                      <TableCell>
                        <Chip label={cfg.label} size="small" sx={{ backgroundColor: alpha(cfg.color, 0.1), color: cfg.color, fontWeight: 600 }} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};
