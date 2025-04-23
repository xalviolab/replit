
import express from 'express';
import { db } from './db';
import { lessons, badges, users } from '@shared/schema';

const router = express.Router();

// Admin middleware
const isAdmin = async (req: any, res: any, next: any) => {
  const user = req.user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Lesson management
router.post('/lessons', isAdmin, async (req, res) => {
  const { title, content, xp_reward, is_premium } = req.body;
  const result = await db.insert(lessons).values({
    title,
    content,
    xp_reward,
    is_premium
  }).returning();
  res.json(result[0]);
});

// Badge management
router.post('/badges', isAdmin, async (req, res) => {
  const { name, description, condition_type, condition_value } = req.body;
  const result = await db.insert(badges).values({
    name,
    description,
    condition_type,
    condition_value
  }).returning();
  res.json(result[0]);
});

// User management
router.get('/users', isAdmin, async (req, res) => {
  const allUsers = await db.select().from(users);
  res.json(allUsers);
});

router.patch('/users/:id', isAdmin, async (req, res) => {
  const { role } = req.body;
  const result = await db.update(users)
    .set({ role })
    .where(eq(users.id, parseInt(req.params.id)))
    .returning();
  res.json(result[0]);
});

export default router;
