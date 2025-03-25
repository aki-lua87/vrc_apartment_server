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
    const errorData = await response.json().catch(() => ({})) as { message?: string };
    throw new Error(errorData.message || `API request failed with status ${response.status}`);
  }
  
  // 204 No Content の場合は null を返す
  if (response.status === 204) {
    return null as T;
  }
  
  // JSONレスポンスをパース
  return await response.json();
}

// ログイン関連のAPI
export const authAPI = {
  // ログイン
  login: (loginId: string) => {
    return fetchAPI<{ success: boolean; userId: string }>('/auth/login', {
      method: 'POST',
      body: { loginId },
    });
  },
  
  // ログアウト
  logout: () => {
    return fetchAPI<void>('/auth/logout', {
      method: 'POST',
    });
  },
  
  // 現在のユーザー情報を取得
  getCurrentUser: () => {
    return fetchAPI<{ userId: string }>('/auth/me', {
      method: 'GET',
    });
  },
};

// 部屋関連のAPI
export const roomAPI = {
  // 部屋の一覧を取得
  getRooms: () => {
    return fetchAPI<Array<{
      id: string;
      name: string;
      furniture: Record<string, string>;
      playlist: Array<{ title: string; url: string }>;
    }>>('/rooms', {
      method: 'GET',
    });
  },
  
  // 部屋の詳細を取得
  getRoom: (roomId: string) => {
    return fetchAPI<{
      id: string;
      name: string;
      furniture: Record<string, string>;
      playlist: Array<{ title: string; url: string }>;
    }>(`/rooms/${roomId}`, {
      method: 'GET',
    });
  },
  
  // 部屋名を更新
  updateRoomName: (roomId: string, name: string) => {
    return fetchAPI<{ success: boolean }>(`/rooms/${roomId}/name`, {
      method: 'PUT',
      body: { name },
    });
  },
  
  // 家具を更新
  updateFurniture: (roomId: string, furnitureType: string, furnitureId: string) => {
    return fetchAPI<{ success: boolean }>(`/rooms/${roomId}/furniture`, {
      method: 'PUT',
      body: { type: furnitureType, id: furnitureId },
    });
  },
  
  // プレイリストを更新
  updatePlaylist: (roomId: string, playlist: Array<{ title: string; url: string }>) => {
    return fetchAPI<{ success: boolean }>(`/rooms/${roomId}/playlist`, {
      method: 'PUT',
      body: { playlist },
    });
  },
};

// 家具関連のAPI
export const furnitureAPI = {
  // 家具タイプの一覧を取得
  getFurnitureTypes: () => {
    return fetchAPI<string[]>('/furniture/types', {
      method: 'GET',
    });
  },
  
  // 特定タイプの家具一覧を取得
  getFurnitureByType: (type: string) => {
    return fetchAPI<Array<{ id: string; name: string; imageUrl: string }>>(`/furniture/types/${type}`, {
      method: 'GET',
    });
  },
};
