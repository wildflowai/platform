import "server-only";
import { db } from "./db/index";
import { auth } from "@clerk/nextjs/server";

export async function getUsers() {
  const user = auth();
  if (!user.userId) throw new Error("Not authenticated");
  return await db.query.users.findMany();
}
