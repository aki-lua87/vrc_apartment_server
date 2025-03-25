import { writable, derived } from 'svelte/store';
import { roomAPI, furnitureAPI } from '../api';

// 部屋の型定義
export type Room = {
  id: string;
  name: string;
  furniture: Record<string, string>; // 家具タイプ -> 家具ID
  playlist: Array<{ title: string; url: string }>;
};

// 家具の型定義
export type Furniture = {
  id: string;
  name: string;
  imageUrl: string;
};

// 部屋ストアの状態型
type RoomState = {
  currentRoom: Room | null;
  isLoading: boolean;
  error: string | null;
};

// 家具ストアの状態型
type FurnitureState = {
  types: string[];
  items: Record<string, Furniture[]>; // タイプ -> 家具リスト
  isLoading: boolean;
  error: string | null;
};

// 部屋ストアの初期状態
const initialRoomState: RoomState = {
  currentRoom: null,
  isLoading: false,
  error: null,
};

// 家具ストアの初期状態
const initialFurnitureState: FurnitureState = {
  types: [],
  items: {},
  isLoading: false,
  error: null,
};

// 部屋ストアの作成
function createRoomStore() {
  const { subscribe, set, update } = writable<RoomState>(initialRoomState);
  
  return {
    subscribe,
    
    // 部屋の詳細を取得
    async fetchRoom(roomId: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const room = await roomAPI.getRoom(roomId);
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
    async updateRoomName(name: string) {
      let roomId = '';
      let roomFurniture: Record<string, string> = {};
      let roomPlaylist: Array<{ title: string; url: string }> = [];
      let hasRoom = false;
      
      update(state => {
        if (!state.currentRoom) {
          return { ...state, isLoading: false, error: '部屋が選択されていません' };
        }
        
        hasRoom = true;
        roomId = state.currentRoom.id;
        roomFurniture = { ...state.currentRoom.furniture };
        roomPlaylist = [...state.currentRoom.playlist];
        
        return { ...state, isLoading: true, error: null };
      });
      
      try {
        if (!hasRoom) {
          throw new Error('部屋が選択されていません');
        }
        
        await roomAPI.updateRoomName(roomId, name);
        
        update(state => ({
          ...state,
          currentRoom: {
            id: roomId,
            name: name,
            furniture: roomFurniture,
            playlist: roomPlaylist,
          },
          isLoading: false,
        }));
        
        return true;
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
    
    // 家具を更新
    async updateFurniture(furnitureType: string, furnitureId: string) {
      let roomId = '';
      let roomName = '';
      let roomFurniture: Record<string, string> = {};
      let roomPlaylist: Array<{ title: string; url: string }> = [];
      let hasRoom = false;
      
      update(state => {
        if (!state.currentRoom) {
          return { ...state, isLoading: false, error: '部屋が選択されていません' };
        }
        
        hasRoom = true;
        roomId = state.currentRoom.id;
        roomName = state.currentRoom.name;
        roomFurniture = { ...state.currentRoom.furniture };
        roomPlaylist = [...state.currentRoom.playlist];
        
        return { ...state, isLoading: true, error: null };
      });
      
      try {
        if (!hasRoom) {
          throw new Error('部屋が選択されていません');
        }
        
        await roomAPI.updateFurniture(roomId, furnitureType, furnitureId);
        
        // 家具を更新
        roomFurniture[furnitureType] = furnitureId;
        
        update(state => ({
          ...state,
          currentRoom: {
            id: roomId,
            name: roomName,
            furniture: roomFurniture,
            playlist: roomPlaylist,
          },
          isLoading: false,
        }));
        
        return true;
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
    async updatePlaylist(playlist: Array<{ title: string; url: string }>) {
      let roomId = '';
      let roomName = '';
      let roomFurniture: Record<string, string> = {};
      let hasRoom = false;
      
      update(state => {
        if (!state.currentRoom) {
          return { ...state, isLoading: false, error: '部屋が選択されていません' };
        }
        
        hasRoom = true;
        roomId = state.currentRoom.id;
        roomName = state.currentRoom.name;
        roomFurniture = { ...state.currentRoom.furniture };
        
        return { ...state, isLoading: true, error: null };
      });
      
      try {
        if (!hasRoom) {
          throw new Error('部屋が選択されていません');
        }
        
        // プレイリストは最大10件まで
        const limitedPlaylist = playlist.slice(0, 10);
        
        await roomAPI.updatePlaylist(roomId, limitedPlaylist);
        
        update(state => ({
          ...state,
          currentRoom: {
            id: roomId,
            name: roomName,
            furniture: roomFurniture,
            playlist: limitedPlaylist,
          },
          isLoading: false,
        }));
        
        return true;
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

// 家具ストアの作成
function createFurnitureStore() {
  const { subscribe, set, update } = writable<FurnitureState>(initialFurnitureState);
  
  return {
    subscribe,
    
    // 家具タイプの一覧を取得
    async fetchFurnitureTypes() {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const types = await furnitureAPI.getFurnitureTypes();
        update(state => ({
          ...state,
          types,
          isLoading: false,
        }));
        return types;
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
    
    // 特定タイプの家具一覧を取得
    async fetchFurnitureByType(type: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const items = await furnitureAPI.getFurnitureByType(type);
        
        update(state => ({
          ...state,
          items: {
            ...state.items,
            [type]: items,
          },
          isLoading: false,
        }));
        
        return items;
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
      set(initialFurnitureState);
    },
  };
}

// エクスポートするストア
export const roomStore = createRoomStore();
export const furnitureStore = createFurnitureStore();

// 現在の部屋のプレイリスト派生ストア
export const playlistStore = derived(roomStore, $roomStore => {
  return $roomStore.currentRoom?.playlist || [];
});
