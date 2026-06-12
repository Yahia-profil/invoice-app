import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Divider,
  alpha
} from '@mui/material';
import { Facture, Client, Article } from '../types';

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoice: Partial<Facture>;
  client: Client | null;
  articles: (Article & { quantity: number; tva: number })[];
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  open,
  onClose,
  invoice,
  client,
  articles
}) => {
  const calculateArticleTotal = (prix_unitaire: number, quantity: number, tva: number) => {
    const ht = prix_unitaire * quantity;
    const tvaAmount = ht * (tva / 100);
    return { ht, tvaAmount, ttc: ht + tvaAmount };
  };

  const totals = articles.reduce(
    (acc, article) => {
      const { ht, tvaAmount, ttc } = calculateArticleTotal(
        article.prix_unitaire,
        article.quantity,
        article.tva
      );
      return {
        total_ht: acc.total_ht + ht,
        total_tva: acc.total_tva + tvaAmount,
        total_ttc: acc.total_ttc + ttc
      };
    },
    { total_ht: 0, total_tva: 0, total_ttc: 0 }
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'white' }}>
        Aperçu de la Facture
      </DialogTitle>
      <DialogContent sx={{ p: 4 }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            bgcolor: alpha('#f5f5f5', 0.5),
            border: `1px solid ${alpha('#000', 0.1)}`
          }}
        >
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
              FACTURE
            </Typography>
            <Typography variant="h6" color="text.secondary">
              #{invoice.numero}
            </Typography>
          </Box>

          {/* Client Info */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Client:
            </Typography>
            <Typography variant="body1">
              {client?.nom || 'Non spécifié'}
            </Typography>
            {client?.email && (
              <Typography variant="body2" color="text.secondary">
                {client.email}
              </Typography>
            )}
            {client?.tel && (
              <Typography variant="body2" color="text.secondary">
                {client.tel}
              </Typography>
            )}
            {client?.adresse && (
              <Typography variant="body2" color="text.secondary">
                {client.adresse}
              </Typography>
            )}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Articles Table */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', gap: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Désignation
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Prix HT
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                TVA
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Qté
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Total TTC
              </Typography>
            </Box>
            {articles.map((article, index) => {
              const { ttc } = calculateArticleTotal(
                article.prix_unitaire,
                article.quantity,
                article.tva
              );
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr',
                    gap: 1,
                    py: 1,
                    bgcolor: index % 2 === 0 ? alpha('#000', 0.02) : 'transparent',
                    px: 1
                  }}
                >
                  <Typography variant="body2">{article.designation}</Typography>
                  <Typography variant="body2">{article.prix_unitaire.toFixed(2)}€</Typography>
                  <Typography variant="body2">{article.tva}%</Typography>
                  <Typography variant="body2">{article.quantity}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {ttc.toFixed(2)}€
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ minWidth: 200 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total HT:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {totals.total_ht.toFixed(2)}€
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">TVA:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {totals.total_tva.toFixed(2)}€
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  pt: 1,
                  borderTop: '2px solid'
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Total TTC:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {totals.total_ttc.toFixed(2)}€
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Date */}
          <Box sx={{ mt: 4, pt: 2, borderTop: '1px solid' }}>
            <Typography variant="body2" color="text.secondary">
              Date de création: {invoice.date_creation ? new Date(invoice.date_creation).toLocaleDateString('fr-FR') : 'Non spécifiée'}
            </Typography>
          </Box>
        </Paper>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} variant="outlined">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
};
