<script lang="ts">
  export let id: string = '';
  export let label: string = '';
  export let value: string = '';
  export let type: 'text' | 'password' | 'email' | 'number' | 'url' = 'text';
  export let placeholder: string = '';
  export let disabled: boolean = false;
  export let error: string = '';
  export let fullWidth: boolean = false;
  export let className: string = '';
  
  // 入力フィールドのスタイル
  $: inputClasses = `
    block px-4 py-2 rounded-md border
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary-500'}
    focus:border-transparent focus:outline-none focus:ring-2 focus:ring-opacity-50
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  
  // ラベルのスタイル
  $: labelClasses = `
    block text-sm font-medium text-gray-700 mb-1
    ${disabled ? 'text-gray-500' : ''}
  `;
  
  // エラーメッセージのスタイル
  const errorClasses = 'mt-1 text-sm text-red-600';
</script>

<div class={fullWidth ? 'w-full' : ''}>
  {#if label}
    <label for={id} class={labelClasses}>
      {label}
    </label>
  {/if}
  
  <input
    {id}
    {type}
    {placeholder}
    {disabled}
    bind:value
    class={inputClasses}
    {...$$restProps}
  />
  
  {#if error}
    <p class={errorClasses}>{error}</p>
  {/if}
</div>
