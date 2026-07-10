const e=`<template>
  <div
    class="text-neutral-950"
    :class="{
      [\`text-\${size} max-md:text-base\`]: size,
      'text-6 max-md:text-5': !size,
      [\`font-\${convertedWeight}\`]: convertedWeight,
      'font-semibold': !convertedWeight,
    }"
  >
    {{ title }}
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "400" | "500" | "600";
}>();

const convertedWeight = computed<string | undefined>(() => {
  if (!props.weight) return undefined;
  return \`[\${props.weight}]\`;
});
<\/script>
`;export{e as default};
