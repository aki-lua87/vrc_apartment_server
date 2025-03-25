<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let type: 'button' | 'submit' | 'reset' = 'button';
  export let disabled = false;
  export let fullWidth = false;
  export let className = '';
  
  // バリアントに基づくスタイル
  const variantStyles = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-800',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'text-primary-600 hover:bg-primary-50',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  // サイズに基づくスタイル
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 rounded',
    md: 'text-base px-4 py-2 rounded-md',
    lg: 'text-lg px-6 py-3 rounded-lg',
  };
  
  // 無効状態のスタイル
  const disabledStyle = 'opacity-50 cursor-not-allowed';
  
  // 幅のスタイル
  const widthStyle = fullWidth ? 'w-full' : '';
  
  $: classes = `
    font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${disabled ? disabledStyle : ''}
    ${widthStyle}
    ${className}
  `;
</script>

<button
  type={type}
  class={classes}
  disabled={disabled}
  {...$$restProps}
>
  <slot />
</button>
