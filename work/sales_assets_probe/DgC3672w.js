const n=`<template>
  <div v-if="hasAccess2DownloadExcel" class="excel-order" @click="click">
    <button
      class="excel-btn"
      :class="loading && 'pointer-events-none opacity-65'"
      :disabled="loading"
      style="overflow: visible"
      v-tooltip="{
        text:
          tooltip ||
          t('labels.download_the_current_state_of_the_label_on_excel'),
        disabled: loading || disabled,
        placement: 'top',
        maxWidth: '300px',
        nowrap: true,
      }"
    >
      <IconLoading
        v-if="loading"
        :loading="loading"
        color="#299B9B"
        :width="4"
        :height="4"
      />
      <IconExcelSVG v-if="withIcon && !loading" />
      <div class="excel-title">{{ text }}</div>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useExcelFileAccesses } from "~/composables/access/download-excel";

// props
const props = defineProps({
  size: String,
  loading: Boolean,
  text: {
    type: String,
    default: "Excel",
  },
  tooltip: {
    type: String,
  },
  withIcon: {
    type: Boolean,
    default: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

// emits
const emit = defineEmits(["click"]);

// access
const { hasAccess2DownloadExcel } = useExcelFileAccesses();

// states
const { t } = useI18n();

// methods
const click = () => {
  if (props.disabled || props.loading) return;
  emit("click");
};
<\/script>

<style lang="scss" scoped>
.excel-btn {
  user-select: none;
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  line-height: 18px;
  border: 1px solid #e1e4e4;
  padding: 10px;
  cursor: pointer;

  .excel-title {
    font-family: "Inter", sans-serif;
    color: theme("colors.neutral.600");
    font-weight: 500;
    font-size: 14px;
  }
}

.excel-btn:hover {
  border: 1px solid #299b9b;
  background: #299b9b1a;

  .excel-title {
    color: #299b9b;
  }
}

@media only screen and (max-device-width: 767px) {
  .excel-order {
    .excel-title {
      display: none;
    }
  }
}
</style>
`;export{n as default};
