import { Router, type IRouter } from "express";
import { db, messagesTable, conversationsTable } from "@workspace/db";
import { eq, and, asc, or } from "drizzle-orm";

const router: IRouter = Router();

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

router.get("/:id/messages", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [conv] = await db.select().from(conversationsTable)
    .where(and(
      eq(conversationsTable.id, id),
      or(
        eq(conversationsTable.user1Id, userId),
        eq(conversationsTable.user2Id, userId)
      )
    ))
    .limit(1);

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(asc(messagesTable.createdAt));

  await db.update(messagesTable)
    .set({ readAt: new Date() })
    .where(and(
      eq(messagesTable.conversationId, id),
      eq(messagesTable.senderId, conv.user1Id === userId ? conv.user2Id : conv.user1Id)
    ));

  res.json(msgs.map(m => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
  })));
});

router.post("/:id/messages", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { id } = req.params;
  const { content } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!content || !content.trim()) {
    res.status(400).json({ error: "Content is required" });
    return;
  }

  const [conv] = await db.select().from(conversationsTable)
    .where(and(
      eq(conversationsTable.id, id),
      or(
        eq(conversationsTable.user1Id, userId),
        eq(conversationsTable.user2Id, userId)
      )
    ))
    .limit(1);

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgId = generateId();
  const [msg] = await db.insert(messagesTable).values({
    id: msgId,
    conversationId: id,
    senderId: userId,
    content: content.trim(),
  }).returning();

  await db.update(conversationsTable)
    .set({ updatedAt: new Date() })
    .where(eq(conversationsTable.id, id));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
    readAt: null,
  });
});

export default router;
