const n=`<template>
  <div class="tag-content">
    <div
      v-for="(item, index) in data"
      :key="item && typeof item === 'object' && 'id' in item ? item.id : index"
      class="tag-item"
    >
      {{ getItemLabel(item) }}
      <span class="fw-6" v-if="getItemDetails(item)">
        ({{ getItemDetails(item) }})
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
type TagItem =
  | {
      id?: string | number;
      employee_name?: string;
      name?: string;
      visit_days?: string[];
      code?: string;
    }
  | string;

const props = defineProps<{ data: TagItem[] }>();

function getItemLabel(item: TagItem): string {
  if (typeof item === "object" && item !== null) {
    return item.employee_name || item.name || "";
  }
  return String(item);
}

function getItemDetails(item: TagItem): string {
  if (typeof item === "object" && item !== null) {
    if (item.visit_days && item.visit_days.length) {
      return item.visit_days.join(", ");
    }
    if (item.code) {
      return item.code;
    }
  }
  return "";
}
<\/script>

<style scoped lang="scss">
.tag-content {
  display: flex;
  align-content: center;
  gap: 5px;
  flex-wrap: wrap;
  width: 100%;
}

.tag-item {
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  color: #299b9b;
  border-radius: 8px;
  background: rgba(41, 155, 155, 0.14);
  line-height: 19px;
  white-space: nowrap;
}

@media only screen and (max-width: 576px) {
  .tag-content {
    flex-wrap: nowrap;
  }
}
</style>
`;export{n as default};
