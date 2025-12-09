import { defineRelations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const role = pgEnum("role", ["user", "admin"]);
export const category = pgEnum("category", [
  "news",
  "technology",
  "security",
  "business",
]);

export const user = pgTable("user", {
  id: uuid().unique().primaryKey().defaultRandom(),

  username: varchar({ length: 20 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 30 }).notNull().unique(),
  role: role().default("user"),

  created_at: timestamp({ withTimezone: true, precision: 6 }).defaultNow(),
  updated_at: timestamp({ withTimezone: true, precision: 6 })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const post = pgTable("post", {
  id: uuid().unique().primaryKey().defaultRandom(),
  user_id: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  title: text().notNull(),
  category: category().notNull(),
  excerpt: text().notNull(),
  content: text().notNull(),

  created_at: timestamp({ withTimezone: true, precision: 6 }).defaultNow(),
  updated_at: timestamp({ withTimezone: true, precision: 6 })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const comment = pgTable("comment", {
  id: uuid().unique().primaryKey().defaultRandom(),
  user_id: uuid()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  post_id: uuid()
    .notNull()
    .references(() => post.id, { onDelete: "cascade" }),

  content: text().notNull(),

  created_at: timestamp({ withTimezone: true, precision: 6 }).defaultNow(),
  updated_at: timestamp({ withTimezone: true, precision: 6 })
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const relations = defineRelations({ user, post, comment }, (r) => ({
  user: {
    posts: r.many.post(),
    comments: r.many.comment(),
  },

  post: {
    user: r.one.user({
      from: r.post.user_id,
      to: r.user.id,
    }),
    comments: r.many.comment(),
  },

  comment: {
    user: r.one.user({
      from: r.comment.user_id,
      to: r.user.id,
    }),
    post: r.one.post({
      from: r.comment.post_id,
      to: r.post.id,
    }),
  },
}));
