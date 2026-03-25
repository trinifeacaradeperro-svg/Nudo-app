import { Router, type IRouter } from "express";
import { db, conversationsTable, usersTable, messagesTable } from "@workspace/db";
import { eq, or, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

router.get("/", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const convs = await db.select().from(conversationsTable)
    .where(or(
      eq(conversationsTable.user1Id, userId),
      eq(conversationsTable.user2Id, userId)
    ))
    .orderBy(desc(conversationsTable.updatedAt));

  const result = await Promise.all(convs.map(async (conv) => {
    const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
    const [otherUser] = await db.select().from(usersTable).where(eq(usersTable.id, otherUserId)).limit(1);

    const [lastMsg] = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    const unreadResult = await db.select({ count: sql<number>`count(*)::int` })
      .from(messagesTable)
      .where(and(
        eq(messagesTable.conversationId, conv.id),
        eq(messagesTable.senderId, otherUserId),
        sql`${messagesTable.readAt} IS NULL`
      ));

    return {
      id: conv.id,
      otherUser: otherUser ? {
        id: otherUser.id,
        username: otherUser.username,
        displayName: otherUser.displayName,
        avatarColor: otherUser.avatarColor,
        createdAt: otherUser.createdAt.toISOString(),
      } : null,
      lastMessage: lastMsg ? {
        id: lastMsg.id,
        conversationId: lastMsg.conversationId,
        senderId: lastMsg.senderId,
        content: lastMsg.content,
        createdAt: lastMsg.createdAt.toISOString(),
        readAt: lastMsg.readAt ? lastMsg.readAt.toISOString() : null,
      } : null,
      unreadCount: unreadResult[0]?.count || 0,
      updatedAt: conv.updatedAt.toISOString(),
    };
  }));

  res.json(result);
});

router.post("/", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const { otherUserId } = req.body;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const existing = await db.select().from(conversationsTable)
    .where(or(
      and(eq(conversationsTable.user1Id, userId), eq(conversationsTable.user2Id, otherUserId)),
      and(eq(conversationsTable.user1Id, otherUserId), eq(conversationsTable.user2Id, userId))
    ))
    .limit(1);

  if (existing.length > 0) {
    const conv = existing[0];
    res.json({
      id: conv.id,
      user1Id: conv.user1Id,
      user2Id: conv.user2Id,
      createdAt: conv.createdAt.toISOString(),
    });
    return;
  }

  const id = generateId();
  const [conv] = await db.insert(conversationsTable).values({
    id,
    user1Id: userId,
    user2Id: otherUserId,
  }).returning();

  res.json({
    id: conv.id,
    user1Id: conv.user1Id,
    user2Id: conv.user2Id,
    createdAt: conv.createdAt.toISOString(),
  });
});

export default router;
