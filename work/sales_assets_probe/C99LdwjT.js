const n=`<template>
  <td
    v-show="isChecked"
    :class="[
      headerKey && isWhitespaceNoWrap(headerKey) && 'whitespace-nowrap',
      type === 'action' && 'c-td-no-edit',
    ]"
    :rowspan="rowspan"
    :colspan="colspan"
    :style="customStyle"
  >
    <div
      :class="[
        type === 'action' && 'float-right',
        type === 'number' && 'text-end',
      ]"
    >
      <slot></slot>
    </div>
  </td>
</template>

<script setup lang="ts">
// Props

const props = defineProps({
  isChecked: {
    type: Boolean,
    default: true,
  },
  headerKey: String,
  type: String,
  rowspan: String,
  colspan: [String, Number],
  customStyle: Object,
});

const isWhitespaceNoWrap = (key: string) => {
  if (
    key.includes("visual_id") ||
    key.includes("date") ||
    key.includes("phone") ||
    key.includes("code") ||
    key.includes("sum") ||
    key.includes("cost") ||
    key.includes("balance")
  )
    return true;
  return false;
};
<\/script>

<style scoped lang="scss">
td {
  font-size: 14px;
  color: theme("colors.neutral.600");
  font-family: "Inter", sans-serif;
  font-weight: 400;
  padding: 10px;
  white-space: pre-wrap;

  @-moz-document url-prefix() {
    border-bottom: 1px solid #e1e4e4;
  }
}

thead {
  tr {
    td {
      color: #8fa0a0;
    }
  }
}

@media only screen and (max-width: 576px) {
  td {
    text-wrap: nowrap !important;
  }
}
</style>
`;export{n as default};
