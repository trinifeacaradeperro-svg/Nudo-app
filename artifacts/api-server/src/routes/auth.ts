import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

router.post("/register", async (req, res) => {
  const { username, displayName, password, avatarColor } = req.body;

  if (!username || !displayName || !password) {
    res.status(400).json({ error: "Usuario, nombre y contraseña son requeridos" });
    return;
  }

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    res.status(400).json({ error: "Ese nombre de usuario ya está en uso" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = generateId();

  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#7C6EF5", "#FF9F43"];
  const color = avatarColor || colors[Math.floor(Math.random() * colors.length)];

  const [user] = await db
    .insert(usersTable)
    .values({ id, username: username.toLowerCase(), displayName, passwordHash, avatarColor: color })
    .returning();

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Usuario y contraseña son requeridos" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    return;
  }

  const token = Buffer.from(`${user.id}:${Date.now()}`).toString("base64");

  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

export default router;
