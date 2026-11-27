import { getDb } from "@/lib/mongo";
import type { ChatMessage, Conversation } from "@/lib/types";

/** On garde les 60 derniers messages (30 échanges) par utilisateur. */
const MAX_MESSAGES = 60;

/** Lit l'historique du coach. Une seule conversation par utilisateur. */
export async function getConversation(userId: string): Promise<ChatMessage[]> {
  const db = await getDb();
  const conversation = await db.collection<Conversation>("conversations").findOne(
    { userId },
    { projection: { messages: 1 } }
  );
  return (conversation?.messages ?? []).slice(-MAX_MESSAGES);
}

/** Ajoute des messages à la conversation, en conservant un historique borné. */
export async function appendMessages(userId: string, messages: ChatMessage[]): Promise<void> {
  if (messages.length === 0) return;

  const db = await getDb();
  await db.collection<Conversation>("conversations").updateOne(
    { userId },
    {
      $push: { messages: { $each: messages, $slice: -MAX_MESSAGES } },
      $set: { updatedAt: new Date() },
    },
    { upsert: true }
  );
}
