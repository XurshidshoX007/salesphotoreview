const n=`<template>
  <div class="download-dropdown-container">
    <menu-btn-2
      without-padding
      :disabled="disabled"
      @onChangeIsActive="onChangeMenuIsActive"
    >
      <template #btn>
        <div
          class="download-dropdown-btn flex items-center justify-between"
          :class="[btnPaddingByBtnSizeType, gapByBtnSizeType]"
        >
          <div @click.stop="onOpenDialog" class="settings-icon">
            <icon-settings-alt />
          </div>
          <div class="dropdown-content select-none">
            <div class="title">
              {{ data?.name }}
            </div>
            <div class="arrow-icon">
              <icon-arrow-bottom
                :class="
                  isMenuActive
                    ? 'transition-all transform rotate-180'
                    : 'transition-all transform rotate-0'
                "
              />
            </div>
          </div>
        </div>
      </template>
      <template #content>
        <div
          class="download-dropdown-content"
          :class="isLoading && 'pointer-events-none'"
        >
          <div
            v-for="item in data?.data?.items"
            :key="item.id"
            class="section-download"
            @click="setSelectedItem(item.id)"
          >
            <div class="flex items-center gap-x-2">
              <div class="w-4">
                <icon-loading
                  v-if="isItemLoading(item.id)"
                  :loading="isLoading"
                  :width="4"
                  :height="4"
                />
                <icon-download v-else />
              </div>
              <div class="invoice-label">
                {{ item.name }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </menu-btn-2>
  </div>
</template>

<script setup lang="ts">
// props
const props = defineProps({
  data: Object,
  isLoading: Boolean,
  btnSizeType: String,
  disabled: Boolean,
});

// emits
const emit = defineEmits(["onOpenDialog", "setSelectedItem"]);

//states
const isMenuActive = ref(false);
const isActiveId = ref(null);

// hooks
const btnPaddingByBtnSizeType = computed(() => {
  switch (props.btnSizeType) {
    case "small":
      return "p-1";
    case "large":
      return "px-6 py-3";
    case "medium":
      return "sm:px-[12px] py-[4px] sm:py-[5.5px] px-2";
    default:
      return "sm:px-[18px] py-[4.5px] sm:py-[7px] px-2";
  }
});

const gapByBtnSizeType = computed(() => {
  switch (props.btnSizeType) {
    case "small":
      return "gap-0.5";
    case "large":
      return "gap-4";
    case "medium":
      return "gap-2";
    default:
      return "gap-3";
  }
});

// methods
const onChangeMenuIsActive = (value: boolean) => {
  isMenuActive.value = value;
};

const onOpenDialog = () => {
  emit("onOpenDialog", props.data.key);
};

const setSelectedItem = (itemId: string) => {
  isActiveId.value = itemId;
  emit("setSelectedItem", props.data.key, itemId);
};

const isItemLoading = (id: string | number) => {
  return props.isLoading && isActiveId.value === id;
};
<\/script>

<style lang="scss" scoped>
.download-dropdown-container {
  .dropdown {
    width: 100%;

    .download-dropdown-btn {
      width: 100%;
      border: 1px solid #299b9b;
      border-radius: 8px;

      .dropdown-content {
        padding-left: 12px;
        display: flex;
        width: 100%;
        align-items: center;
        justify-content: space-between;
        cursor: pointer;
        border-left: 1px solid #e1e4e4;

        .title {
          color: #000000;
          font-weight: 400;
          font-family: "Inter", sans-serif;
          font-size: 16px;
        }

        .arrow-icon {
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 25px;
          height: 25px;
        }

        .arrow-icon:hover {
          background: #057cd11a;
        }
      }

      .settings-icon {
        border-radius: 50%;
        cursor: pointer;
      }

      .settings-icon:active {
        box-shadow: 0 0 16px 4px #299b9b;
      }
    }
  }
}

.download-dropdown-content {
  width: 100%;

  .section-download {
    padding: 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    justify-content: space-between;
    border-bottom: 1px solid #e1e4e4;

    .invoice-label {
      font-size: 14px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      color: #000000;
    }
  }

  .section-download:hover {
    background: #299b9b0d;

    .invoice-label {
      color: #299b9b;
    }

    svg path {
      fill: #299b9b !important;
    }
  }

  .section-download:last-child {
    border-bottom: none;
  }
}
</style>
`;export{n as default};
