import { Router, Response } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../index';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/keys', async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const clientWhere: any = { id: req.query.clientId as string };
  if (!isAdmin) clientWhere.user_id = req.userId;
  const client = await prisma.client.findFirst({ where: clientWhere });
  if (!client) { res.status(404).json({ error: 'Client not found' }); return; }

  if (!client.public_key) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    await prisma.client.update({
      where: { id: client.id },
      data: { public_key: publicKey },
    });

    res.json({ publicKey, privateKey });
  } else {
    res.json({ publicKey: client.public_key });
  }
});

router.post('/sign', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({
      invoice_id: z.string().min(1),
      privateKey: z.string().min(1),
    }).parse(req.body);

    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoice_id },
      include: { client: true, articles: true },
    });
    if (!invoice) { res.status(404).json({ error: 'Invoice not found' }); return; }
    if (invoice.statut !== 'validee_admin') {
      res.status(400).json({ error: 'Invoice must be validated by admin before signing' });
      return;
    }

    const invoiceHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({
        numero: invoice.numero,
        total_ht: invoice.total_ht,
        total_ttc: invoice.total_ttc,
        articles: invoice.articles.map(a => ({
          designation: a.designation, quantite: a.quantite, prix_unitaire: a.prix_unitaire,
        })),
        client_id: invoice.client_id,
        date_creation: invoice.date_creation,
      }))
      .digest('hex');

    let signature: string;
    try {
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(invoiceHash);
      sign.end();
      signature = sign.sign(data.privateKey, 'base64');
    } catch {
      res.status(400).json({ error: 'Invalid private key' });
      return;
    }

    const publicKey = invoice.client.public_key;
    if (!publicKey) {
      res.status(400).json({ error: 'Client has no public key registered' });
      return;
    }

    const saved = await prisma.signature.create({
      data: {
        invoice_id: data.invoice_id,
        user_id: req.userId!,
        signature_data: signature,
        signed_hash: invoiceHash,
        public_key: publicKey,
      },
    });

    await prisma.invoice.update({
      where: { id: data.invoice_id },
      data: { statut: 'signee', validated_by_admin: true },
    });

    await prisma.auditLog.create({
      data: {
        invoice_id: data.invoice_id,
        action: 'status_change:signee',
        user_id: req.userId!,
        old_statut: invoice.statut,
        new_statut: 'signee',
        details: 'Digitally signed by admin',
      },
    });

    res.json({ signature: saved, invoiceHash });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify', async (req: AuthRequest, res: Response) => {
  try {
    const data = z.object({ invoice_id: z.string().min(1) }).parse(req.body);

    const invoice = await prisma.invoice.findFirst({
      where: { id: data.invoice_id },
      include: { signature: true, client: true },
    });
    if (!invoice || !invoice.signature) {
      res.status(404).json({ error: 'No signature found for this invoice' });
      return;
    }

    const sig = invoice.signature;
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(sig.signed_hash);
    verify.end();

    const isValid = verify.verify(sig.public_key, sig.signature_data, 'base64');

    res.json({
      isValid,
      signedAt: sig.signed_at,
      signedHash: sig.signed_hash,
      algorithm: sig.algorithm,
    });
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
