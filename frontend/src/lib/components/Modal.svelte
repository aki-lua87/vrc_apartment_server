<script lang="ts">
  import { fade, scale } from 'svelte/transition';
  import { createEventDispatcher } from 'svelte';
  
  export let open: boolean = false;
  export let title: string = '';
  export let showCloseButton: boolean = true;
  export let closeOnClickOutside: boolean = true;
  export let maxWidth: string = 'max-w-md';
  
  const dispatch = createEventDispatcher();
  
  function close() {
    dispatch('close');
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (open && event.key === 'Escape') {
      close();
    }
  }
  
  function handleClickOutside(event: MouseEvent) {
    if (closeOnClickOutside && event.target === event.currentTarget) {
      close();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
    on:click={handleClickOutside}
    transition:fade={{ duration: 200 }}
  >
    <div
      class="relative bg-white rounded-lg shadow-xl overflow-hidden {maxWidth} w-full"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      {#if title || showCloseButton}
        <div class="flex items-center justify-between p-4 border-b border-gray-200">
          {#if title}
            <h3 class="text-lg font-medium text-gray-900">{title}</h3>
          {:else}
            <div></div>
          {/if}
          
          {#if showCloseButton}
            <button
              type="button"
              class="text-gray-400 hover:text-gray-500 focus:outline-none"
              on:click={close}
              aria-label="閉じる"
            >
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          {/if}
        </div>
      {/if}
      
      <div class="p-4">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <div class="p-4 border-t border-gray-200 bg-gray-50">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}
