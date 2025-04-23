
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10
});

export const db = drizzle(pool, { schema });

export async function checkHearts(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.id, parseInt(userId))
  });

  if (!user) return false;

  // Check if 24 hours have passed since last refill
  const now = new Date();
  const lastRefill = new Date(user.last_heart_refill);
  if (now.getTime() - lastRefill.getTime() >= 24 * 60 * 60 * 1000) {
    await db.update(schema.users)
      .set({ hearts: 5, last_heart_refill: now })
      .where(eq(schema.users.id, parseInt(userId)));
    return true;
  }

  return user.hearts > 0;
}

export async function decreaseHeart(userId: string): Promise<boolean> {
  const result = await db.update(schema.users)
    .set((users) => ({ hearts: sql`${users.hearts} - 1` }))
    .where(eq(schema.users.id, parseInt(userId)))
    .returning();

  return result.length > 0;
}
