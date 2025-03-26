import { writable, derived } from 'svelte/store';
import { roomAPI, interiorAPI } from '../api';
import type { Room, Interior, InteriorType, InteriorPattern } from '../api';

// 部屋ストアの状態型
type RoomState = {
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
};

// 内装ストアの状態型
type InteriorState = {
  types: InteriorType[];
  patterns: InteriorPattern[];
  combinations: Array<{
    type: InteriorType;
    patterns: InteriorPattern[];
  }>;
  isLoading: boolean;
  error: string | null;
};

// 部屋ストアの初期状態
const initialRoomState: RoomState = {
  currentRoom: null,
  isLoading: false,
  error: null,
};

// 内装ストアの初期状態
const initialInteriorState: InteriorState = {
  types: [],
  patterns: [],
  combinations: [],
  isLoading: false,
  error: null,
};

// 部屋ストアの作成
function createRoomStore() {
  const { subscribe, set, update } = writable<RoomState>(initialRoomState);
  
  return {
    subscribe,
    
    // 部屋の詳細を取得（部屋エイリアスIDを指定）
    async fetchRoom(roomAliasId: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const room = await roomAPI.getRoom(roomAliasId);
        update(state => ({
          ...state,
          currentRoom: room,
          isLoading: false,
        }));
        return room;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    // 部屋の詳細を取得（ログインIDを指定）
    async fetchRoomByLoginId(loginId: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const room = await roomAPI.getRoomByLoginId(loginId);
        update(state => ({
          ...state,
          currentRoom: room,
          isLoading: false,
        }));
        return room;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    // 部屋名を更新
    async updateRoomName(loginId: string, roomName: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await roomAPI.updateRoomName(loginId, roomName);
        
        update(state => {
          if (state.currentRoom) {
            return {
              ...state,
              currentRoom: {
                ...state.currentRoom,
                roomName: result.roomName,
              },
              isLoading: false,
            };
          }
          return { ...state, isLoading: false };
        });
        
        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    
    // 内装を更新
    async updateInteriors(loginId: string, interiors: Array<{ type: string; pattern: number }>) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await roomAPI.updateInteriors(loginId, interiors);
        
        // 成功したら部屋情報を再取得する必要があるかもしれません
        // ここでは簡略化のため省略
        
        update(state => ({
          ...state,
          isLoading: false,
        }));
        
        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    
    // プレイリストを更新
    async updatePlaylists(loginId: string, playlists: string[]) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        // プレイリストは最大3件まで
        const limitedPlaylists = playlists.slice(0, 3);
        
        const result = await roomAPI.updatePlaylists(loginId, limitedPlaylists);
        
        // 成功したら部屋情報を再取得する必要があるかもしれません
        // ここでは簡略化のため省略
        
        update(state => ({
          ...state,
          isLoading: false,
        }));
        
        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    
    // エラーをクリア
    clearError() {
      update(state => ({ ...state, error: null }));
    },
    
    // ストアをリセット
    reset() {
      set(initialRoomState);
    },
  };
}

// 内装ストアの作成
function createInteriorStore() {
  const { subscribe, set, update } = writable<InteriorState>(initialInteriorState);
  
  return {
    subscribe,
    
    // 内装タイプの一覧を取得
    async fetchInteriorTypes() {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await interiorAPI.getInteriorTypes();
        update(state => ({
          ...state,
          types: result.types,
          isLoading: false,
        }));
        return result.types;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    // 内装パターンの一覧を取得
    async fetchInteriorPatterns() {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await interiorAPI.getInteriorPatterns();
        update(state => ({
          ...state,
          patterns: result.patterns,
          isLoading: false,
        }));
        return result.patterns;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    // 内装タイプとパターンの組み合わせを取得
    async fetchInteriorCombinations() {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await interiorAPI.getInteriorCombinations();
        update(state => ({
          ...state,
          combinations: result.combinations,
          isLoading: false,
        }));
        return result.combinations;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isLoading: false,
          error: errorMessage,
        }));
        throw error;
      }
    },
    
    // エラーをクリア
    clearError() {
      update(state => ({ ...state, error: null }));
    },
    
    // ストアをリセット
    reset() {
      set(initialInteriorState);
    },
  };
}

// エクスポートするストア
export const roomStore = createRoomStore();
export const interiorStore = createInteriorStore();

// 現在の部屋のプレイリスト派生ストア
export const playlistStore = derived(roomStore, $roomStore => {
  return $roomStore.currentRoom?.playlists || [];
});
