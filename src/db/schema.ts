import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// --- NextAuth required tables ---

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// --- App tables ---

export const feeds = pgTable(
  "feeds",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    description: text("description"),
    siteUrl: text("site_url"),
    favicon: text("favicon"),
    lastFetched: timestamp("last_fetched"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [uniqueIndex("feeds_user_url_idx").on(t.userId, t.url)]
);

export const articles = pgTable(
  "articles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    feedId: text("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull(),
    title: text("title"),
    url: text("url"),
    summary: text("summary"),
    author: text("author"),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at"),
    fetchedAt: timestamp("fetched_at").defaultNow(),
  },
  (t) => [uniqueIndex("articles_feed_guid_idx").on(t.feedId, t.guid)]
);

export const readStatus = pgTable(
  "read_status",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    articleId: text("article_id")
      .notNull()
      .references(() => articles.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at").defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.articleId] })]
);

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  feeds: many(feeds),
  readStatus: many(readStatus),
}));

export const feedsRelations = relations(feeds, ({ one, many }) => ({
  user: one(users, { fields: [feeds.userId], references: [users.id] }),
  articles: many(articles),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  feed: one(feeds, { fields: [articles.feedId], references: [feeds.id] }),
  readStatus: many(readStatus),
}));

export const readStatusRelations = relations(readStatus, ({ one }) => ({
  user: one(users, { fields: [readStatus.userId], references: [users.id] }),
  article: one(articles, {
    fields: [readStatus.articleId],
    references: [articles.id],
  }),
}));
