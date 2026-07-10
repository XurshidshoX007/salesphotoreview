const n=`<template>
  <transition name="modal">
    <div v-if="modelValue">
      <d-modal
        :name="modalTitle"
        data-container-width="533px"
        @closeDialog="onClose"
      >
        <div
          class="divide-y divide-gray-200 py-2 overflow-y-auto border border-gray-200 rounded-lg p-4"
        >
          <div
            v-for="(item, index) in items"
            :key="\`\${item.label}-\${index}\`"
            class="flex items-center justify-between px-3 py-3 transition-colors"
          >
            <span class="text-sm text-gray-700 truncate min-w-0">
              {{ item.label }}
            </span>
            <div
              class="flex items-center justify-end gap-0.5 flex-shrink-0 w-20 min-w-[5rem] border border-gray-200 rounded-lg px-2.5 py-[6px]"
            >
              <span class="text-sm font-semibold text-gray-800">
                {{ item.percent }}
              </span>
              <span class="text-sm text-gray-500 font-normal">%</span>
            </div>
          </div>
        </div>
      </d-modal>
    </div>
  </transition>
</template>

<script setup lang="ts">
// Types
type DoughnutData = {
  label: string;
  value: number;
  percent: number;
  color?: string;
};

type Props = {
  modelValue: boolean;
  modalTitle: string;
  items: DoughnutData[];
};

// Props
defineProps<Props>();

// Emits
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

// Methods
function onClose() {
  emit("update:modelValue", false);
}
<\/script>
`;export{n as default};
