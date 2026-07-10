const n=`<template>
  <div>
    <form @submit.prevent="onSave">
      <d-modal
        only-close-dialog
        :name="t('orders.confirm')"
        @closeDialog="closeDialog"
      >
        <flex-col class="gap-7">
          <d-input
            :title="t('column.comment')"
            :value="data.comment"
            pattern-type="comment"
            @change="data.comment = $event"
          />
        </flex-col>
        <template #footer>
          <m-btn type="submit" class="w-100" :loading="isSaveLoading">
            {{ t("save") }}
          </m-btn>
        </template>
      </d-modal>
    </form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// emits
const emit = defineEmits(["closeDialog", "onSave"]);

// props
const props = defineProps<{
  isSaveLoading: String;
}>();
//state

const { t } = useI18n();
const data = ref({
  comment: null as string | null,
});

// methods

const onSave = async () => {
  emit("onSave", data.value.comment);
  closeDialog();
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
