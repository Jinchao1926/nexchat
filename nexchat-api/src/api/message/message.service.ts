import { and, desc, eq } from 'drizzle-orm';

import { type DatabaseClient, db } from '@/db';
import { message } from '@/db/schema';

import type { CreateMessageBody, UpdateMessageBody } from './message.schemas';

export type MessageRecord = typeof message.$inferSelect;
type CreateMessageInput = CreateMessageBody & {
  conversationId: number;
  userId: string;
  status?: MessageRecord['status'];
  provider?: string | null;
  model?: string | null;
  error?: string | null;
};

export type UpdateMessageStatusInput = {
  content?: string;
  status?: MessageRecord['status'];
  provider?: string | null;
  model?: string | null;
  error?: string | null;
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

export function listRecentCompletedMessagesByConversationId(
  conversationId: number,
  limit = 10,
  database: DatabaseClient = db
): MessageRecord[] {
  return database
    .select()
    .from(message)
    .where(
      and(
        eq(message.conversationId, conversationId),
        eq(message.status, 'completed')
      )
    )
    .orderBy(desc(message.id))
    .limit(limit)
    .all()
    .reverse();
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
      status: input.status ?? 'completed',
      provider: input.provider ?? null,
      model: input.model ?? null,
      error: input.error ?? null,
    })
    .returning();

  return created ?? null;
}

export async function updateMessageStatus(
  id: number,
  input: UpdateMessageStatusInput,
  database: DatabaseClient = db
): Promise<MessageRecord | null> {
  const [updated] = await database
    .update(message)
    .set(input)
    .where(eq(message.id, id))
    .returning();

  return updated ?? null;
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
