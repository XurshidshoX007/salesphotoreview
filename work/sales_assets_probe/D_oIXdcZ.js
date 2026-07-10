const n=`<template>
  <d-modal :name="t('table_menu_control')" @closeDialog="closeDialog">
    <div class="flex">
      <VueDraggable
        ref="el"
        v-model="_templates"
        :animation="150"
        ghostClass="ghost"
        class="flex flex-col gap-3 w-full m-auto"
        @start="(e) => (draggingIndex = e.oldIndex)"
        @end="() => (draggingIndex = null)"
      >
        <div
          v-for="(item, index) in _templates"
          :key="index"
          class="column-item"
          :class="{
            active: index === draggingIndex,
            disabled: draggingIndex !== null && index !== draggingIndex,
          }"
          v-show="item.checked"
        >
          <icon-menu-control-icon />
          <span class="title">{{ item.name || item.header }}</span>
        </div>
      </VueDraggable>
    </div>

    <template #footer>
      <div class="flex justify-between items-center gap-x-4">
        <m-btn class="w-1/2" @click="resetTemplates" group="outlined">
          {{ t("labels.reset") }}
        </m-btn>
        <m-btn class="w-1/2" @click="save">{{ t("save") }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import type { PropType } from "vue";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { setCheckedItemsToLocalByKey } from "~/utils/local-storage";
import { type UseDraggableReturn, VueDraggable } from "vue-draggable-plus";

const { t } = useI18n();
const el = ref<UseDraggableReturn>();
const draggingIndex = ref<number | null>(null);

// Props
const props = defineProps({
  templates: {
    required: true,
    type: Object as PropType<Template[]>,
  },
  saveKey: String,
});

const _templates = ref(
  props.templates?.filter(
    (column) => column.type !== "checkbox" && column.type !== "action"
  )
);

const _checkboxColumn = ref(
  props.templates?.filter((column) => column.type === "checkbox")
);

const _actionColumn = ref(
  props.templates?.filter((column) => column.type === "action")
);

const emit = defineEmits(["closeDialog", "change"]);

const save = () => {
  const changeTemplate = [
    ..._checkboxColumn.value,
    ..._templates.value,
    ..._actionColumn.value,
  ];
  emit("change", changeTemplate);

  if (props.saveKey) {
    setCheckedItemsToLocalByKey(props.saveKey, changeTemplate);
  }
  notify({ title: "Сохранено!" });
  closeDialog();
};

const resetTemplates = () => {
  _templates.value = props.templates?.filter(
    (column) => column.type !== "checkbox" && column.type !== "action"
  );
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style lang="scss" scoped>
.column-item {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid #e1e4e4;
  background: #fafdfd;
  cursor: pointer;
  display: flex;
  align-items: center;
  user-select: none;
  gap: 0 15px;

  &.active {
    background: #fafdfd;
    border-color: #299b9b;
  }

  &.disabled {
    opacity: 0.5;
  }

  .title {
    font-size: 16px;
    font-family: "Inter", sans-serif;
    font-weight: 400;
    color: #000000;
  }
}

.ghost {
  opacity: 0.4;
  background-color: #ef1a1a;
  border: 1px dashed #ccc;
}
</style>
`;export{n as default};
