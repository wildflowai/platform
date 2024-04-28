import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  uuid,
  text,
  bigint,
  real,
  serial,
  timestamp,
} from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `sharktrack_${name}`);

export const users = createTable("users", {
  userId: uuid("user_id")
    .primaryKey()
    .default(sql`uuid_generate_v4()`),
  username: text("username").notNull(),
  email: text("email").notNull().unique(),
});
