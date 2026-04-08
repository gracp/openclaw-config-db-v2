import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { configs } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ params, request }) {
  const { id } = params;
  const { rating } = await request.json();
  
  if (!rating || rating < 1 || rating > 5) {
    return json({ error: 'Rating must be 1-5' }, { status: 400 });
  }
  
  // Get current config
  const config = await db.select().from(configs).where(eq(configs.id, id)).get();
  if (!config) {
    return json({ error: 'Config not found' }, { status: 404 });
  }
  
  // Update running average: new_avg = (old_avg * old_count + new_rating) / (old_count + 1)
  const newCount = config.ratingCount + 1;
  const newAvg = ((config.ratingAvg * config.ratingCount) + rating) / newCount;
  
  await db.update(configs)
    .set({ ratingAvg: newAvg, ratingCount: newCount })
    .where(eq(configs.id, id));
  
  return json({ ratingAvg: newAvg, ratingCount: newCount });
}
