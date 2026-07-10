const n=`<template>
  <div class="flex gap-3">
    <ItemList
      :items="statuses"
      :disabled="disabled || isLoading"
      class="block w-60 h-fit flex-0"
      @click="onChangeStatusById"
      v-click-outside="closeMenu"
    />
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  statuses: {
    id: number;
    name: string;
    access: boolean;
  }[];
  isLoading?: boolean;
  disabled?: boolean;
}>();

// emits
const emit = defineEmits([
  "change-status-by-id",
  "close-info-content",
  "close-menu",
]);

// methods
const onChangeStatusById = (status: string) => {
  emit("change-status-by-id", status);
};

const closeMenu = (event: Event) => {
  emit("close-menu");
};
<\/script>

<style scoped>
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}

.blur-background {
  backdrop-filter: blur(2px);
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
`;export{n as default};
