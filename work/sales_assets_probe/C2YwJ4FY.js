const n=`<template>
  <div class="flex items-center justify-center">
    <div class="w-full border-l-8 border-l-red-600 bg-red-200 p-4 rounded-lg">
      <flex-row class="items-center justify-between">
        <div class="text-2xl text-gray-3 font-semibold">{{ title }}</div>
        <refresh-btn
          v-if="refreshable"
          :title="t('refresh')"
          :loading="isRefreshing || false"
          @click="onRefresh"
        />
      </flex-row>
      <p class="font-semibold text-lg">
        {{ text }}
      </p>

      <m-btn
        group="delete"
        class="!bg-red-600 hover:!bg-red-500 active:!bg-red-700 text-white px-6 py-3 flex flex-row-reverse items-center"
        @click="onBtnClick"
        :loading="props.isLoading"
      >
        <span> {{ btnText }} </span>
        <component
          v-if="!props.isLoading"
          :is="iconComponent"
          :size="props.iconSize"
          :color="props.iconColor || '#ffffff'"
        />
      </m-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  title: string;
  text?: string;
  btnText: string;
  btnIcon?: string;
  iconSize?: string | number;
  iconColor?: string;
  refreshable?: boolean;
  isRefreshing?: boolean;
  isLoading?: boolean;
}>();

// emits
const emit = defineEmits(["onBtnClick", "refresh"]);

// states
const { t } = useI18n();

// hooks
const iconComponent = computed(() => {
  if (props.btnIcon === "exit") {
    return defineAsyncComponent(() => import("@/components/icon/LogOut.vue"));
  }
  return null;
});

// methods
const onBtnClick = () => emit("onBtnClick");

const onRefresh = () => emit("refresh");
<\/script>
`;export{n as default};
