import React from 'react';
import { Box, Typography, Card, CardContent, alpha } from '@mui/material';
import {
  Receipt as ReceiptIcon, CheckCircle as PaidIcon,
  Cancel as RejectedIcon, VerifiedUser as ValidIcon,
  Edit as DraftIcon, Send as SubmittedIcon, VerifiedUser as SignedIcon
} from '@mui/icons-material';
import { Facture } from '../types';

interface ActivityTimelineProps {
  invoices: Facture[];
  limit?: number;
}

const statusIcons: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  payee: { icon: PaidIcon, color: '#10b981', label: 'payée' },
  rejetee: { icon: RejectedIcon, color: '#ef4444', label: 'rejetée' },
  validee_admin: { icon: ValidIcon, color: '#8b5cf6', label: 'validée admin' },
  signee: { icon: SignedIcon, color: '#10b981', label: 'signée' },
  soumise: { icon: SubmittedIcon, color: '#3b82f6', label: 'soumise' },
  brouillon: { icon: DraftIcon, color: '#6b7280', label: 'créée' },
};

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ invoices, limit = 5 }) => {
  const activities = invoices
    .sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime())
    .slice(0, limit)
    .map(invoice => {
      const config = statusIcons[invoice.statut] || { icon: ReceiptIcon, color: '#6366f1', label: 'créée' };
      return {
        message: `Facture ${invoice.numero} ${config.label}`,
        time: new Date(invoice.date_creation).toLocaleDateString('fr-FR'),
        icon: config.icon,
        color: config.color,
      };
    });

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
            Aucune activité récente
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>Activité récente</Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {activities.map((activity, index) => {
            const Icon = activity.icon;
            return (
              <Box key={index} sx={{
                display: 'flex', alignItems: 'flex-start', gap: 2, position: 'relative',
                pb: index !== activities.length - 1 ? 2 : 0,
                '&::before': index !== activities.length - 1 ? {
                  content: '""', position: 'absolute', left: 12, top: 28, bottom: 0,
                  width: 2, backgroundColor: alpha(activity.color, 0.2)
                } : {}
              }}>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%',
                  backgroundColor: alpha(activity.color, 0.15),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, zIndex: 1
                }}>
                  <Icon sx={{ fontSize: 14, color: activity.color }} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{activity.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{activity.time}</Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};
