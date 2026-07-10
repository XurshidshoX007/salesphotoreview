const n=`<template>
  <d-modal only-close-dialog :name="name" @closeDialog="closeDialog">
    <flex-col class="gap-5">
      <flex-col v-if="isOrder || isExchange" class="gap-1">
        <d-input
          :label="t('orders.comment_for_order')"
          pattern-type="comment"
          :value="commentsData.orderComment"
          @change="commentsData.orderComment = $event"
        />
      </flex-col>
      <flex-col v-if="isRefund || isExchange" class="gap-1">
        <d-input
          :label="t('orders.comment_for_return')"
          pattern-type="comment"
          :value="commentsData.refundComment"
          @change="commentsData.refundComment = $event"
        />
      </flex-col>
    </flex-col>
    <template #footer>
      <m-btn :loading="isSaveBtnLoading" class="w-full" @click="onSave">
        {{ t("save") }}
      </m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
// props
import { useI18n } from "vue-i18n";

const props = defineProps<{
  name: string;
  detail: {
    id: string;
    typeId: number;
    initialComment: string;
  };
  isSaveBtnLoading?: boolean;
}>();

// emits
const emit = defineEmits(["onSave", "closeDialog"]);

// state
const commentsData = ref<
  Record<"orderComment" | "refundComment", string | null>
>({
  orderComment: null,
  refundComment: null,
});
const { t } = useI18n();
// hooks
const isOrder = computed(() => props.detail.typeId === 1);
const isRefund = computed(() => props.detail.typeId === 2);
const isExchange = computed(() => props.detail.typeId === 3);

watchEffect(() => {
  if (props.detail.initialComment) {
    if (props.detail.initialComment.includes(";")) {
      const commentParts = props.detail.initialComment.split(";");
      commentsData.value.orderComment = commentParts[0].trim();
      commentsData.value.refundComment = commentParts[1].trim();
    } else {
      commentsData.value.orderComment = props.detail.initialComment.trim();
      commentsData.value.refundComment = props.detail.initialComment.trim();
    }
  }
});

// methods
const onSave = () => emit("onSave", commentsData.value, props.detail.id);

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
