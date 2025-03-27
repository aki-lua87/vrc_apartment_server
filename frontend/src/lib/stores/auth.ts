import { writable } from 'svelte/store';
import { authAPI } from '../api';

// 認証状態の型定義
type AuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  roomNumber: string | null;
  roomName: string | null;
  loginId: string | null;
  isLoading: boolean;
  error: string | null;
};

// 初期状態
const initialState: AuthState = {
  isAuthenticated: false,
  isAdmin: false,
  roomNumber: null,
  roomName: null,
  loginId: null,
  isLoading: false,
  error: null,
};

// 認証ストアの作成
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);
  
  return {
    subscribe,
    
    // ログイン
    async login(loginId: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await authAPI.login(loginId);
        set({
          isAuthenticated: result.success,
          isAdmin: false,
          roomNumber: result.roomNumber,
          roomName: result.roomName,
          loginId: result.success ? loginId : null,
          isLoading: false,
          error: null,
        });
        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isAuthenticated: false,
          isAdmin: false,
          roomNumber: null,
          roomName: null,
          loginId: null,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    
    // 管理者ログイン
    async adminLogin(loginId: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await authAPI.adminLogin(loginId);
        set({
          isAuthenticated: result.success,
          isAdmin: result.success,
          roomNumber: result.success ? '0000' : null,
          roomName: result.success ? '管理者' : null,
          loginId: result.success ? loginId : null,
          isLoading: false,
          error: null,
        });
        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isAuthenticated: false,
          isAdmin: false,
          roomNumber: null,
          roomName: null,
          loginId: null,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    
    // ログアウト（クライアント側のみ）
    logout() {
      set(initialState);
      return true;
    },
    
    // エラーをクリア
    clearError() {
      update(state => ({ ...state, error: null }));
    },
  };
}

// エクスポートするストア
export const authStore = createAuthStore();
