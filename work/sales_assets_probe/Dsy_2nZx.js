const n=`<template>
  <svg
    width="40"
    height="40"
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19.9976 18.0912L26.6802 11.4087L28.5891 13.3176L21.9065 20.0001L28.5891 26.6826L26.6802 28.5915L19.9976 21.909L13.3151 28.5915L11.4062 26.6826L18.0887 20.0001L11.4062 13.3176L13.3151 11.4087L19.9976 18.0912Z"
      :fill="color || '#374957'"
    />
  </svg>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  color?: string;
}>();
<\/script>
`;export{n as default};
