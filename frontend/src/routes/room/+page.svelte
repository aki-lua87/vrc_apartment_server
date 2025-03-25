<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '../../lib/components/Button.svelte';
  import TextField from '../../lib/components/TextField.svelte';
  import Modal from '../../lib/components/Modal.svelte';
  import { authStore } from '../../lib/stores/auth';
  import { roomStore, furnitureStore } from '../../lib/stores/room';
  
  // 認証チェック
  onMount(async () => {
    try {
      const isAuthenticated = await authStore.checkAuth();
      if (!isAuthenticated) {
        // 未認証の場合はログイン画面へリダイレクト
        goto('/');
        return;
      }
      
      // 部屋情報を取得
      // 注: 実際のアプリでは、ユーザーIDに基づいて部屋IDを取得する処理が必要
      // ここでは簡略化のため、固定の部屋IDを使用
      const roomId = 'room1';
      await roomStore.fetchRoom(roomId);
      
      // 家具タイプの一覧を取得
      await furnitureStore.fetchFurnitureTypes();
    } catch (error) {
      console.error('初期化エラー:', error);
    }
  });
  
  // ログアウト処理
  async function handleLogout() {
    try {
      await authStore.logout();
      goto('/');
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }
  
  // 部屋名編集
  let isRoomNameModalOpen = false;
  let newRoomName = '';
  let roomNameError = '';
  
  function openRoomNameModal() {
    if ($roomStore.currentRoom) {
      newRoomName = $roomStore.currentRoom.name;
      roomNameError = '';
      isRoomNameModalOpen = true;
    }
  }
  
  async function saveRoomName() {
    if (!newRoomName.trim()) {
      roomNameError = '部屋名を入力してください';
      return;
    }
    
    try {
      await roomStore.updateRoomName(newRoomName);
      isRoomNameModalOpen = false;
    } catch (error) {
      roomNameError = error instanceof Error ? error.message : '不明なエラーが発生しました';
    }
  }
  
  // 内装編集
  let isFurnitureModalOpen = false;
  let selectedFurnitureType = '';
  let furnitureItems: import('../../lib/stores/room').Furniture[] = [];
  
  async function openFurnitureModal(furnitureType: string) {
    selectedFurnitureType = furnitureType;
    
    try {
      // 選択された家具タイプの一覧を取得
      const items = await furnitureStore.fetchFurnitureByType(furnitureType);
      furnitureItems = items;
      isFurnitureModalOpen = true;
    } catch (error) {
      console.error('家具一覧取得エラー:', error);
    }
  }
  
  async function selectFurniture(furnitureId: string) {
    try {
      await roomStore.updateFurniture(selectedFurnitureType, furnitureId);
      isFurnitureModalOpen = false;
    } catch (error) {
      console.error('家具更新エラー:', error);
    }
  }
  
  // プレイリスト編集
  let isPlaylistModalOpen = false;
  let newPlaylistTitle = '';
  let newPlaylistUrl = '';
  let playlistError = '';
  
  function openPlaylistModal() {
    newPlaylistTitle = '';
    newPlaylistUrl = '';
    playlistError = '';
    isPlaylistModalOpen = true;
  }
  
  function removePlaylistItem(index: number) {
    if ($roomStore.currentRoom) {
      const updatedPlaylist = [...$roomStore.currentRoom.playlist];
      updatedPlaylist.splice(index, 1);
      roomStore.updatePlaylist(updatedPlaylist);
    }
  }
  
  async function addPlaylistItem() {
    if (!newPlaylistTitle.trim()) {
      playlistError = 'タイトルを入力してください';
      return;
    }
    
    if (!newPlaylistUrl.trim()) {
      playlistError = 'URLを入力してください';
      return;
    }
    
    // URLの簡易バリデーション
    try {
      new URL(newPlaylistUrl);
    } catch (e) {
      playlistError = '有効なURLを入力してください';
      return;
    }
    
    if ($roomStore.currentRoom) {
      // プレイリストは最大10件まで
      if ($roomStore.currentRoom.playlist.length >= 10) {
        playlistError = 'プレイリストは最大10件までです';
        return;
      }
      
      const updatedPlaylist = [
        ...$roomStore.currentRoom.playlist,
        { title: newPlaylistTitle, url: newPlaylistUrl }
      ];
      
      try {
        await roomStore.updatePlaylist(updatedPlaylist);
        newPlaylistTitle = '';
        newPlaylistUrl = '';
        playlistError = '';
      } catch (error) {
        playlistError = error instanceof Error ? error.message : '不明なエラーが発生しました';
      }
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- ヘッダー -->
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">VRCアパートメント</h1>
      <Button variant="outline" on:click={handleLogout}>ログアウト</Button>
    </div>
  </header>
  
  <!-- メインコンテンツ -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if $roomStore.isLoading}
      <div class="flex justify-center items-center h-64">
        <p class="text-lg">読み込み中...</p>
      </div>
    {:else if $roomStore.error}
      <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
        <p class="text-red-600">{$roomStore.error}</p>
      </div>
    {:else if $roomStore.currentRoom}
      <!-- 部屋情報 -->
      <div class="bg-white shadow rounded-lg overflow-hidden mb-8">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">{$roomStore.currentRoom.name}</h2>
            <Button variant="outline" size="sm" on:click={openRoomNameModal}>部屋名を編集</Button>
          </div>
          
          <!-- 内装編集セクション -->
          <div class="mb-8">
            <h3 class="text-lg font-medium text-gray-900 mb-4">内装編集</h3>
            
            {#if $furnitureStore.isLoading}
              <p>家具タイプを読み込み中...</p>
            {:else if $furnitureStore.error}
              <p class="text-red-600">{$furnitureStore.error}</p>
            {:else if $furnitureStore.types.length === 0}
              <p>家具タイプがありません</p>
            {:else}
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {#each $furnitureStore.types as furnitureType}
                  <div class="border rounded-lg p-4 bg-gray-50">
                    <div class="flex justify-between items-center">
                      <h4 class="font-medium">{furnitureType}</h4>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        on:click={() => openFurnitureModal(furnitureType)}
                      >
                        変更
                      </Button>
                    </div>
                    <p class="mt-2 text-sm text-gray-600">
                      現在: {$roomStore.currentRoom.furniture[furnitureType] || 'なし'}
                    </p>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
          
          <!-- プレイリスト編集セクション -->
          <div>
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">プレイリスト編集</h3>
              <Button 
                variant="primary" 
                size="sm" 
                on:click={openPlaylistModal}
                disabled={$roomStore.currentRoom.playlist.length >= 10}
              >
                追加
              </Button>
            </div>
            
            {#if $roomStore.currentRoom.playlist.length === 0}
              <p class="text-gray-600">プレイリストはまだありません</p>
            {:else}
              <div class="border rounded-lg overflow-hidden">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">タイトル</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                      <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    {#each $roomStore.currentRoom.playlist as item, index}
                      <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline">
                            {item.url}
                          </a>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            class="text-red-600 hover:text-red-900"
                            on:click={() => removePlaylistItem(index)}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p class="text-yellow-700">部屋情報が見つかりません</p>
      </div>
    {/if}
  </main>
</div>

<!-- 部屋名編集モーダル -->
<Modal
  open={isRoomNameModalOpen}
  title="部屋名を編集"
  on:close={() => isRoomNameModalOpen = false}
>
  <div class="space-y-4">
    <TextField
      id="roomName"
      label="部屋名"
      bind:value={newRoomName}
      error={roomNameError}
      fullWidth={true}
    />
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isRoomNameModalOpen = false}>キャンセル</Button>
      <Button variant="primary" on:click={saveRoomName}>保存</Button>
    </div>
  </div>
</Modal>

<!-- 家具選択モーダル -->
<Modal
  open={isFurnitureModalOpen}
  title={`${selectedFurnitureType}を選択`}
  on:close={() => isFurnitureModalOpen = false}
>
  {#if $furnitureStore.isLoading}
    <p>読み込み中...</p>
  {:else if furnitureItems.length === 0}
    <p>利用可能な家具がありません</p>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-1">
      {#each furnitureItems as item}
        <div 
          class="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          on:click={() => selectFurniture(item.id)}
        >
          {#if item.imageUrl}
            <img src={item.imageUrl} alt={item.name} class="w-full h-32 object-cover rounded mb-2" />
          {:else}
            <div class="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
              <span class="text-gray-500">画像なし</span>
            </div>
          {/if}
          <p class="font-medium">{item.name}</p>
        </div>
      {/each}
    </div>
  {/if}
  
  <div slot="footer" class="flex justify-end">
    <Button variant="ghost" on:click={() => isFurnitureModalOpen = false}>キャンセル</Button>
  </div>
</Modal>

<!-- プレイリスト追加モーダル -->
<Modal
  open={isPlaylistModalOpen}
  title="プレイリストに追加"
  on:close={() => isPlaylistModalOpen = false}
>
  <div class="space-y-4">
    <TextField
      id="playlistTitle"
      label="タイトル"
      bind:value={newPlaylistTitle}
      error={playlistError}
      fullWidth={true}
    />
    
    <TextField
      id="playlistUrl"
      label="URL"
      bind:value={newPlaylistUrl}
      placeholder="https://..."
      fullWidth={true}
    />
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isPlaylistModalOpen = false}>キャンセル</Button>
      <Button variant="primary" on:click={addPlaylistItem}>追加</Button>
    </div>
  </div>
</Modal>
