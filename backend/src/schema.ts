import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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


// 部屋テーブル
export const rooms = sqliteTable('rooms', {
    ...schemaBase,
    // 部屋番号（0001〜9999）
    roomNumber: text('room_number', { length: 4 }).notNull().unique(),
    // 部屋名（ダッシュボードから設定可能）
    roomName: text('room_name', { length: 256 }),
    // 部屋エイリアスID - ゲームからのAPIアクセスに使用される複雑な文字列
    roomAliasId: text('room_alias_id', { length: 256 }).notNull().unique(),
    // ログインID - ダッシュボードへのログインに使用される文字列
    loginId: text('login_id', { length: 256 }).notNull().unique(),
    // 使用中フラグ
    isOccupied: integer('is_occupied').notNull().default(0),
}, (table) => ({
    roomNumberIdx: uniqueIndex('room_number_idx').on(table.roomNumber),
    roomAliasIdIdx: uniqueIndex('room_alias_id_idx').on(table.roomAliasId),
    loginIdIdx: uniqueIndex('login_id_idx').on(table.loginId),
}));

// 部屋リレーション
export const roomsRelations = relations(rooms, ({ one, many }) => ({
    interiors: many(interiors),
    playlists: many(playlists),
}));

// 内装タイプの列挙型（文字列として保存）
export type InteriorType = 'sofa' | 'table' | 'bed' | 'chair' | 'lamp' | 'carpet';

// 内装テーブル
export const interiors = sqliteTable('interiors', {
    ...schemaBase,
    // 内装タイプ（ソファ、テーブル、ベッドなど）
    type: text('type').notNull(),
    // 内装パターン（1: 表示しない、2: 縞模様、3: チェック模様など）
    pattern: integer('pattern').notNull(),
    // 部屋ID
    roomId: integer('room_id').notNull().references(() => rooms.id),
});

// 内装リレーション
export const interiorsRelations = relations(interiors, ({ one }) => ({
    room: one(rooms, {
        fields: [interiors.roomId],
        references: [rooms.id],
    }),
}));

// プレイリストテーブル
export const playlists = sqliteTable('playlists', {
    ...schemaBase,
    // プレイリストURL
    url: text('url').notNull(),
    // 部屋ID
    roomId: integer('room_id').notNull().references(() => rooms.id),
});

// プレイリストリレーション
export const playlistsRelations = relations(playlists, ({ one }) => ({
    room: one(rooms, {
        fields: [playlists.roomId],
        references: [rooms.id],
    }),
}));
