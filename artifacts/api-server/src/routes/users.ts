import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";

const router: IRouter = Router();

router.get("/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { displayName, avatarColor, avatarUrl } = req.body;

  const updates: Record<string, string> = {};
  if (displayName && typeof displayName === "string") updates.displayName = displayName;
  if (avatarColor && typeof avatarColor === "string") updates.avatarColor = avatarColor;
  if (typeof avatarUrl === "string") updates.avatarUrl = avatarUrl;

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarColor: user.avatarColor,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.get("/search", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  const q = req.query.q as string;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!q || q.trim().length < 1) {
    res.json([]);
    return;
  }

  const users = await db.select().from(usersTable)
    .where(ilike(usersTable.username, `%${q.trim()}%`))
    .limit(20);

  const filtered = users.filter(u => u.id !== userId);

  res.json(filtered.map(u => ({
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarColor: u.avatarColor,
    avatarUrl: u.avatarUrl ?? null,
    createdAt: u.createdAt.toISOString(),
  })));
});

export default router;
