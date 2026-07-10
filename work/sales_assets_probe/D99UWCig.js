const e=`<template>
  <div v-if="items" :class="[classesByGroup]">
    <label
      v-for="item in items"
      :key="item.id"
      :for="getRadioId(item)"
      class="flex gap-2 cursor-pointer select-none item-label"
      :class="cn(labelClass)"
    >
      <label class="custom-radio">
        <input
          :id="getRadioId(item)"
          type="radio"
          :name="name"
          :disabled="disabled"
          :checked="isItemChecked(item)"
          :value="getValue(item)"
          v-model="selectedItemId"
          @change="emitSelectedItemId"
        />
        <span class="radio-circle"></span>
      </label>
      <span v-if="isItemDate" class="text-gray-3 font-normal text-sm"
        >{{ getFormattedDate(item) }}
      </span>
      <span
        v-else
        class="text-gray-3 font-normal text-sm"
        :class="cn(nameClass)"
      >
        {{ item?.name || item }}
      </span>
    </label>
    <div v-if="label" class="label">
      {{ label }}
    </div>
  </div>
  <div v-else class="flex gap-2">
    <SkeletonRows v-for="i in 2" :key="i" :rows="1" :max-row-width="140" />
  </div>
</template>

<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { getFormattedDate } from "~/utils/formatters";
import { cn } from "~/utils/helpers";

// props
type PropsType = {
  items: BasicEntity<string | number>[];
  selectedItem?: string | number;
  name?: string;
  disabled?: boolean;
  isItemDate?: boolean;
  group?: string;
  borderRadiusStyle?: string;
  label?: string;
  nameClass?: HTMLAttributes["class"];
  labelClass?: HTMLAttributes["class"];
};

const props = defineProps<PropsType>();

// emits
const emit = defineEmits(["onSelectItemId"]);
// states
const selectedItemId = ref(props.selectedItem || null);

// hooks
const classesByGroup = computed(() => {
  const baseClasses = props.borderRadiusStyle || "rounded-[10px]"; // Default custom style
  const groupClasses =
    props.group === "column"
      ? "flex flex-col gap-3 text-xl relative"
      : props.group === "grid"
        ? "grid grid grid-cols-[repeat(auto-fill,_minmax(160px,_1fr))] gap-3 text-xl items-center py-2.25 px-4 relative"
        : "flex gap-4 flex-wrap  items-center  p-2.5 relative w-fit border-grey";
  const disabledClass = props.disabled && "opacity-70";

  return \`\${groupClasses} \${baseClasses} \${disabledClass}\`.trim(); // Combine and clean up extra spaces
});

// methods
const getRadioId = (item: BasicEntity<string | number>) => {
  return \`\${item.id}-\${item?.name ?? item}\`;
};

const emitSelectedItemId = () => {
  emit("onSelectItemId", selectedItemId.value);
};

const getValue = (item) => {
  if (isNaN(item.id) && !item.id) return item;
  return item.id;
};

const isItemChecked = (item) => {
  if (props.isItemDate) {
    return item === props.selectedItem;
  }
  return item.id === props.selectedItem;
};

const onReset = () => {
  selectedItemId.value = props?.items[0]?.id;
  emit("onSelectItemId", selectedItemId.value);
};

const onClear = () => {
  selectedItemId.value = null;
  emit("onSelectItemId", null);
};

const isClearable = () => {
  if (props?.items?.length > 0 && selectedItemId.value !== null) {
    return selectedItemId.value !== props?.items[0]?.id;
  }
};

defineExpose({
  isClearable,
  onReset,
  onClear,
});
<\/script>

<style scoped>
.label {
  position: absolute;
  left: 11px;
  top: -12px;
  padding: 0 5px;
  background: theme("colors.neutral.0");
  font-family: "Inter", sans-serif;
  font-size: 12px;
  color: theme("colors.neutral.600");
  font-weight: 400;
}

.custom-radio {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.custom-radio input[type="radio"] {
  display: none;
}

.radio-circle {
  width: 16px;
  height: 16px;
  border: 2px solid #2c9b9b;
  border-radius: 50%;
  display: inline-block;
  position: relative;
}

.custom-radio input[type="radio"]:checked + .radio-circle::after {
  content: "";
  width: 7px;
  height: 7px;
  background-color: #2c9b9b;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.item-label {
  height: 18px;
}
</style>
`;export{e as default};
