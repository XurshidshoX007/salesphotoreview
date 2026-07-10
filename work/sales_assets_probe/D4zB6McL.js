const n=`<template>
  <d-modal
    data-container-width="400px"
    @closeDialog="onSelectExit"
    :name="t('deleted')"
  >
    <flex-col class="gap-4 w-full py-4">
      <div class="flex justify-center w-full">
        <div>
          <IconTrash :size="22" class="text-red-600" />
        </div>
      </div>
      <div
        class="flex flex-col page-gap items-center justify-center w-full mt-7"
      >
        <div class="text-[18px] text-center font-semibold">
          {{ contentText || t("clients.want_to_delete") }}
        </div>
        <d-input
          v-show="reasonInput"
          pattern-type="comment"
          class="w-full"
          :label="t('cash.reasons_for_delete')"
          @change="onInputReason"
        />
      </div>
      <div v-show="isAgree" class="flex items-center justify-center">
        <Checkbox
          :checked="isConfirmed"
          :title="t('clients.agree')"
          @change="isConfirmationChecked = $event"
        />
      </div>
    </flex-col>
    <template #footer>
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
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  isLoading?: boolean;
  reasonInput?: boolean;
  isAgree?: boolean;
  contentText?: string;
}>();

// emits
const emit = defineEmits(["onInputReason", "onSelectDelete", "onSelectExit"]);

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
const onInputReason = (value: string) => {
  emit("onInputReason", value);
};

const onSelectDelete = () => {
  emit("onSelectDelete");
};

const onSelectExit = () => {
  emit("onSelectExit");
};
<\/script>
`;export{n as default};
