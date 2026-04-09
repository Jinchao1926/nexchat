import { desc, eq } from 'drizzle-orm';

import { type DatabaseClient, db } from '@/db';
import { message } from '@/db/schema';

import type {
  CreateMessageBody,
  UpdateMessageBody,
} from './message.validators';

export type MessageRecord = typeof message.$inferSelect;
type CreateMessageInput = CreateMessageBody & {
  conversationId: number;
  userId: string;
};

export function listMessagesByConversationId(
  conversationId: number,
  database: DatabaseClient = db
): MessageRecord[] {
  return database
    .select()
    .from(message)
    .where(eq(message.conversationId, conversationId))
    .orderBy(desc(message.id))
    .all();
}

export function getMessageById(
  id: number,
  database: DatabaseClient = db
): MessageRecord | undefined {
  return database.select().from(message).where(eq(message.id, id)).get();
}

export async function createMessage(
  input: CreateMessageInput,
  database: DatabaseClient = db
): Promise<MessageRecord | null> {
  const [created] = await database
    .insert(message)
    .values({
      conversationId: input.conversationId,
      userId: input.userId,
      role: input.role,
      content: input.content,
    })
    .returning();

  return created ?? null;
}

export async function updateMessage(
  id: number,
  input: UpdateMessageBody,
  database: DatabaseClient = db
): Promise<MessageRecord | null> {
  const [updated] = await database
    .update(message)
    .set({
      content: input.content,
    })
    .where(eq(message.id, id))
    .returning();

  return updated ?? null;
}

export async function deleteMessage(
  id: number,
  database: DatabaseClient = db
): Promise<boolean> {
  const result = await database.delete(message).where(eq(message.id, id)).run();

  return result.changes > 0;
}
