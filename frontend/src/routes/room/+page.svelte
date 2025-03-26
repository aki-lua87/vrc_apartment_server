<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Button from '../../lib/components/Button.svelte';
	import TextField from '../../lib/components/TextField.svelte';
	import Modal from '../../lib/components/Modal.svelte';
	import { authStore } from '../../lib/stores/auth';
	import { roomStore, interiorStore } from '../../lib/stores/room';
	import type { InteriorType, InteriorPattern } from '../../lib/api';

	// 認証チェック
	onMount(() => {
		try {
			const { isAuthenticated, roomNumber } = $authStore;
			if (!isAuthenticated) {
				// 未認証の場合はログイン画面へリダイレクト
				goto('/');
				return;
			}

			// 部屋情報を取得
			// ログインIDを使用して部屋情報を取得
			const loginId = getLoginIdFromAuthStore();
			if (loginId) {
				roomStore.fetchRoomByLoginId(loginId);
			} else {
				console.error('ログインIDが取得できません');
			}

			// 内装タイプと内装パターンの一覧を取得
			interiorStore.fetchInteriorTypes();
			interiorStore.fetchInteriorPatterns();
			interiorStore.fetchInteriorCombinations();
		} catch (error) {
			console.error('初期化エラー:', error);
		}
	});

	// authStoreからログインIDを取得する関数
	function getLoginIdFromAuthStore() {
		// 実際のアプリでは、authStoreにログインIDが保存されている想定
		// このサンプルでは簡略化のため、固定値を返す
		// return 'login1';

		// 実際の実装では以下のようになる
		return $authStore.loginId;
	}

	// ログアウト処理
	function handleLogout() {
		try {
			authStore.logout();
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
			newRoomName = $roomStore.currentRoom.roomName || '';
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
			// ログインIDを取得
			const loginId = getLoginIdFromAuthStore();
			if (!loginId) {
				roomNameError = 'ログインIDが取得できません';
				return;
			}

			await roomStore.updateRoomName(loginId, newRoomName);
			isRoomNameModalOpen = false;
		} catch (error) {
			roomNameError = error instanceof Error ? error.message : '不明なエラーが発生しました';
		}
	}

	// 内装編集
	let isInteriorModalOpen = false;
	let selectedInteriorType: InteriorType | null = null;
	let selectedPatterns: InteriorPattern[] = [];

	function openInteriorModal(type: InteriorType) {
		selectedInteriorType = type;

		// 選択されたタイプに対応するパターンを取得
		const combination = $interiorStore.combinations.find((c) => c.type.id === type.id);
		if (combination) {
			selectedPatterns = combination.patterns;
			isInteriorModalOpen = true;
		}
	}

	async function selectInteriorPattern(patternId: number) {
		if (!selectedInteriorType) return;

		try {
			// ログインIDを取得
			const loginId = getLoginIdFromAuthStore();
			if (!loginId) {
				console.error('ログインIDが取得できません');
				return;
			}

			// 内装を更新
			await roomStore.updateInteriors(loginId, [
				{ type: selectedInteriorType.code, pattern: patternId }
			]);

			isInteriorModalOpen = false;
		} catch (error) {
			console.error('内装更新エラー:', error);
		}
	}

	// プレイリスト編集
	let isPlaylistModalOpen = false;
	let newPlaylistUrl = '';
	let playlistError = '';

	function openPlaylistModal() {
		newPlaylistUrl = '';
		playlistError = '';
		isPlaylistModalOpen = true;
	}

	function removePlaylistItem(index: number) {
		if ($roomStore.currentRoom) {
			const updatedPlaylists = [...$roomStore.currentRoom.playlists];
			updatedPlaylists.splice(index, 1);

			// ログインIDを取得
			const loginId = getLoginIdFromAuthStore();
			if (!loginId) {
				console.error('ログインIDが取得できません');
				return;
			}

			roomStore.updatePlaylists(loginId, updatedPlaylists);
		}
	}

	async function addPlaylistItem() {
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
			if ($roomStore.currentRoom.playlists.length >= 10) {
				playlistError = 'プレイリストは最大10件までです';
				return;
			}

			const updatedPlaylists = [...$roomStore.currentRoom.playlists, newPlaylistUrl];

			try {
				// ログインIDを取得
				const loginId = getLoginIdFromAuthStore();
				if (!loginId) {
					playlistError = 'ログインIDが取得できません';
					return;
				}

				await roomStore.updatePlaylists(loginId, updatedPlaylists);
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
		<div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
			<h1 class="text-2xl font-bold text-gray-900">VRCアパートメント</h1>
			<Button variant="outline" on:click={handleLogout}>ログアウト</Button>
		</div>
	</header>

	<!-- メインコンテンツ -->
	<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		{#if $roomStore.isLoading}
			<div class="flex h-64 items-center justify-center">
				<p class="text-lg">読み込み中...</p>
			</div>
		{:else if $roomStore.error}
			<div class="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
				<p class="text-red-600">{$roomStore.error}</p>
			</div>
		{:else if $roomStore.currentRoom}
			<!-- 部屋情報 -->
			<div class="mb-8 overflow-hidden rounded-lg bg-white shadow">
				<div class="p-6">
					<div class="mb-6 flex items-center justify-between">
						<h2 class="text-xl font-semibold text-gray-900">
							{$roomStore.currentRoom.roomName || '名称未設定'}
						</h2>
						<Button variant="outline" size="sm" on:click={openRoomNameModal}>部屋名を編集</Button>
					</div>

					<!-- 内装編集セクション -->
					<div class="mb-8">
						<h3 class="mb-4 text-lg font-medium text-gray-900">内装編集</h3>

						{#if $interiorStore.isLoading}
							<p>内装タイプを読み込み中...</p>
						{:else if $interiorStore.error}
							<p class="text-red-600">{$interiorStore.error}</p>
						{:else if $interiorStore.types.length === 0}
							<p>内装タイプがありません</p>
						{:else}
							<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
								{#each $interiorStore.types as type}
									<div class="rounded-lg border bg-gray-50 p-4">
										<div class="flex items-center justify-between">
											<h4 class="font-medium">{type.name}</h4>
											<Button
												variant="secondary"
												size="sm"
												on:click={() => openInteriorModal(type)}
											>
												変更
											</Button>
										</div>
										<p class="mt-2 text-sm text-gray-600">
											コード: {type.code}
										</p>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- プレイリスト編集セクション -->
					<div>
						<div class="mb-4 flex items-center justify-between">
							<h3 class="text-lg font-medium text-gray-900">プレイリスト編集</h3>
							<Button
								variant="primary"
								size="sm"
								on:click={openPlaylistModal}
								disabled={$roomStore.currentRoom.playlists.length >= 10}
							>
								追加
							</Button>
						</div>

						{#if $roomStore.currentRoom.playlists.length === 0}
							<p class="text-gray-600">プレイリストはまだありません</p>
						{:else}
							<div class="overflow-hidden rounded-lg border">
								<table class="min-w-full divide-y divide-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th
												class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
												>URL</th
											>
											<th
												class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"
												>操作</th
											>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each $roomStore.currentRoom.playlists as url, index}
											<tr>
												<td
													class="max-w-xs truncate whitespace-nowrap px-6 py-4 text-sm text-gray-500"
												>
													<a
														href={url}
														target="_blank"
														rel="noopener noreferrer"
														class="text-primary-600 hover:underline"
													>
														{url}
													</a>
												</td>
												<td class="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
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
			<div class="rounded-md border border-yellow-200 bg-yellow-50 p-4">
				<p class="text-yellow-700">部屋情報が見つかりません</p>
			</div>
		{/if}
	</main>
</div>

<!-- 部屋名編集モーダル -->
<Modal
	open={isRoomNameModalOpen}
	title="部屋名を編集"
	on:close={() => (isRoomNameModalOpen = false)}
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
			<Button variant="ghost" on:click={() => (isRoomNameModalOpen = false)}>キャンセル</Button>
			<Button variant="primary" on:click={saveRoomName}>保存</Button>
		</div>
	</div>
</Modal>

<!-- 内装パターン選択モーダル -->
<Modal
	open={isInteriorModalOpen}
	title={selectedInteriorType ? `${selectedInteriorType.name}のパターンを選択` : 'パターンを選択'}
	on:close={() => (isInteriorModalOpen = false)}
>
	{#if $interiorStore.isLoading}
		<p>読み込み中...</p>
	{:else if selectedPatterns.length === 0}
		<p>利用可能なパターンがありません</p>
	{:else}
		<div class="grid max-h-96 grid-cols-1 gap-4 overflow-y-auto p-1 sm:grid-cols-2">
			{#each selectedPatterns as pattern}
				<div
					class="cursor-pointer rounded-lg border p-4 transition-colors hover:bg-gray-50"
					on:click={() => selectInteriorPattern(pattern.id)}
				>
					<p class="font-medium">{pattern.name}</p>
					{#if pattern.description}
						<p class="mt-1 text-sm text-gray-600">{pattern.description}</p>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<div slot="footer" class="flex justify-end">
		<Button variant="ghost" on:click={() => (isInteriorModalOpen = false)}>キャンセル</Button>
	</div>
</Modal>

<!-- プレイリスト追加モーダル -->
<Modal
	open={isPlaylistModalOpen}
	title="プレイリストに追加"
	on:close={() => (isPlaylistModalOpen = false)}
>
	<div class="space-y-4">
		<TextField
			id="playlistUrl"
			label="URL"
			bind:value={newPlaylistUrl}
			error={playlistError}
			placeholder="https://..."
			fullWidth={true}
		/>

		<div class="flex justify-end space-x-3">
			<Button variant="ghost" on:click={() => (isPlaylistModalOpen = false)}>キャンセル</Button>
			<Button variant="primary" on:click={addPlaylistItem}>追加</Button>
		</div>
	</div>
</Modal>
