const n=`<template>
  <div>
    <div
      v-tooltip="{
        text: t('labels.sorting_columns'),
        nowrap: true,
      }"
      class="control-order"
      :class="isOpenSortByDialog && 'active-control-order'"
      @click="openDialog"
    >
      <icon-sort-by-up :color="iconColorByAction" class="text-neutral-600" />
    </div>
    <transition name="modal">
      <div v-if="isOpenSortByDialog">
        <drag-and-drop
          :templates="templates"
          :save-key="saveKey"
          @change="onChangeTableHeaders"
          @closeDialog="closeDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { Template } from "~/interfaces/ui/template";

//props

const props = defineProps<{
  saveKey?: string;
  templates: Template[];
}>();

// emits
const emit = defineEmits(["onChangeTableHeaders"]);

// states
const { t } = useI18n();
const isOpenSortByDialog = ref(false);

// methods

const openDialog = () => {
  isOpenSortByDialog.value = true;
};

const closeDialog = () => {
  isOpenSortByDialog.value = false;
};

const onChangeTableHeaders = (param: Template[]) => {
  emit("onChangeTableHeaders", param);
  isOpenSortByDialog.value = false;
};

// hooks

const iconColorByAction = computed(() => {
  if (isOpenSortByDialog.value) return "#299B9B";
  return null;
});
<\/script>

<style lang="scss" scoped>
.control-order {
  padding: 10px;
  border-radius: 10px;
  gap: 8px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border: 1px solid theme("colors.neutral.200");
  height: 40px;
  width: 40px;

  .title {
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: theme("colors.neutral.600");
    user-select: none;
  }
}

.control-order:hover {
  border: 1px solid #299b9b;
}

.active-control-order {
  border: 1px solid #299b9b;
  background: #299b9b1a;

  .title {
    color: #299b9b;
  }
}

@media only screen and (max-width: 767px) {
  .control-order {
    .title {
      display: none;
    }
  }
}
</style>
`;export{n as default};
