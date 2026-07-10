const n=`<template>
  <div
    :class="
      cn(
        'h-full gap-5',
        isMobile
          ? 'relative'
          : 'grid grid-rows-[minmax(0,1fr)] grid-cols-[314px,1fr]',
      )
    "
  >
    <div
      :class="
        cn(
          isMobile && [
            'fixed top-[60px] z-20 w-[314px] bg-neutral-0',
            'transition-[left] duration-300 ease-in-out',
            'h-[calc(100vh-60px)]',
            'border-r border-neutral-200 rounded-br-xl shadow-lg',
            isDrawerOpen ? 'left-0' : '-left-[314px]',
          ],
        )
      "
    >
      <slot name="sidebar" />
    </div>

    <button
      v-if="isMobile"
      :class="
        cn(
          'fixed top-[101px] z-20 w-8 h-11 flex items-center justify-center cursor-pointer border-t border-b border-r border-neutral-200 rounded-r-lg bg-white shadow-sm transition-[left] duration-300 ease-in-out',
          isDrawerOpen ? 'left-[314px]' : 'left-0',
        )
      "
      @click="toggleDrawer"
    >
      <icon-right-pagination
        :size="30"
        :style="isDrawerOpen && 'transform: rotate(90deg)'"
      />
    </button>

    <div class="flex flex-col gap-5 min-w-0">
      <slot name="content" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { cn } from "~/utils/helpers";

const { isMobile, isDrawerOpen, toggleDrawer, closeDrawer } = useDrawerMenu();

defineExpose({ closeDrawer, isMobile });
<\/script>
`;export{n as default};
