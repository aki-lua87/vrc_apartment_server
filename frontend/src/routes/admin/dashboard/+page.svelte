<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '../../../lib/components/Button.svelte';
  import TextField from '../../../lib/components/TextField.svelte';
  import Modal from '../../../lib/components/Modal.svelte';
  import { authStore } from '../../../lib/stores/auth';
  import { interiorAPI, adminAPI, type InteriorType, type InteriorPattern } from '../../../lib/api';
  
  // 認証チェック
  onMount(async () => {
    if (!$authStore.isAuthenticated || !$authStore.isAdmin) {
      // 未認証または管理者でない場合は管理者ログイン画面へリダイレクト
      goto('/admin');
      return;
    }
    
    // データ取得
    await fetchInteriorTypes();
    await fetchInteriorPatterns();
  });
  
  // ログアウト処理
  function handleLogout() {
    authStore.logout();
    goto('/admin');
  }
  
  // 内装タイプ関連
  let interiorTypes: InteriorType[] = [];
  let isLoadingTypes = false;
  let typeError = '';
  
  // 内装タイプ取得
  async function fetchInteriorTypes() {
    isLoadingTypes = true;
    typeError = '';
    
    try {
      const result = await interiorAPI.getInteriorTypes();
      interiorTypes = result.types;
    } catch (error) {
      typeError = error instanceof Error ? error.message : '内装タイプの取得に失敗しました';
    } finally {
      isLoadingTypes = false;
    }
  }
  
  // 内装タイプ追加モーダル
  let isAddTypeModalOpen = false;
  let newTypeCode = '';
  let newTypeName = '';
  let addTypeError = '';
  
  function openAddTypeModal() {
    newTypeCode = '';
    newTypeName = '';
    addTypeError = '';
    isAddTypeModalOpen = true;
  }
  
  async function addInteriorType() {
    if (!newTypeCode.trim()) {
      addTypeError = 'コードを入力してください';
      return;
    }
    
    if (!newTypeName.trim()) {
      addTypeError = '名前を入力してください';
      return;
    }
    
    addTypeError = '';
    
    try {
      await adminAPI.addInteriorType(newTypeCode, newTypeName);
      isAddTypeModalOpen = false;
      await fetchInteriorTypes();
    } catch (error) {
      addTypeError = error instanceof Error ? error.message : '内装タイプの追加に失敗しました';
    }
  }
  
  // 内装タイプ編集モーダル
  let isEditTypeModalOpen = false;
  let editingTypeId: number | null = null;
  let editTypeCode = '';
  let editTypeName = '';
  let editTypeError = '';
  
  function openEditTypeModal(type: InteriorType) {
    editingTypeId = type.id;
    editTypeCode = type.code;
    editTypeName = type.name;
    editTypeError = '';
    isEditTypeModalOpen = true;
  }
  
  async function updateInteriorType() {
    if (!editingTypeId) return;
    
    if (!editTypeCode.trim()) {
      editTypeError = 'コードを入力してください';
      return;
    }
    
    if (!editTypeName.trim()) {
      editTypeError = '名前を入力してください';
      return;
    }
    
    editTypeError = '';
    
    try {
      await adminAPI.updateInteriorType(editingTypeId, {
        code: editTypeCode,
        name: editTypeName
      });
      isEditTypeModalOpen = false;
      await fetchInteriorTypes();
    } catch (error) {
      editTypeError = error instanceof Error ? error.message : '内装タイプの更新に失敗しました';
    }
  }
  
  // 内装タイプ削除確認モーダル
  let isDeleteTypeModalOpen = false;
  let deletingTypeId: number | null = null;
  let deletingTypeName = '';
  let deleteTypeError = '';
  
  function openDeleteTypeModal(type: InteriorType) {
    deletingTypeId = type.id;
    deletingTypeName = type.name;
    deleteTypeError = '';
    isDeleteTypeModalOpen = true;
  }
  
  async function deleteInteriorType() {
    if (!deletingTypeId) return;
    
    try {
      await adminAPI.deleteInteriorType(deletingTypeId);
      isDeleteTypeModalOpen = false;
      await fetchInteriorTypes();
    } catch (error) {
      deleteTypeError = error instanceof Error ? error.message : '内装タイプの削除に失敗しました';
    }
  }
  
  // 内装パターン関連
  let interiorPatterns: InteriorPattern[] = [];
  let isLoadingPatterns = false;
  let patternError = '';
  
  // 内装パターン取得
  async function fetchInteriorPatterns() {
    isLoadingPatterns = true;
    patternError = '';
    
    try {
      const result = await interiorAPI.getInteriorPatterns();
      interiorPatterns = result.patterns;
    } catch (error) {
      patternError = error instanceof Error ? error.message : '内装パターンの取得に失敗しました';
    } finally {
      isLoadingPatterns = false;
    }
  }
  
  // 内装パターン追加モーダル
  let isAddPatternModalOpen = false;
  let newPatternName = '';
  let newPatternDescription = '';
  let addPatternError = '';
  
  function openAddPatternModal() {
    newPatternName = '';
    newPatternDescription = '';
    addPatternError = '';
    isAddPatternModalOpen = true;
  }
  
  async function addInteriorPattern() {
    if (!newPatternName.trim()) {
      addPatternError = '名前を入力してください';
      return;
    }
    
    addPatternError = '';
    
    try {
      await adminAPI.addInteriorPattern(newPatternName, newPatternDescription);
      isAddPatternModalOpen = false;
      await fetchInteriorPatterns();
    } catch (error) {
      addPatternError = error instanceof Error ? error.message : '内装パターンの追加に失敗しました';
    }
  }
  
  // 内装パターン編集モーダル
  let isEditPatternModalOpen = false;
  let editingPatternId: number | null = null;
  let editPatternName = '';
  let editPatternDescription = '';
  let editPatternError = '';
  
  function openEditPatternModal(pattern: InteriorPattern) {
    editingPatternId = pattern.id;
    editPatternName = pattern.name;
    editPatternDescription = pattern.description || '';
    editPatternError = '';
    isEditPatternModalOpen = true;
  }
  
  async function updateInteriorPattern() {
    if (!editingPatternId) return;
    
    if (!editPatternName.trim()) {
      editPatternError = '名前を入力してください';
      return;
    }
    
    editPatternError = '';
    
    try {
      await adminAPI.updateInteriorPattern(editingPatternId, {
        name: editPatternName,
        description: editPatternDescription || null
      });
      isEditPatternModalOpen = false;
      await fetchInteriorPatterns();
    } catch (error) {
      editPatternError = error instanceof Error ? error.message : '内装パターンの更新に失敗しました';
    }
  }
  
  // 内装パターン削除確認モーダル
  let isDeletePatternModalOpen = false;
  let deletingPatternId: number | null = null;
  let deletingPatternName = '';
  let deletePatternError = '';
  
  function openDeletePatternModal(pattern: InteriorPattern) {
    deletingPatternId = pattern.id;
    deletingPatternName = pattern.name;
    deletePatternError = '';
    isDeletePatternModalOpen = true;
  }
  
  async function deleteInteriorPattern() {
    if (!deletingPatternId) return;
    
    try {
      await adminAPI.deleteInteriorPattern(deletingPatternId);
      isDeletePatternModalOpen = false;
      await fetchInteriorPatterns();
    } catch (error) {
      deletePatternError = error instanceof Error ? error.message : '内装パターンの削除に失敗しました';
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <!-- ヘッダー -->
  <header class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">VRCアパートメント 管理画面</h1>
      <Button variant="outline" on:click={handleLogout}>ログアウト</Button>
    </div>
  </header>
  
  <!-- メインコンテンツ -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
      <!-- 内装タイプ管理セクション -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">内装タイプ管理</h2>
            <Button variant="primary" size="sm" on:click={openAddTypeModal}>追加</Button>
          </div>
          
          {#if isLoadingTypes}
            <div class="flex justify-center items-center h-32">
              <p class="text-lg">読み込み中...</p>
            </div>
          {:else if typeError}
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p class="text-red-600">{typeError}</p>
            </div>
          {:else if interiorTypes.length === 0}
            <p class="text-gray-600">内装タイプがありません</p>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">コード</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each interiorTypes as type}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.id}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.code}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type.name}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          class="text-indigo-600 hover:text-indigo-900 mr-3"
                          on:click={() => openEditTypeModal(type)}
                        >
                          編集
                        </button>
                        <button 
                          class="text-red-600 hover:text-red-900"
                          on:click={() => openDeleteTypeModal(type)}
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
      
      <!-- 内装パターン管理セクション -->
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-900">内装パターン管理</h2>
            <Button variant="primary" size="sm" on:click={openAddPatternModal}>追加</Button>
          </div>
          
          {#if isLoadingPatterns}
            <div class="flex justify-center items-center h-32">
              <p class="text-lg">読み込み中...</p>
            </div>
          {:else if patternError}
            <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <p class="text-red-600">{patternError}</p>
            </div>
          {:else if interiorPatterns.length === 0}
            <p class="text-gray-600">内装パターンがありません</p>
          {:else}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">説明</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each interiorPatterns as pattern}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pattern.id}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{pattern.name}</td>
                      <td class="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{pattern.description || '-'}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          class="text-indigo-600 hover:text-indigo-900 mr-3"
                          on:click={() => openEditPatternModal(pattern)}
                        >
                          編集
                        </button>
                        <button 
                          class="text-red-600 hover:text-red-900"
                          on:click={() => openDeletePatternModal(pattern)}
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
  </main>
</div>

<!-- 内装タイプ追加モーダル -->
<Modal
  open={isAddTypeModalOpen}
  title="内装タイプを追加"
  on:close={() => isAddTypeModalOpen = false}
>
  <div class="space-y-4">
    <TextField
      id="newTypeCode"
      label="コード"
      bind:value={newTypeCode}
      error={addTypeError}
      fullWidth={true}
      placeholder="例: chair"
    />
    
    <TextField
      id="newTypeName"
      label="名前"
      bind:value={newTypeName}
      fullWidth={true}
      placeholder="例: 椅子"
    />
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isAddTypeModalOpen = false}>キャンセル</Button>
      <Button variant="primary" on:click={addInteriorType}>追加</Button>
    </div>
  </div>
</Modal>

<!-- 内装タイプ編集モーダル -->
<Modal
  open={isEditTypeModalOpen}
  title="内装タイプを編集"
  on:close={() => isEditTypeModalOpen = false}
>
  <div class="space-y-4">
    <TextField
      id="editTypeCode"
      label="コード"
      bind:value={editTypeCode}
      error={editTypeError}
      fullWidth={true}
    />
    
    <TextField
      id="editTypeName"
      label="名前"
      bind:value={editTypeName}
      fullWidth={true}
    />
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isEditTypeModalOpen = false}>キャンセル</Button>
      <Button variant="primary" on:click={updateInteriorType}>保存</Button>
    </div>
  </div>
</Modal>

<!-- 内装タイプ削除確認モーダル -->
<Modal
  open={isDeleteTypeModalOpen}
  title="内装タイプを削除"
  on:close={() => isDeleteTypeModalOpen = false}
>
  <div class="space-y-4">
    <p>内装タイプ「{deletingTypeName}」を削除してもよろしいですか？</p>
    <p class="text-sm text-gray-500">この操作は取り消せません。</p>
    
    {#if deleteTypeError}
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-red-600">{deleteTypeError}</p>
      </div>
    {/if}
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isDeleteTypeModalOpen = false}>キャンセル</Button>
      <Button variant="danger" on:click={deleteInteriorType}>削除</Button>
    </div>
  </div>
</Modal>

<!-- 内装パターン追加モーダル -->
<Modal
  open={isAddPatternModalOpen}
  title="内装パターンを追加"
  on:close={() => isAddPatternModalOpen = false}
>
  <div class="space-y-4">
    <TextField
      id="newPatternName"
      label="名前"
      bind:value={newPatternName}
      error={addPatternError}
      fullWidth={true}
      placeholder="例: モダン"
    />
    
    <TextField
      id="newPatternDescription"
      label="説明"
      bind:value={newPatternDescription}
      fullWidth={true}
      placeholder="例: モダンなデザインのパターン"
    />
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isAddPatternModalOpen = false}>キャンセル</Button>
      <Button variant="primary" on:click={addInteriorPattern}>追加</Button>
    </div>
  </div>
</Modal>

<!-- 内装パターン編集モーダル -->
<Modal
  open={isEditPatternModalOpen}
  title="内装パターンを編集"
  on:close={() => isEditPatternModalOpen = false}
>
  <div class="space-y-4">
    <TextField
      id="editPatternName"
      label="名前"
      bind:value={editPatternName}
      error={editPatternError}
      fullWidth={true}
    />
    
    <TextField
      id="editPatternDescription"
      label="説明"
      bind:value={editPatternDescription}
      fullWidth={true}
    />
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isEditPatternModalOpen = false}>キャンセル</Button>
      <Button variant="primary" on:click={updateInteriorPattern}>保存</Button>
    </div>
  </div>
</Modal>

<!-- 内装パターン削除確認モーダル -->
<Modal
  open={isDeletePatternModalOpen}
  title="内装パターンを削除"
  on:close={() => isDeletePatternModalOpen = false}
>
  <div class="space-y-4">
    <p>内装パターン「{deletingPatternName}」を削除してもよろしいですか？</p>
    <p class="text-sm text-gray-500">この操作は取り消せません。</p>
    
    {#if deletePatternError}
      <div class="bg-red-50 border border-red-200 rounded-md p-4">
        <p class="text-red-600">{deletePatternError}</p>
      </div>
    {/if}
    
    <div class="flex justify-end space-x-3">
      <Button variant="ghost" on:click={() => isDeletePatternModalOpen = false}>キャンセル</Button>
      <Button variant="danger" on:click={deleteInteriorPattern}>削除</Button>
    </div>
  </div>
</Modal>
