import { desc, eq } from 'drizzle-orm';

import { type DatabaseClient, db } from '@/db';
import { conversation } from '@/db/schema';

import type {
  CreateConversationBody,
  UpdateConversationBody,
} from './conversation.schemas';

export type ConversationRecord = typeof conversation.$inferSelect;

export function listConversationsByUserId(
  uid: string,
  database: DatabaseClient = db
): ConversationRecord[] {
  return database
    .select()
    .from(conversation)
    .where(eq(conversation.userId, uid))
    .orderBy(desc(conversation.id))
    .all();
}

export function getConversationById(
  id: number,
  database: DatabaseClient = db
): ConversationRecord | undefined {
  return database
    .select()
    .from(conversation)
    .where(eq(conversation.id, id))
    .get();
}

export async function createConversation(
  input: CreateConversationBody,
  userId: string,
  database: DatabaseClient = db
): Promise<ConversationRecord | null> {
  const [created] = await database
    .insert(conversation)
    .values({
      userId,
      title: input.title,
    })
    .returning();

  return created ?? null;
}

export async function updateConversation(
  id: number,
  input: UpdateConversationBody,
  database: DatabaseClient = db
): Promise<ConversationRecord | null> {
  const [updated] = await database
    .update(conversation)
    .set({
      title: input.title,
    })
    .where(eq(conversation.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteConversation(
  id: number,
  database: DatabaseClient = db
): Promise<boolean> {
  const result = await database
    .delete(conversation)
    .where(eq(conversation.id, id))
    .run();

  return result.changes > 0;
}
