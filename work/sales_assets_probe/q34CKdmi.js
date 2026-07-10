const e=`<template>
  <flex-row
    class="w-full px-4 py-3.5 justify-between items-center border rounded-xl"
    :class="[
      error ? 'border-red-600' : 'border-neutral-200',
      progressMode ? '' : 'bg-white',
    ]"
    :style="progressBackgroundStyle"
  >
    <flex-row class="gap-3">
      <IconExcelSVG :size="40" />
      <flex-col class="gap-0.5">
        <span class="text-sm font-medium text-neutral-950">
          {{ fileName }}
        </span>
        <flex-row class="items-center gap-2">
          <span class="text-sm text-neutral-600">{{ formatFileSize }}</span>

          <hr class="w-0.5 h-[50%] bg-[#D5D7DA]" />

          <flex-row class="items-center gap-1">
            <IconWarning v-if="error" color="#E82F2F" />
            <IconUploadCloud
              v-else-if="percent && percent < 100"
              class="text-neutral-600"
            />
            <IconCheckCircle
              v-else-if="percent === 100"
              class="text-green-600"
            />
            <span v-if="!error" class="text-sm text-neutral-600">
              {{ percent || 0 }}%
            </span>
          </flex-row>
        </flex-row>
      </flex-col>
    </flex-row>

    <div class="p-2 cursor-pointer" @click="() => emits('clearFile')">
      <IconTrash :size="20" />
    </div>
  </flex-row>
</template>

<script setup lang="ts">
// Emits
const emits = defineEmits<{
  (e: "clearFile"): void;
}>();

// Props

interface Props {
  fileName?: string;
  size?: number;
  percent?: number;
  error?: string | boolean;
  progressMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  fileName: "File.xls",
  size: 0,
});

// Hooks

const progressPercent = computed(() => {
  if (props.error || !props.progressMode || props.percent === undefined)
    return 0;
  return Math.min(Math.max(props.percent, 0), 100);
});

const progressBackgroundStyle = computed(() => {
  if (!progressPercent.value) return undefined;

  return {
    background: \`linear-gradient(to right, #F5F5F5 \${progressPercent.value}%, #FFFFFF \${progressPercent.value}%)\`,
  };
});

const formatFileSize = computed(() => {
  const bytes = props.size;
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
});
<\/script>
`;export{e as default};
