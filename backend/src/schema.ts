import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

const id = {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
};
const timestamps = {
    createdAt: integer("created_at", { mode: 'timestamp' }).default(sql`(cast (unixepoch () as int))`),
    updatedAt: integer("updated_at", { mode: 'timestamp' }).default(sql`(cast (unixepoch () as int))`),
    isDeleted: integer('is_deleted').notNull().default(0),
};
const schemaBase = {
    ...id,
    ...timestamps,
};

export const users = sqliteTable('users', {
    ...schemaBase,
    alias: text('alias', { length: 256 }).notNull(),
});

