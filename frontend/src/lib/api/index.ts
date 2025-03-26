// APIのベースURL
const API_BASE_URL = '/api';

// APIリクエストのオプション型
type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
};

// APIリクエストを送信する関数
async function fetchAPI<T>(endpoint: string, options: RequestOptions): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const config: RequestInit = {
    method: options.method,
    headers,
    credentials: 'include', // クッキーを含める
  };
  
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, config);
  
  // レスポンスが成功しなかった場合はエラーをスロー
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { error?: string };
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }
  
  // 204 No Content の場合は null を返す
  if (response.status === 204) {
    return null as T;
  }
  
  // JSONレスポンスをパース
  return await response.json();
}

// 内装タイプの型定義
export type InteriorType = {
  id: number;
  code: string;
  name: string;
};

// 内装パターンの型定義
export type InteriorPattern = {
  id: number;
  name: string;
};

// 内装の型定義
export type Interior = {
  type: string;
  typeName: string;
  pattern: number;
  patternName: string;
};

// 部屋の型定義
export type Room = {
  roomNumber: string;
  roomName: string | null;
  isOccupied: boolean;
  interiors: Interior[];
  playlists: string[];
};

// ログイン関連のAPI
export const authAPI = {
  // ログイン
  login: (loginId: string) => {
    return fetchAPI<{
      success: boolean;
      roomNumber: string;
      roomName: string | null;
      message: string;
    }>('/auth/login', {
      method: 'POST',
      body: { loginId },
    });
  },
  
  // 管理者ログイン
  adminLogin: (loginId: string) => {
    return fetchAPI<{
      success: boolean;
      message: string;
    }>('/auth/admin-login', {
      method: 'POST',
      body: { loginId },
    });
  },
};

// 部屋関連のAPI
export const roomAPI = {
  // 部屋の一覧を取得
  getRooms: () => {
    return fetchAPI<{
      rooms: Array<{
        roomNumber: string;
        roomName: string | null;
        isOccupied: boolean;
      }>;
    }>('/rooms', {
      method: 'GET',
    });
  },
  
  // 部屋を自分のものにする
  claimRoom: (roomAliasId: string) => {
    return fetchAPI<{
      success: boolean;
      roomNumber: string;
      loginId: string;
    }>(`/rooms/${roomAliasId}/claim`, {
      method: 'GET',
    });
  },
  
  // 部屋の詳細を取得（部屋エイリアスIDを指定）
  getRoom: (roomAliasId: string) => {
    return fetchAPI<Room>(`/rooms/${roomAliasId}`, {
      method: 'GET',
    });
  },
  
  // 部屋の詳細を取得（ログインIDを指定）
  getRoomByLoginId: (loginId: string) => {
    return fetchAPI<Room>(`/rooms/by-login/${loginId}`, {
      method: 'GET',
    });
  },
  
  // 部屋名を更新
  updateRoomName: (loginId: string, roomName: string) => {
    return fetchAPI<{
      success: boolean;
      roomName: string;
    }>('/rooms/name', {
      method: 'POST',
      body: { loginId, roomName },
    });
  },
  
  // 内装を更新
  updateInteriors: (loginId: string, interiors: Array<{ type: string; pattern: number }>) => {
    return fetchAPI<{ success: boolean }>('/rooms/interiors', {
      method: 'POST',
      body: { loginId, interiors },
    });
  },
  
  // プレイリストを更新
  updatePlaylists: (loginId: string, playlists: string[]) => {
    return fetchAPI<{ success: boolean }>('/rooms/playlists', {
      method: 'POST',
      body: { loginId, playlists },
    });
  },
};

// 内装関連のAPI
export const interiorAPI = {
  // 内装タイプの一覧を取得
  getInteriorTypes: () => {
    return fetchAPI<{ types: InteriorType[] }>('/interior-types', {
      method: 'GET',
    });
  },
  
  // 内装パターンの一覧を取得
  getInteriorPatterns: () => {
    return fetchAPI<{ patterns: InteriorPattern[] }>('/interior-patterns', {
      method: 'GET',
    });
  },
  
  // 内装タイプとパターンの組み合わせを取得
  getInteriorCombinations: () => {
    return fetchAPI<{
      combinations: Array<{
        type: InteriorType;
        patterns: InteriorPattern[];
      }>;
    }>('/interior-combinations', {
      method: 'GET',
    });
  },
};

// 管理者用API
export const adminAPI = {
  // 内装タイプを追加
  addInteriorType: (code: string, name: string) => {
    return fetchAPI<{
      success: boolean;
      type: InteriorType;
    }>('/admin/interior-types', {
      method: 'POST',
      body: { code, name },
    });
  },
  
  // 内装タイプを更新
  updateInteriorType: (id: number, data: { code?: string; name?: string }) => {
    return fetchAPI<{
      success: boolean;
      type: InteriorType;
    }>(`/admin/interior-types/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
  
  // 内装タイプを削除
  deleteInteriorType: (id: number) => {
    return fetchAPI<{
      success: boolean;
      message: string;
    }>(`/admin/interior-types/${id}`, {
      method: 'DELETE',
    });
  },
  
  // 内装パターンを追加
  addInteriorPattern: (typeId: number, name: string) => {
    return fetchAPI<{
      success: boolean;
      pattern: InteriorPattern;
    }>('/admin/interior-patterns', {
      method: 'POST',
      body: { typeId, name },
    });
  },
  
  // 内装パターンを更新
  updateInteriorPattern: (id: number, data: { name?: string }) => {
    return fetchAPI<{
      success: boolean;
      pattern: InteriorPattern;
    }>(`/admin/interior-patterns/${id}`, {
      method: 'PUT',
      body: data,
    });
  },
  
  // 内装パターンを削除
  deleteInteriorPattern: (id: number) => {
    return fetchAPI<{
      success: boolean;
      message: string;
    }>(`/admin/interior-patterns/${id}`, {
      method: 'DELETE',
    });
  },
};
