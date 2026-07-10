const n=`<template>
  <div class="refresh-order">
    <button
      type="button"
      v-tooltip="{
        text: title || t('refresh_table'),
        placement: position || 'top',
        nowrap: true,
        disabled: loading,
      }"
      :disabled="disabled || loading"
      class="refresh-btn-content"
      :class="btnClasses"
      @click="click"
    >
      <icon-refresh-s-v-g :class="loading ? 'spin-loading' : ''" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  title?: string;
  position?: string;
  loading: boolean;
  disabled?: boolean;
}>();

// emits
const emit = defineEmits(["click"]);

// states
const { t } = useI18n();

const btnClasses = computed(() => {
  return {
    "refresh-btn-disabled": props.loading || props.disabled,
    "hover:border hover:border-teal-600 active:bg-teal-600/10 icon-active":
      !props.loading && !props.disabled,
  };
});

// methods
const click = () => {
  if (props.loading) return;
  emit("click");
};
<\/script>

<style lang="scss">
.refresh-order {
  .refresh-btn-content {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid #e1e4e4;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .icon-active {
    svg {
      path {
        fill: #299b9b;
      }
    }
  }

  .refresh-btn-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: white;
    border: 1px solid #e1e4e4;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .spin-loading {
    animation: spin 0.6s linear infinite;
    opacity: 0.5;
  }
}
</style>
`;export{n as default};
