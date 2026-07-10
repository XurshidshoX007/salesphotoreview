const e=`<template>
  <div
    class="flex gap-1 fs-14 fw-4 items-center cursor-pointer select-none"
    :class="(textPositionIsRight && 'justify-end gap-4') || 'justify-between'"
    @click="changeSort(propsKey)"
  >
    <div class="secondary-gray-text">
      {{ name }}
    </div>
    <div v-if="!withoutOrderBy" class="grid h-fit">
      <div v-if="sorted?.field === propsKey">
        <div>
          <icon-bottom-order-by
            v-if="!(sorted?.field?.includes(propsKey) && !sorted.is_asc)"
            class="rotate-180"
          />
        </div>
        <div>
          <icon-bottom-order-by
            v-if="!(sorted?.field?.includes(propsKey) && sorted.is_asc)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  sorted: Object,
  withoutOrderBy: Boolean,
  textPositionIsRight: Boolean,
  propsKey: String,
  name: String,
});
const previousField = ref<string>("");
const emit = defineEmits(["sort", "getAllId"]);

const changeSort = (field: string) => {
  if (!props.withoutOrderBy) {
    if (props.sorted) {
      if (props.sorted?.is_asc) {
        emit("sort", { field, is_asc: false });
        previousField.value = field;
        return;
      } else {
        emit("sort", { field, is_asc: true });
        previousField.value = field;
        return;
      }
    } else emit("sort", { field, is_asc: !props.sorted?.is_asc });
    previousField.value = field;
    return;
  }
};
<\/script>
`;export{e as default};
