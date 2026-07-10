const n=`<template>
  <div class="w-full relative z-50">
    <div v-if="isStatusCode" class="flex justify-center">
      <h2 class="text-red font-bold text-2xl mt-2">{{ t("error") }}</h2>
      <h2 class="text-red font-bold text-2xl mt-2">
        {{ props.message }}
      </h2>
    </div>
    <div v-else>
      <div class="text-2xl flex justify-center">
        <span>
          {{ data?.name }}
        </span>
      </div>
      <div class="flex justify-center overflow-hidden">
        <span v-if="data?.messages[0]" class="w-full text-sm">
          {{ data.messages[0] }}
        </span>
        <span
          v-if="message"
          style="white-space: pre-wrap"
          class="w-full text-sm"
        >
          {{ message }}
        </span>
      </div>
    </div>
    <div id="error-banner" class="mt-4"></div>
  </div>
</template>

<script setup lang="ts">
// props
import { useI18n } from "vue-i18n";

const props = defineProps<{
  data?: object;
  message?: string | number;
}>();

// hooks
const isStatusCode = computed(() => typeof props.message === "number");
// State
const { t } = useI18n();
<\/script>
`;export{n as default};
