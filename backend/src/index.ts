import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, isNull } from 'drizzle-orm';
import * as schema from './schema';

// Cloudflare Workersの環境変数の型定義
interface Env {
  DB: D1Database;
}

// データベース型定義
type Database = ReturnType<typeof drizzle<typeof schema>>;

// Honoアプリケーションの変数型定義
interface Variables {
  db: Database;
}

// Honoアプリケーションの作成
const app = new Hono<{ Bindings: Env; Variables: Variables }>();

// D1データベースの初期化とミドルウェア
app.use('*', async (c, next) => {
  // Cloudflare D1データベースの初期化
  const db = drizzle(c.env.DB, { schema });
  c.set('db', db);
  await next();
});

// ルートエンドポイント
app.get('/', (c) => {
  return c.text('VRC Apartment Server API by aki_lua87');
});

// 部屋一覧取得API
// 全ての部屋の部屋番号と使用状況を返却
app.get('/api/rooms', async (c) => {
  const db = c.get('db');

  try {
    // 全ての部屋を取得
    const rooms = await db.select({
      id: schema.rooms.id,
      roomNumber: schema.rooms.roomNumber,
      isOccupied: schema.rooms.isOccupied,
    }).from(schema.rooms).all();

    return c.json({
      rooms: rooms.map(room => ({
        roomNumber: room.roomNumber,
        isOccupied: room.isOccupied === 1,
      })),
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 部屋を自分のものにするAPI
// 部屋エイリアスIDを指定し、その部屋を使用中にする
app.get('/api/rooms/:roomAliasId/claim', async (c) => {
  const roomAliasId = c.req.param('roomAliasId');
  const db = c.get('db');

  try {
    // 部屋の検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.roomAliasId, roomAliasId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 部屋が既に使用中かチェック
    if (room.isOccupied === 1) {
      return c.json({ error: 'この部屋は既に使用されています' }, 400);
    }

    // ユーザーの作成
    // const newUser = await db.insert(schema.users).values({}).returning().get();

    // 部屋を使用中に更新
    await db.update(schema.rooms)
      .set({
        // userId: newUser.id,
        isOccupied: 1,
      })
      .where(eq(schema.rooms.id, room.id))
      .run();

    // 基本的な内装を追加
    const interiorTypes = ['sofa', 'table', 'bed', 'chair', 'lamp', 'carpet'];
    for (const type of interiorTypes) {
      await db.insert(schema.interiors).values({
        type,
        pattern: 1, // デフォルトパターン
        roomId: room.id,
      }).run();
    }

    return c.json({
      success: true,
      roomNumber: room.roomNumber,
      loginId: room.loginId,
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 部屋の内装情報取得API
// 部屋エイリアスIDを指定し、部屋番号、内装情報、プレイリストURLを返却
app.get('/api/rooms/:roomAliasId', async (c) => {
  const roomAliasId = c.req.param('roomAliasId');
  const db = c.get('db');

  try {
    // 部屋の検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.roomAliasId, roomAliasId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 部屋の内装情報を取得
    const roomInteriors = await db.select().from(schema.interiors).where(eq(schema.interiors.roomId, room.id)).all();

    // 部屋のプレイリスト情報を取得
    const roomPlaylists = await db.select().from(schema.playlists).where(eq(schema.playlists.roomId, room.id)).all();

    // レスポンスの作成
    const response = {
      roomNumber: room.roomNumber,
      isOccupied: room.isOccupied === 1,
      interiors: roomInteriors.map((interior: typeof schema.interiors.$inferSelect) => ({
        type: interior.type,
        pattern: interior.pattern,
      })),
      playlists: roomPlaylists.map((playlist: typeof schema.playlists.$inferSelect) => playlist.url),
    };

    return c.json(response);
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 内装変更API
// ログインIDを指定し、内装を変更
app.post('/api/rooms/interiors', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { loginId, interiors } = body;

    if (!loginId || !interiors || !Array.isArray(interiors)) {
      return c.json({ error: 'リクエストの形式が正しくありません' }, 400);
    }

    // ログインIDから部屋を検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.loginId, loginId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 内装の更新
    for (const interior of interiors) {
      if (!interior.type || !interior.pattern) {
        continue;
      }

      // 既存の内装を検索
      const existingInterior = await db.select()
        .from(schema.interiors)
        .where(
          and(
            eq(schema.interiors.roomId, room.id),
            eq(schema.interiors.type, interior.type)
          )
        )
        .get();

      if (existingInterior) {
        // 既存の内装を更新
        await db.update(schema.interiors)
          .set({ pattern: interior.pattern })
          .where(eq(schema.interiors.id, existingInterior.id))
          .run();
      } else {
        // 新しい内装を追加
        await db.insert(schema.interiors)
          .values({
            type: interior.type,
            pattern: interior.pattern,
            roomId: room.id,
          })
          .run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// プレイリスト更新API
// ログインIDを指定し、プレイリストを更新
app.post('/api/rooms/playlists', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { loginId, playlists } = body;

    if (!loginId || !playlists || !Array.isArray(playlists)) {
      return c.json({ error: 'リクエストの形式が正しくありません' }, 400);
    }

    // ログインIDから部屋を検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.loginId, loginId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 既存のプレイリストを削除
    await db.delete(schema.playlists)
      .where(eq(schema.playlists.roomId, room.id))
      .run();

    // 新しいプレイリストを追加
    for (const url of playlists) {
      if (typeof url !== 'string' || !url) {
        continue;
      }

      await db.insert(schema.playlists)
        .values({
          url,
          roomId: room.id,
        })
        .run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

export default app;
