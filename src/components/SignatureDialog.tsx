import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, TextField, Alert, Chip, Divider
} from '@mui/material';
import { VerifiedUser, Lock, CheckCircle, PictureAsPdf } from '@mui/icons-material';
import { signatureApi, invoiceApi } from '../services/api';
import { Facture } from '../types';
import { generateFacturePDF } from '../utils/pdfGenerator';
import { useData } from '../contexts/DataContext';

interface SignatureDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: Facture;
  onSigned: () => void;
}

export const SignatureDialog: React.FC<SignatureDialogProps> = ({ open, onClose, invoice, onSigned }) => {
  const { clients } = useData();
  const [step, setStep] = useState<'generate' | 'sign' | 'success'>('generate');
  const [privateKey, setPrivateKey] = useState('');
  const [signing, setSigning] = useState(false);
  const [signedInvoice, setSignedInvoice] = useState<Facture | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ isValid: boolean; signedAt: string } | null>(null);

  const handleGenerateKeys = async () => {
    try {
      const data = await signatureApi.getKeys(invoice.client_id);
      setPrivateKey(data.privateKey);
      setStep('sign');
      toast.success('Clés générées. Copiez la clé privée avant de fermer!');
    } catch (err: any) {
      toast.error('Erreur de génération: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSign = async () => {
    if (!privateKey) { toast.error('Aucune clé privée disponible'); return; }
    setSigning(true);
    try {
      await signatureApi.sign(invoice.id, privateKey);
      const updated = await invoiceApi.get(invoice.id);
      setSignedInvoice(updated);
      setStep('success');
      toast.success('Facture signée numériquement!');
      onSigned();
    } catch (err: any) {
      toast.error('Erreur de signature: ' + (err.response?.data?.error || err.message));
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadPDF = () => {
    const client = clients.find(c => c.id === invoice.client_id);
    if (client && signedInvoice) {
      generateFacturePDF(signedInvoice, client);
      toast.success('PDF signé téléchargé!');
    } else if (client) {
      generateFacturePDF(invoice, client);
      toast.success('PDF téléchargé!');
    }
  };

  const handleVerify = async () => {
    try {
      const data = await signatureApi.verify(invoice.id);
      setVerifyResult(data);
      toast.success(data.isValid ? 'Signature valide!' : 'Signature invalide!');
    } catch (err: any) {
      toast.error('Erreur de vérification: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleClose = () => {
    setStep('generate');
    setPrivateKey('');
    setVerifyResult(null);
    setSignedInvoice(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <VerifiedUser color="primary" />
        Signature Administrative - {invoice.numero}
      </DialogTitle>
      <DialogContent>
        {step === 'generate' && (
          <Box sx={{ py: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Générer une paire de clés RSA pour signer numériquement cette facture.
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              La clé publique sera stockée sur le serveur. La clé privée ne sera affichée qu'une seule fois.
            </Typography>
            <Button variant="contained" onClick={handleGenerateKeys} startIcon={<Lock />} fullWidth>
              Générer les Clés
            </Button>
          </Box>
        )}

        {step === 'sign' && (
          <Box sx={{ py: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Copiez cette clé privée maintenant. Vous ne pourrez plus la voir après.
            </Alert>
            <TextField
              fullWidth multiline rows={6}
              label="Clé Privée (RSA)"
              value={privateKey}
              slotProps={{ htmlInput: { readOnly: true } }}
              sx={{ mb: 2 }}
            />
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" sx={{ mb: 2 }}>
              Cliquez sur Signer pour apposer la signature administrative.
              Cette signature confirme que l'administration valide cette facture.
            </Typography>
            <Button variant="contained" color="success" onClick={handleSign}
              disabled={signing} startIcon={<CheckCircle />} fullWidth>
              {signing ? 'Signature en cours...' : "Signer la Facture (Admin)"}
            </Button>
          </Box>
        )}

        {step === 'success' && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>Facture Signée!</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              La facture {invoice.numero} a été signée numériquement par l'administration.
              Le client peut télécharger le PDF signé comme preuve de validation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<PictureAsPdf />} onClick={handleDownloadPDF}>
                Télécharger PDF Signé
              </Button>
              <Button variant="outlined" onClick={handleVerify}>
                Vérifier Signature
              </Button>
            </Box>
            {verifyResult && (
              <Box sx={{ mt: 2 }}>
                <Chip
                  icon={verifyResult.isValid ? <CheckCircle /> : <Lock />}
                  label={verifyResult.isValid ? 'Signature Valide' : 'Signature Invalide'}
                  color={verifyResult.isValid ? 'success' : 'error'}
                />
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Signée le: {new Date(verifyResult.signedAt).toLocaleString('fr-FR')}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
};
