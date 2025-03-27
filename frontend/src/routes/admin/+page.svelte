<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '../../lib/components/Button.svelte';
  import TextField from '../../lib/components/TextField.svelte';
  import { authStore } from '../../lib/stores/auth';
  
  let loginId = '';
  let error = '';
  let isLoading = false;
  
  onMount(() => {
    // 既に管理者としてログインしている場合は管理画面へリダイレクト
    if ($authStore.isAuthenticated && $authStore.isAdmin) {
      goto('/admin/dashboard');
    }
  });
  
  async function handleLogin() {
    if (!loginId.trim()) {
      error = 'ログインIDを入力してください';
      return;
    }
    
    error = '';
    isLoading = true;
    
    try {
      const success = await authStore.adminLogin(loginId);
      
      if (success) {
        // 管理画面へリダイレクト
        goto('/admin/dashboard');
      } else {
        error = '管理者権限がありません';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : '不明なエラーが発生しました';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
      管理者ログイン
    </h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" on:submit|preventDefault={handleLogin}>
        <div>
          <TextField
            id="loginId"
            label="ログインID"
            bind:value={loginId}
            error={error}
            fullWidth={true}
            placeholder="管理者ログインIDを入力"
          />
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            fullWidth={true}
            disabled={isLoading}
          >
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </Button>
        </div>
      </form>
      
      <div class="mt-6">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">
              または
            </span>
          </div>
        </div>

        <div class="mt-6">
          <a href="/" class="block w-full">
            <Button
              variant="outline"
              fullWidth={true}
            >
              通常ログイン画面へ戻る
            </Button>
          </a>
        </div>
      </div>
    </div>
  </div>
</div>
