const e=`<template>
  <table class="w-full">
    <thead class="overflow-hidden">
      <c-tr class="border-t-0">
        <c-td-no-edit
          class="bg-neutral-50 c-td-css"
          v-for="header in headers"
          :key="header.name"
        >
          <div
            class="flex gap-1 w-[200px] fs-14 fw-4"
            :style="{ width: header.thWidth }"
            v-if="header.key !== 'radio'"
          >
            <Checkbox
              :title="header.name"
              @change="$emit('getAllId', $event)"
            />
          </div>

          <div
            v-if="header.key === 'radio'"
            class="flex gap-1 fs-14 fw-4 justify-end"
          >
            <RadioBtn
              :items="Format"
              :selected-item="selectItem"
              @onSelectItemId="selectFormat"
            />
          </div>
        </c-td-no-edit>
      </c-tr>
    </thead>
    <tbody>
      <slot name="body"></slot>
    </tbody>
  </table>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const props = defineProps({
  headers: Array,
});
const { t } = useI18n();
const emit = defineEmits(["selectFormat"]);

const Format = ref([
  {
    name: t("column.day"),
    key: "day",
    id: "day",
  },
  {
    name: t("column.date"),
    key: "date",
    id: "date",
  },
]);
let selectItem = ref("day");
const selectFormat = (item) => {
  selectItem.value = item;
  emit("selectFormat", item);
};
<\/script>

<style lang="scss">
.c-td-css {
  border-radius: 12px 12px 0 0;
}
</style>
`;export{e as default};
