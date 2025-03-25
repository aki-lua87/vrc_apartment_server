<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '../lib/components/Button.svelte';
  import TextField from '../lib/components/TextField.svelte';
  import { authStore } from '../lib/stores/auth';
  
  let loginId = '';
  let isLoading = false;
  let error = '';
  
  // ログイン処理
  async function handleLogin() {
    if (!loginId.trim()) {
      error = 'ログインIDを入力してください';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      const success = await authStore.login(loginId);
      if (success) {
        // ログイン成功時は部屋編集画面へ遷移
        goto('/room');
      } else {
        error = 'ログインに失敗しました';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '不明なエラーが発生しました';
    } finally {
      isLoading = false;
    }
  }
  
  // 既にログイン済みの場合は部屋編集画面へリダイレクト
  onMount(() => {
    isLoading = true;
    try {
      // 新しいAPIではcheckAuth()メソッドがないため、
      // クライアント側で認証状態を確認する
      const { isAuthenticated } = $authStore;
      if (isAuthenticated) {
        goto('/room');
      }
    } finally {
      isLoading = false;
    }
  });
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
  <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
    <div class="text-center">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">VRCアパートメント</h1>
      <p class="text-gray-600">ログインしてアパートメントを編集しましょう</p>
    </div>
    
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleLogin}>
      <div>
        <TextField
          id="loginId"
          label="ログインID"
          bind:value={loginId}
          placeholder="あなたのログインIDを入力"
          error={error}
          fullWidth={true}
          disabled={isLoading}
        />
      </div>
      
      <div>
        <Button
          type="submit"
          variant="primary"
          fullWidth={true}
          disabled={isLoading}
        >
          {#if isLoading}
            <span class="inline-block animate-spin mr-2">⟳</span>
            ログイン中...
          {:else}
            ログイン
          {/if}
        </Button>
      </div>
      
      <div class="text-center mt-4">
        <a href="/admin" class="text-sm text-indigo-600 hover:text-indigo-800">
          管理者ログイン
        </a>
      </div>
    </form>
  </div>
</div>
