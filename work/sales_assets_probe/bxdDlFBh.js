const e=`<template>
  <d-modal :name="t('deleted')" with-out-header @closeDialog="onSelectExit">
    <flex-col class="gap-8">
      <div v-if="isDeletedIcon" class="flex justify-center w-full">
        <div>
          <IconTrash :size="22" class="text-red-600" />
        </div>
      </div>
      <div class="flex flex-col items-center justify-center w-full">
        <div class="text-[18px] text-center font-semibold">
          {{ deleteContentText }}
        </div>
      </div>
      <div v-show="isAgree" class="flex items-center justify-center">
        <Checkbox
          :checked="isConfirmed"
          @change="isConfirmationChecked = $event"
          :title="t('clients.agree')"
        />
      </div>
      <div class="grid grid-cols-2 page-gap">
        <m-btn group="outlined" @click="onSelectExit">
          {{ t("filters.no") }}
        </m-btn>
        <m-btn
          group="delete"
          :loading="isLoading"
          :disabled="!isConfirmed"
          @click="onSelectDelete"
        >
          {{ t("filters.yes") }}
        </m-btn>
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isLoading?: boolean;
  isAgree?: boolean;
  isDeletedIcon?: boolean;
  deleteContentText: string;
}>();

// emits
const emit = defineEmits(["onSelectDelete", "onSelectExit"]);

// states
const { t } = useI18n();
const isConfirmationChecked = ref<boolean>(false);

// hooks
const isConfirmed = computed((): boolean => {
  if (props?.isAgree) {
    return isConfirmationChecked.value;
  }
  return true;
});

// methods

const onSelectDelete = () => {
  emit("onSelectDelete");
};

const onSelectExit = () => {
  emit("onSelectExit");
};
<\/script>
`;export{e as default};
