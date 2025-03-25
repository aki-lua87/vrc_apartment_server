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
      roomName: schema.rooms.roomName,
      isOccupied: schema.rooms.isOccupied,
    }).from(schema.rooms).all();

    return c.json({
      rooms: rooms.map(room => ({
        roomNumber: room.roomNumber,
        roomName: room.roomName || null,
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
    // 部屋を使用中に更新
    await db.update(schema.rooms)
      .set({
        // userId: newUser.id,
        isOccupied: 1,
      })
      .where(eq(schema.rooms.id, room.id))
      .run();

    // 基本的な内装を追加
    const interiorTypeCodes = ['sofa', 'table', 'bed', 'chair', 'lamp', 'carpet'];
    
    // 内装タイプIDを取得
    for (const code of interiorTypeCodes) {
      // タイプIDを取得
      const typeRecord = await db.select()
        .from(schema.interiorTypes)
        .where(eq(schema.interiorTypes.code, code))
        .get();
      
      if (!typeRecord) {
        console.error(`内装タイプが見つかりません: ${code}`);
        continue;
      }
      
      // デフォルトパターンを取得（ID=1と仮定）
      const patternRecord = await db.select()
        .from(schema.interiorPatterns)
        .where(eq(schema.interiorPatterns.id, 1))
        .get();
      
      if (!patternRecord) {
        console.error('デフォルトの内装パターンが見つかりません');
        continue;
      }
      
      // 内装を追加
      await db.insert(schema.interiors).values({
        typeId: typeRecord.id,
        patternId: patternRecord.id,
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

// 部屋の内装情報取得API（部屋エイリアスIDを指定）
// 部屋エイリアスIDを指定し、部屋番号、部屋名、内装情報、プレイリストURLを返却
app.get('/api/rooms/:roomAliasId', async (c) => {
  const roomAliasId = c.req.param('roomAliasId');
  const db = c.get('db');

  try {
    // 部屋の検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.roomAliasId, roomAliasId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 部屋の内装情報を取得（内装タイプと内装パターンの情報も含む）
    const roomInteriors = await db.select({
      interiorId: schema.interiors.id,
      typeId: schema.interiors.typeId,
      patternId: schema.interiors.patternId,
      typeCode: schema.interiorTypes.code,
      typeName: schema.interiorTypes.name,
      patternName: schema.interiorPatterns.name,
    })
    .from(schema.interiors)
    .leftJoin(schema.interiorTypes, eq(schema.interiors.typeId, schema.interiorTypes.id))
    .leftJoin(schema.interiorPatterns, eq(schema.interiors.patternId, schema.interiorPatterns.id))
    .where(eq(schema.interiors.roomId, room.id))
    .all();

    // 部屋のプレイリスト情報を取得
    const roomPlaylists = await db.select().from(schema.playlists).where(eq(schema.playlists.roomId, room.id)).all();

    // レスポンスの作成
    const response = {
      roomNumber: room.roomNumber,
      roomName: room.roomName || null,
      isOccupied: room.isOccupied === 1,
      interiors: roomInteriors.map((interior) => ({
        type: interior.typeCode,
        typeName: interior.typeName,
        pattern: interior.patternId,
        patternName: interior.patternName,
      })),
      playlists: roomPlaylists.map((playlist: typeof schema.playlists.$inferSelect) => playlist.url),
    };

    return c.json(response);
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 部屋の内装情報取得API（ログインIDを指定）
// ログインIDを指定し、部屋番号、部屋名、内装情報、プレイリストURLを返却
app.get('/api/rooms/by-login/:loginId', async (c) => {
  const loginId = c.req.param('loginId');
  const db = c.get('db');

  try {
    // 部屋の検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.loginId, loginId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 部屋の内装情報を取得（内装タイプと内装パターンの情報も含む）
    const roomInteriors = await db.select({
      interiorId: schema.interiors.id,
      typeId: schema.interiors.typeId,
      patternId: schema.interiors.patternId,
      typeCode: schema.interiorTypes.code,
      typeName: schema.interiorTypes.name,
      patternName: schema.interiorPatterns.name,
    })
    .from(schema.interiors)
    .leftJoin(schema.interiorTypes, eq(schema.interiors.typeId, schema.interiorTypes.id))
    .leftJoin(schema.interiorPatterns, eq(schema.interiors.patternId, schema.interiorPatterns.id))
    .where(eq(schema.interiors.roomId, room.id))
    .all();

    // 部屋のプレイリスト情報を取得
    const roomPlaylists = await db.select().from(schema.playlists).where(eq(schema.playlists.roomId, room.id)).all();

    // レスポンスの作成
    const response = {
      roomNumber: room.roomNumber,
      roomName: room.roomName || null,
      isOccupied: room.isOccupied === 1,
      interiors: roomInteriors.map((interior) => ({
        type: interior.typeCode,
        typeName: interior.typeName,
        pattern: interior.patternId,
        patternName: interior.patternName,
      })),
      playlists: roomPlaylists.map((playlist: typeof schema.playlists.$inferSelect) => playlist.url),
    };

    return c.json(response);
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 部屋名更新API
// ログインIDを指定し、部屋名を更新
app.post('/api/rooms/name', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { loginId, roomName } = body;

    if (!loginId || roomName === undefined) {
      return c.json({ error: 'リクエストの形式が正しくありません' }, 400);
    }

    // ログインIDから部屋を検索
    const room = await db.select().from(schema.rooms).where(eq(schema.rooms.loginId, loginId)).get();

    if (!room) {
      return c.json({ error: '部屋が見つかりません' }, 404);
    }

    // 部屋名の更新
    await db.update(schema.rooms)
      .set({ roomName })
      .where(eq(schema.rooms.id, room.id))
      .run();

    return c.json({
      success: true,
      roomName,
    });
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

      // タイプIDを取得
      const typeRecord = await db.select()
        .from(schema.interiorTypes)
        .where(eq(schema.interiorTypes.code, interior.type))
        .get();
      
      if (!typeRecord) {
        console.error(`内装タイプが見つかりません: ${interior.type}`);
        continue;
      }
      
      // パターンIDを取得
      const patternRecord = await db.select()
        .from(schema.interiorPatterns)
        .where(eq(schema.interiorPatterns.id, interior.pattern))
        .get();
      
      if (!patternRecord) {
        console.error(`内装パターンが見つかりません: ${interior.pattern}`);
        continue;
      }

      // 既存の内装を検索
      const existingInterior = await db.select()
        .from(schema.interiors)
        .where(
          and(
            eq(schema.interiors.roomId, room.id),
            eq(schema.interiors.typeId, typeRecord.id)
          )
        )
        .get();

      if (existingInterior) {
        // 既存の内装を更新
        await db.update(schema.interiors)
          .set({ patternId: patternRecord.id })
          .where(eq(schema.interiors.id, existingInterior.id))
          .run();
      } else {
        // 新しい内装を追加
        await db.insert(schema.interiors)
          .values({
            typeId: typeRecord.id,
            patternId: patternRecord.id,
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

// 内装タイプ一覧取得API
app.get('/api/interior-types', async (c) => {
  const db = c.get('db');

  try {
    // 全ての内装タイプを取得
    const types = await db.select({
      id: schema.interiorTypes.id,
      code: schema.interiorTypes.code,
      name: schema.interiorTypes.name,
    }).from(schema.interiorTypes).all();

    return c.json({
      types: types.map(type => ({
        id: type.id,
        code: type.code,
        name: type.name,
      })),
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 内装パターン一覧取得API
app.get('/api/interior-patterns', async (c) => {
  const db = c.get('db');

  try {
    // 全ての内装パターンを取得
    const patterns = await db.select({
      id: schema.interiorPatterns.id,
      name: schema.interiorPatterns.name,
      description: schema.interiorPatterns.description,
    }).from(schema.interiorPatterns).all();

    return c.json({
      patterns: patterns.map(pattern => ({
        id: pattern.id,
        name: pattern.name,
        description: pattern.description || null,
      })),
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// ログインAPI
// ログインIDを確認し、使用中のIDである場合にTRUE、未使用や存在しない場合にはFALSEを返す
app.post('/api/auth/login', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { loginId } = body;

    if (!loginId) {
      return c.json({ error: 'ログインIDが指定されていません' }, 400);
    }

    // ログインIDから部屋を検索
    const room = await db.select({
      id: schema.rooms.id,
      roomNumber: schema.rooms.roomNumber,
      roomName: schema.rooms.roomName,
      isOccupied: schema.rooms.isOccupied,
    }).from(schema.rooms).where(eq(schema.rooms.loginId, loginId)).get();

    // 部屋が存在しない場合はFALSEを返す
    if (!room) {
      return c.json({
        success: false,
        message: 'ログインIDが存在しません',
      });
    }

    // 部屋が使用中かどうかをチェック
    const isOccupied = room.isOccupied === 1;

    return c.json({
      success: isOccupied,
      roomNumber: room.roomNumber,
      roomName: room.roomName || null,
      message: isOccupied ? 'ログイン成功' : 'この部屋はまだ使用されていません',
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者ログインAPI
// 部屋番号が0000に一致するログインIDを送信された場合のみTRUEを返す
app.post('/api/auth/admin-login', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { loginId } = body;

    if (!loginId) {
      return c.json({ error: 'ログインIDが指定されていません' }, 400);
    }

    // ログインIDから部屋を検索
    const room = await db.select({
      id: schema.rooms.id,
      roomNumber: schema.rooms.roomNumber,
    }).from(schema.rooms).where(eq(schema.rooms.loginId, loginId)).get();

    // 部屋が存在しない場合はFALSEを返す
    if (!room) {
      return c.json({
        success: false,
        message: 'ログインIDが存在しません',
      });
    }

    // 部屋番号が0000かどうかをチェック
    const isAdmin = room.roomNumber === '0000';

    return c.json({
      success: isAdmin,
      message: isAdmin ? '管理者ログイン成功' : '管理者権限がありません',
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 内装タイプとパターンの組み合わせ一覧取得API
app.get('/api/interior-combinations', async (c) => {
  const db = c.get('db');

  try {
    // 全ての内装タイプを取得
    const types = await db.select({
      id: schema.interiorTypes.id,
      code: schema.interiorTypes.code,
      name: schema.interiorTypes.name,
    }).from(schema.interiorTypes).all();

    // 全ての内装パターンを取得
    const patterns = await db.select({
      id: schema.interiorPatterns.id,
      name: schema.interiorPatterns.name,
      description: schema.interiorPatterns.description,
    }).from(schema.interiorPatterns).all();

    // 組み合わせを作成
    const combinations = types.map(type => {
      return {
        type: {
          id: type.id,
          code: type.code,
          name: type.name,
        },
        patterns: patterns.map(pattern => ({
          id: pattern.id,
          name: pattern.name,
          description: pattern.description || null,
        })),
      };
    });

    return c.json({ combinations });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者用 - 内装タイプ追加API
app.post('/api/admin/interior-types', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { code, name } = body;

    if (!code || !name) {
      return c.json({ error: 'コードと名前は必須です' }, 400);
    }

    // コードの重複チェック
    const existingType = await db.select()
      .from(schema.interiorTypes)
      .where(eq(schema.interiorTypes.code, code))
      .get();

    if (existingType) {
      return c.json({ error: '同じコードの内装タイプが既に存在します' }, 400);
    }

    // 内装タイプを追加
    const result = await db.insert(schema.interiorTypes)
      .values({
        code,
        name,
      })
      .returning()
      .get();

    return c.json({
      success: true,
      type: {
        id: result.id,
        code: result.code,
        name: result.name,
      },
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者用 - 内装タイプ更新API
app.put('/api/admin/interior-types/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'IDが無効です' }, 400);
  }

  try {
    const body = await c.req.json();
    const { code, name } = body;

    if (!code && !name) {
      return c.json({ error: '更新するフィールドが指定されていません' }, 400);
    }

    // 内装タイプの存在確認
    const existingType = await db.select()
      .from(schema.interiorTypes)
      .where(eq(schema.interiorTypes.id, id))
      .get();

    if (!existingType) {
      return c.json({ error: '指定された内装タイプが見つかりません' }, 404);
    }

    // コードを変更する場合は重複チェック
    if (code && code !== existingType.code) {
      const duplicateCode = await db.select()
        .from(schema.interiorTypes)
        .where(eq(schema.interiorTypes.code, code))
        .get();

      if (duplicateCode) {
        return c.json({ error: '同じコードの内装タイプが既に存在します' }, 400);
      }
    }

    // 更新するフィールドを設定
    const updateData: { code?: string; name?: string } = {};
    if (code) updateData.code = code;
    if (name) updateData.name = name;

    // 内装タイプを更新
    const result = await db.update(schema.interiorTypes)
      .set(updateData)
      .where(eq(schema.interiorTypes.id, id))
      .returning()
      .get();

    return c.json({
      success: true,
      type: {
        id: result.id,
        code: result.code,
        name: result.name,
      },
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者用 - 内装タイプ削除API
app.delete('/api/admin/interior-types/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'IDが無効です' }, 400);
  }

  try {
    // 内装タイプの存在確認
    const existingType = await db.select()
      .from(schema.interiorTypes)
      .where(eq(schema.interiorTypes.id, id))
      .get();

    if (!existingType) {
      return c.json({ error: '指定された内装タイプが見つかりません' }, 404);
    }

    // この内装タイプを使用している内装があるか確認
    const usedInteriors = await db.select()
      .from(schema.interiors)
      .where(eq(schema.interiors.typeId, id))
      .all();

    if (usedInteriors.length > 0) {
      return c.json({ 
        error: 'この内装タイプは使用中のため削除できません',
        usedCount: usedInteriors.length
      }, 400);
    }

    // 内装タイプを削除
    await db.delete(schema.interiorTypes)
      .where(eq(schema.interiorTypes.id, id))
      .run();

    return c.json({
      success: true,
      message: '内装タイプを削除しました',
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者用 - 内装パターン追加API
app.post('/api/admin/interior-patterns', async (c) => {
  const db = c.get('db');

  try {
    const body = await c.req.json();
    const { name, description } = body;

    if (!name) {
      return c.json({ error: '名前は必須です' }, 400);
    }

    // 内装パターンを追加
    const result = await db.insert(schema.interiorPatterns)
      .values({
        name,
        description: description || null,
      })
      .returning()
      .get();

    return c.json({
      success: true,
      pattern: {
        id: result.id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者用 - 内装パターン更新API
app.put('/api/admin/interior-patterns/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'IDが無効です' }, 400);
  }

  try {
    const body = await c.req.json();
    const { name, description } = body;

    if (!name && description === undefined) {
      return c.json({ error: '更新するフィールドが指定されていません' }, 400);
    }

    // 内装パターンの存在確認
    const existingPattern = await db.select()
      .from(schema.interiorPatterns)
      .where(eq(schema.interiorPatterns.id, id))
      .get();

    if (!existingPattern) {
      return c.json({ error: '指定された内装パターンが見つかりません' }, 404);
    }

    // 更新するフィールドを設定
    const updateData: { name?: string; description?: string | null } = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;

    // 内装パターンを更新
    const result = await db.update(schema.interiorPatterns)
      .set(updateData)
      .where(eq(schema.interiorPatterns.id, id))
      .returning()
      .get();

    return c.json({
      success: true,
      pattern: {
        id: result.id,
        name: result.name,
        description: result.description,
      },
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return c.json({ error: 'サーバーエラーが発生しました' }, 500);
  }
});

// 管理者用 - 内装パターン削除API
app.delete('/api/admin/interior-patterns/:id', async (c) => {
  const db = c.get('db');
  const id = parseInt(c.req.param('id'), 10);

  if (isNaN(id)) {
    return c.json({ error: 'IDが無効です' }, 400);
  }

  try {
    // 内装パターンの存在確認
    const existingPattern = await db.select()
      .from(schema.interiorPatterns)
      .where(eq(schema.interiorPatterns.id, id))
      .get();

    if (!existingPattern) {
      return c.json({ error: '指定された内装パターンが見つかりません' }, 404);
    }

    // このパターンを使用している内装があるか確認
    const usedInteriors = await db.select()
      .from(schema.interiors)
      .where(eq(schema.interiors.patternId, id))
      .all();

    if (usedInteriors.length > 0) {
      return c.json({ 
        error: 'この内装パターンは使用中のため削除できません',
        usedCount: usedInteriors.length
      }, 400);
    }

    // 内装パターンを削除
    await db.delete(schema.interiorPatterns)
      .where(eq(schema.interiorPatterns.id, id))
      .run();

    return c.json({
      success: true,
      message: '内装パターンを削除しました',
    });
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
