const n=`<template>
  <div
    v-if="responseResults"
    class="top-[23%] flex items-center justify-center gap-3 absolute top-0 bg-white"
    :class="{
      'left-1/2': isResponseLoading || isResponseOk,
      'left-1/4': isResponseError,
    }"
  >
    <div v-show="errorMessage" class="text-sm">
      {{ errorMessage }}
    </div>
    <div v-if="isResponseLoading">
      <IconLoading loading :height="17" :width="10" />
    </div>
    <rounded-icon-btn
      v-if="isResponseOk"
      icon="check"
      non-clickable
      without-tooltip
    />
    <div v-else-if="isResponseError" class="flex gap-3">
      <IconX color="#ED4337" size="42" />
      <rounded-icon-btn
        :tooltip="t('orders.try_again')"
        icon="refresh"
        type="outlined"
        @click="onTryAgain"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { TableResponseResultModel } from "~/interfaces/ui/table-response-result-model";

// props
const props = defineProps<{
  responseResults: TableResponseResultModel;
  id: string;
}>();

// emits
const emit = defineEmits(["onTryAgain"]);

// states
const { t } = useI18n();

// methods
const onTryAgain = () => {
  emit("onTryAgain", props.id);
};

const isResponseLoading = computed(() => {
  return (
    Object.keys(props.responseResults).includes(props.id) &&
    props.responseResults[props.id] === undefined
  );
});

const isResponseOk = computed(
  () => props.responseResults[props.id]?.status === "OK",
);

const isResponseError = computed(
  () =>
    props.responseResults[props.id] &&
    props.responseResults[props.id]?.status !== "OK",
);

const errorMessage = computed(() => props.responseResults[props.id]?.message);
<\/script>
`;export{n as default};
