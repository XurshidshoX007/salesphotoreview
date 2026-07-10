const n=`<template>
  <div
    class="dropdown-btn cursor-pointer border-1 px-3 fs-14 fw-4 text-neutral-950 select-none"
    :class="[
      isSelect ? 'border-red' : \`border-\${borderColor}\`,
      !disabled ? '' : 'bg-gray-50 opacity-70',
      isOpenDropDown
        ? dropdownPosition === 'top-start'
          ? 'rounded-b-[10px]'
          : 'rounded-t-[10px]'
        : 'rounded-[10px]',
    ]"
    :type="type || 'button'"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  isSelect?: boolean;
  borderColor?: string;
  type?: string;
  disabled?: boolean;
  isOpenDropDown?: boolean;
  dropdownPosition?: "top-start" | "bottom-start";
}>();
<\/script>
`;export{n as default};
