const n=`<template>
  <div class="page-size-btn-content">
    <menu-btn2 size-free withoutPadding @onChangeIsActive="toggleOpen = $event">
      <template #btn>
        <div
          v-tooltip="{
            text: t('show_page'),
            placement: 'top',
            nowrap: true,
          }"
          class="page-size-btn"
          :class="toggleOpen && 'active-page-size-btn'"
        >
          {{ currentSize }}
          <icon-page-size-icon
            :color="isIconColorByAction"
            :class="[
              (toggleOpen && 'rotate-180 transition-all') ||
                'rotate-0 transition-all',
            ]"
          />
        </div>
      </template>
      <template #content>
        <div class="page-size-btn-content">
          <div
            v-for="size in availableSizes"
            :key="size"
            :class="currentSize === size ? 'size-item-active' : 'size-item'"
            @click="setPageSize(size)"
          >
            {{ getFormattedAmount(size) }}
            <icon-check v-show="currentSize === size" color="#299B9B" />
          </div>
        </div>
      </template>
    </menu-btn2>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { variableData } from "~/variable/variable";
import { getFormattedAmount } from "~/utils/filter";
//emit
const emit = defineEmits(["setPageSize"]);

//props

const props = defineProps({
  currentSize: Number,
  totalCount: Number,
  pageNumber: Number,
  customOption: Array<number>,
});

// State
let toggleOpen = ref(false);
const { t } = useI18n();
const { isActive } = variableData;

// Methods

function setPageSize(size: number) {
  emit("setPageSize", size);
  isActive.value = false;
}

// hooks
const availableSizes = computed(() => {
  let defaultSizes = [10, 20, 50, 100, 500, 1000];
  if (props.customOption) {
    defaultSizes = [...defaultSizes, ...props.customOption];
  }
  return defaultSizes;
});

const isIconColorByAction = computed(() => {
  if (toggleOpen.value) return "#299B9B";
  return "#0E121B";
});

onMounted(() => {
  window.addEventListener("resize", () => {
    if (toggleOpen.value) {
      toggleOpen.value = false;
    }
  });
});
<\/script>

<style scoped lang="scss">
.page-size-btn-content {
  .page-size-btn {
    font-family: "Inter", sans-serif;
    color: theme("colors.neutral.600");
    font-weight: 400;
    font-size: 14px;
    cursor: pointer;
    gap: 8px;
    padding: 10px;
    line-height: 18px;
    border-radius: 10px;
    border: 1px solid #e1e4e4;
    display: flex;
    height: 40px;
    align-items: center;
    user-select: none;
  }

  .page-size-btn:hover {
    border: 1px solid #299b9b;
  }

  .active-page-size-btn {
    border: 1px solid #299b9b;
    color: #299b9b;
    background: #299b9b1a;
  }

  .page-size-btn-content {
    overflow: hidden;
    border-radius: 8px;
    min-width: 90px;
    border: 1px solid #e1e4e4;
    cursor: pointer;

    .size-item,
    .size-item-active {
      color: theme("colors.neutral.950");
      font-size: 14px;
      font-weight: 400;
      font-family: "Inter", sans-serif;
      border-bottom: 1px solid #e1e4e4;
      padding: 8px 8px 8px 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 41px;
      gap: 8px;
    }

    .size-item:hover {
      background: theme("colors.neutral.50");
    }

    .size-item-active {
      background: #eaf6f6;
    }

    .size-item:last-child {
      border-bottom: none;
    }
  }
}
</style>
`;export{n as default};
