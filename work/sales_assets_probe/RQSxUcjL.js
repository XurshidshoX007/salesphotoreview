const n=`<template>
  <div class="flex items-center">
    <rounded-icon-btn
      type="edit"
      without-border
      :icon-size="20"
      :tooltip="t('edit')"
      @click="openDialog"
    />
    <div
      class="ml-2 text-sm border rounded-lg px-2.5 py-[3px] max-w-[150px] min-w-0 overflow-hidden"
      :title="comment"
    >
      <span class="truncate block w-full">{{ comment || "-" }}</span>
    </div>

    <transition name="modal">
      <div v-if="isDialogOpen">
        <orders-orders-comment-dialog
          :name="t('column.comment')"
          :detail="dialogDetail"
          :is-save-btn-loading="isSaving"
          @on-save="onSave"
          @close-dialog="closeDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Props
const { orderId, typeId, comment, requestComment, refundComment } =
  defineProps<{
    orderId: string;
    typeId: number;
    comment?: string;
    requestComment?: string;
    refundComment?: string;
  }>();

// Emits
const emit = defineEmits<{
  (
    e: "save",
    data: { orderComment: string | null; refundComment: string | null },
  ): void;
}>();

// Composables
const { t } = useI18n();

// State
const isDialogOpen = ref(false);
const isSaving = ref(false);

// Computed
const dialogDetail = computed(() => {
  let initialComment = "";

  if (typeId === 3) {
    initialComment = [requestComment, refundComment].filter(Boolean).join("; ");
  } else if (typeId === 2) {
    initialComment = refundComment || "";
  } else {
    initialComment = requestComment || "";
  }

  return {
    id: orderId,
    typeId,
    initialComment,
  };
});

// Methods
const openDialog = () => {
  isDialogOpen.value = true;
};

const closeDialog = () => {
  isDialogOpen.value = false;
};

const onSave = async (
  commentsData: { orderComment: string | null; refundComment: string | null },
  _orderId: string,
) => {
  isSaving.value = true;
  try {
    emit("save", commentsData);
    closeDialog();
  } finally {
    isSaving.value = false;
  }
};
<\/script>
`;export{n as default};
