const n=`<template>
  <div class="max-w-full animate-pulse">
    <flex-col
      class="gap-2.5"
      :class="(padding && \`p-\${padding}\`) || 'p-3 gap-2.5'"
    >
      <div
        v-for="row in rows"
        :key="row"
        :style="{ width: getRandomWidth() || '100%', height: height }"
        class="h-4.5 rounded-full bg-gray-200 dark:bg-gray-400 max-w-full"
      ></div>
    </flex-col>
    <span class="sr-only">Loading...</span>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  height?: number | string;
  rows: number;
  maxRowWidth?: number | string;
  padding?: number | string;
}>();

// methods
const getRandomWidth = (): string | null => {
  if (props.maxRowWidth != null) {
    const base = Number(props.maxRowWidth) || 100;
    const width = Math.floor(Math.random() * 51) + base;
    return \`\${width}px\`;
  }
  return null;
};
<\/script>
`;export{n as default};
