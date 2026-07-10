const n=`<template>
  <div class="relative">
    <input
      class="my-input-no-border fa-solid pr-6"
      type="text"
      :disabled="disabled"
      v-model="inputVal"
      placeholder="Поиск"
    />
    <div class="absolute top-2.5 left-2 pointer-events-none">
      <icon-search />
    </div>
    <div v-show="inputVal" class="clear-icon" @click="onClear">
      <icon-clear-icon :hash="'&#xf00d;'" class="text-gray-4" />
    </div>
  </div>
</template>

<script setup lang="ts">
//props

const props = defineProps({
  value: String,
  disabled: Boolean,
});

//emit

const emit = defineEmits(["updated"]);

// hook
const inputVal = computed({
  get(): string {
    return props.value;
  },
  set(val): void {
    emit("updated", val);
  },
});

//method

const onClear = () => {
  inputVal.value = null;
  emit("update:modelValue", null);
};
<\/script>

<style scoped>
.my-input-no-border {
  transition: border 200ms ease-out;
  height: 38px;
  font-size: 14px;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  width: 100%;
  border-radius: 8px;
  padding: 0 34px;
  outline: none;
  color: #424f4f;
}

.my-input-no-border::placeholder {
  color: theme("colors.neutral.400");
}

.clear-icon {
  cursor: pointer;
  position: absolute;
  right: 6px;
  z-index: 8;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  padding: 4px;
}
.clear-icon:hover {
  background: #057cd11a;
}
</style>
`;export{n as default};
