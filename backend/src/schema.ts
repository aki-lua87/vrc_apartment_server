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
}, (table) => [
    uniqueIndex('room_number_idx').on(table.roomNumber),
    uniqueIndex('room_alias_id_idx').on(table.roomAliasId),
    uniqueIndex('login_id_idx').on(table.loginId),
]);

// 部屋リレーション
export const roomsRelations = relations(rooms, ({ one, many }) => ({
    interiors: many(interiors),
    playlists: many(playlists),
}));

// 内装タイプテーブル
export const interiorTypes = sqliteTable('interior_types', {
    ...schemaBase,
    // タイプコード（sofa, table, bed, chair, lamp, carpet など）
    code: text('code').notNull().unique(),
    // タイプ名（日本語表示用）
    name: text('name').notNull(),
}, (table) => [
    uniqueIndex('interior_type_code_idx').on(table.code),
]);

// 内装パターンテーブル
export const interiorPatterns = sqliteTable('interior_patterns', {
    ...schemaBase,
    // 内装タイプID
    typeId: integer('type_id').notNull().references(() => interiorTypes.id),
    // パターン名（日本語表示用）
    name: text('name').notNull(),
});

// 内装テーブル
export const interiors = sqliteTable('interiors', {
    ...schemaBase,
    // 部屋ID
    roomId: integer('room_id').notNull().references(() => rooms.id),
    // 内装パターンID
    patternId: integer('pattern_id').notNull().references(() => interiorPatterns.id),
});

// 内装リレーション
export const interiorsRelations = relations(interiors, ({ one }) => ({
    room: one(rooms, {
        fields: [interiors.roomId],
        references: [rooms.id],
    }),
    pattern: one(interiorPatterns, {
        fields: [interiors.patternId],
        references: [interiorPatterns.id],
    }),
}));

// 内装タイプリレーション
export const interiorTypesRelations = relations(interiorTypes, ({ many }) => ({
    interiors: many(interiors),
}));

// 内装パターンリレーション
export const interiorPatternsRelations = relations(interiorPatterns, ({ many }) => ({
    interiors: many(interiors),
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
