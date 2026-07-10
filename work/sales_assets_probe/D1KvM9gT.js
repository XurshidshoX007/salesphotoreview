const n=`<template>
  <div
    id="toggle"
    v-click-outside="closeDropdown"
    class="checkbox-table relative group dropdown"
  >
    <!-- Button with Tooltip -->
    <i-btn
      @click="toggleDropdown"
      v-tooltip="{
        text: t('show_hide_column'),
        placement: 'top',
        nowrap: true,
      }"
    >
      <IconColsSVG />
    </i-btn>

    <!-- Dropdown Content -->
    <div
      class="table-checkbox-content"
      :class="{ show: isOpen, top: isDropdownPositionTop }"
    >
      <div class="table-checkbox">
        <!-- 'Select All' Checkbox -->
        <!-- :indeterminate="table.getIsSomeColumnsVisible()" -->
        <Checkbox
          id="choose_all"
          :title="t('filters.choose_all')"
          :checked="table.getIsAllColumnsVisible()"
          class="whitespace-nowrap"
          @change="toggleAllColumns"
        />

        <!-- Individual Columns -->
        <div v-for="(column, index) in visibleColumns" :key="column.id">
          <Checkbox
            :id="\`column-\${column.id}-\${index}\`"
            :title="column.columnDef.header"
            :checked="column.getIsVisible()"
            class="whitespace-nowrap"
            @change="toggleColumn(column)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Column, Table } from "@tanstack/vue-table";

// Props
const props = defineProps<{
  table: Table<any>;
}>();

// Emits
const emit = defineEmits(["onToggle", "onToggleAll"]);

// State
const { t } = useI18n();
const isOpen = ref(false);

// Computed: Filtered Columns
const visibleColumns = computed(() =>
  props.table.getAllLeafColumns().filter((column: Column<any>) => {
    return !["select", "checkbox", "actions"].includes(column.id);
  }),
);

// Methods
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const toggleColumn = (column: Column<any>) => {
  emit("onToggle", column);
};

const toggleAllColumns = () => {
  emit("onToggleAll");
};

// Dropdown positioning logic
const isDropdownPositionTop = computed(() => {
  const dropdownButton = document.getElementById("toggle");
  if (!dropdownButton) return false;
  const windowHeight = window.innerHeight;
  const buttonRect = dropdownButton.getBoundingClientRect();
  return windowHeight < buttonRect.bottom + 150;
});
<\/script>

<style scoped lang="scss">
.dropdown {
  position: relative;
  display: inline-block;
}

.table-checkbox-content {
  flex-direction: column;
  gap: 5px;
  background-color: white;
  z-index: 9999;
  box-shadow:
    rgba(14, 30, 37, 0.12) 0px 2px 4px 0px,
    rgba(14, 30, 37, 0.32) 0px 2px 16px 0px;
  border-radius: 8px;
  padding-right: 12px;
  position: absolute;
  right: 0;
  top: 100%;
  left: 0;
  width: fit-content;
  min-width: fit-content;
  max-width: 400px;
  border-bottom: 10px inherit;
  border-top: 10px inherit;
  display: none;

  .table-checkbox {
    overflow-y: auto;
    padding: 16px;
    width: 100%;
    max-height: 440px;
    overflow-x: hidden;
  }
}

.show {
  display: block;
}

::-webkit-scrollbar {
  width: 8px;
  margin-right: 4px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px #e1e4e4;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{n as default};
