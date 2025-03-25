import { writable } from 'svelte/store';
import { authAPI } from '../api';

// 認証状態の型定義
type AuthState = {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
};

// 初期状態
const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  isLoading: false,
  error: null,
};

// 認証ストアの作成
function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>(initialState);
  
  return {
    subscribe,
    
    // 現在のユーザー情報を取得
    async checkAuth() {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const user = await authAPI.getCurrentUser();
        set({
          isAuthenticated: true,
          userId: user.userId,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (error) {
        set({
          isAuthenticated: false,
          userId: null,
          isLoading: false,
          error: null, // エラーをクリア（認証チェックの失敗は通常のフロー）
        });
        return false;
      }
    },
    
    // ログイン
    async login(loginId: string) {
      update(state => ({ ...state, isLoading: true, error: null }));
      
      try {
        const result = await authAPI.login(loginId);
        set({
          isAuthenticated: result.success,
          userId: result.userId,
          isLoading: false,
          error: null,
        });
        return result.success;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '不明なエラーが発生しました';
        update(state => ({
          ...state,
          isAuthenticated: false,
          isLoading: false,
          error: errorMessage,
        }));
        return false;
      }
    },
    
    // ログアウト
    async logout() {
      update(state => ({ ...state, isLoading: true }));
      
      try {
        await authAPI.logout();
        set(initialState);
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
  };
}

// エクスポートするストア
export const authStore = createAuthStore();
