const n=`<template>
  <flex-col class="bg-white rounded-lg shadow-md overflow-hidden">
    <div
      v-for="item in items"
      :key="item.id"
      v-show="item?.isShowable !== false"
      class="menu-item"
      :class="{ disabled: disabled }"
      @click="click(item.id)"
    >
      {{
        item?.name ||
        item?.last_name ||
        item?.first_name ||
        item?.middle_name ||
        item?.full_name ||
        item?.product_name
      }}
    </div>
  </flex-col>
</template>

<script setup lang="ts">
// props
const props = defineProps<{
  items: object[];
  disabled?: boolean;
}>();

// emits
const emit = defineEmits(["click"]);

// methods
const click = (id: string | number) => {
  if (props.disabled) return;
  emit("click", id);
};
<\/script>

<style scoped lang="scss">
.menu-item {
  font-size: 14px;
  font-family: "Inter", sans-serif;
  font-weight: 400;
  color: #424f4f;
  padding: 12px 18px;
  border-bottom: 1px solid #e1e4e4;
  text-align: start;

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.menu-item:hover {
  background: #299b9b0d;
  color: #299b9b;
}

.menu-item:last-child {
  border: none;
}
</style>
`;export{n as default};
