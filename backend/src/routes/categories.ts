import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../index';
import { authMiddleware, adminOnly, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

const categorySchema = z.object({
  nom: z.string().min(1),
  tva: z.number().min(0).max(100),
});

router.get('/', async (_req: AuthRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { articles: true } } },
    orderBy: { id: 'asc' },
  });
  res.json(categories);
});

router.post('/', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.status(201).json(category);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  try {
    const data = categorySchema.partial().parse(req.body);
    const category = await prisma.category.update({ where: { id: Number(req.params.id) }, data });
    res.json(category);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: err.errors }); return; }
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', adminOnly, async (req: AuthRequest, res: Response) => {
  await prisma.category.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
