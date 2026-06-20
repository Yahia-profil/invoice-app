import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const clientSchema = z.object({
  nom: z.string().min(1),
  email: z.string().email(),
  tel: z.string().min(1),
  adresse: z.string().min(1),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  const isAdmin = req.userRole === 'admin';
  const where = isAdmin ? {} : { user_id: req.userId };
  const clients = await prisma.client.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
  res.json(clients);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id as string, user_id: req.userId },
  });
  if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
  res.json(client);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: { ...data, user_id: req.userId! },
    });
    res.status(201).json(client);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = clientSchema.partial().parse(req.body);
    const client = await prisma.client.findFirst({
      where: { id: req.params.id as string, user_id: req.userId },
    });
    if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
    const updated = await prisma.client.update({ where: { id: req.params.id as string }, data });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const client = await prisma.client.findFirst({
    where: { id: req.params.id as string, user_id: req.userId },
  });
  if (!client) { res.status(404).json({ error: 'Client not found' }); return; }
  await prisma.client.delete({ where: { id: req.params.id as string } });
  res.json({ success: true });
});

export default router;
