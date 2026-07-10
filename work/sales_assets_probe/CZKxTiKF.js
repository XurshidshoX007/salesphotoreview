const n=`<template>
  <side-menu
    variant="tree"
    :data="menus"
    :open-items="openItems"
    @update:open-items="(value) => emit('update:openItems', value)"
  >
    <template #level-1="{ item, hasChildren }">
      <div v-if="item.renderType === 'simpleLabel'" class="leading-6">
        {{ item.name }}
      </div>
      <div v-else class="relative flex items-center rounded-lg gap-1 p-1 h-10">
        <icon-dot v-if="!hasChildren" size="16" class="shrink-0" />
        <span class="truncate" :title="item.name">{{ item.name }}</span>
      </div>
    </template>
  </side-menu>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface MenuType {
  name?: string;
  id: string | number;
  children?: MenuType[];
  [key: string]: any;
}

type Props = {
  openItems?: Record<string, boolean>;
  menus?: MenuType[];
};

type Emits = {
  (e: "update:openItems", value: Record<string, boolean>): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// Hooks
<\/script>
`;export{n as default};
