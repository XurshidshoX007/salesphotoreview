const n=`<template>
  <div class="flex rounded-lg select-none">
    <button
      class="relative group bg-blue-20 w-10 flex justify-center items-center rounded-l-lg hover:bg-primary-700 transition-colors duration-200"
    >
      <fa-icon hash="&#xf107;" class="text-white font-semibold" />

      <div
        class="invisible absolute top-10 -right-27 z-20 w-60 mt-1 group-hover:visible hover:visible duration-200"
      >
        <ItemList :items="items" @click="handleItemClick" />
      </div>
    </button>

    <m-btn
      style="border-top-left-radius: 0; border-bottom-left-radius: 0"
      @click="onMainButtonClick"
    >
      {{ title }}
    </m-btn>
  </div>
</template>

<script setup lang="ts">
// types
type PopupItem = {
  id: number;
  name: string;
  onClick: () => void;
};

// props
const props = withDefaults(
  defineProps<{
    title: string;
    items?: PopupItem[];
    mainButtonClick?: () => void;
  }>(),
  {
    items: () => [],
    mainButtonClick: () => {},
  },
);

// methods
const onMainButtonClick = () => {
  props.mainButtonClick();
};

const handleItemClick = (id: number) => {
  props.items.find((i) => i.id === id)?.onClick();
};
<\/script>

<style scoped>
.dropdown-item:last-child button {
  border-bottom: none;
}
</style>
`;export{n as default};
