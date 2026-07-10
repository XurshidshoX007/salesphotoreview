const n=`<template>
  <div
    :ref="modalContainer"
    id="modal-container"
    class="modal-container"
    tabindex="0"
    @click="defineOk"
    @keydown.esc="closeModal"
  >
    <div
      :ref="modalBody"
      id="modal-container-body"
      class="modal-container-body"
    >
      <rounded-white-container
        ref="modalRef"
        :style="{
          maxWidth: dataContainerWidth,
          maxHeight: dataContainerHeight,
          backgroundColor: backgroundColor,
        }"
        without-padding
        class="modal-child-content relative"
        id="data-card"
      >
        <div :class="loading && 'opacity-40 relative pointer-events-none'">
          <div class="modal-header">
            <div
              v-if="!withOutHeader"
              class="rounded-t-large flex justify-between items-center bg-lotion p-4 border-b-1"
            >
              <span
                class="text-20px fw-6 truncate"
                :class="!titleColor && 'text-gray-3'"
                :style="titleColor ? { color: titleColor } : {}"
                :title="name"
              >
                {{ name }}
              </span>

              <span class="flex items-center gap-4">
                <slot name="header-button"></slot>
                <div class="close-icon" @click="closeModal">
                  <icon-close-modal />
                </div>
              </span>
            </div>

            <div class="px-2">
              <div v-if="hasHeaderSlot" class="pt-3">
                <slot name="header"></slot>
              </div>
              <div
                class="relative modal-body-content"
                :class="(hasHeaderSlot && 'max-h-76vh') || 'max-h-80vh'"
              >
                <slot></slot>
              </div>
            </div>
          </div>
          <div
            v-if="hasFooterSlot"
            class="w-full sticky bottom-0 bg-lotion border-t-1 rounded-b-large p-4"
          >
            <slot name="footer"></slot>
          </div>
          <div v-show="loading" class="absolute top-[45%] left-[45%]">
            <icon-loading :width="14" :height="14" :loading="loading" />
          </div>
        </div>
      </rounded-white-container>
    </div>
  </div>
  <div id="close"></div>
  <div id="toggle"></div>
</template>

<script setup lang="ts">
import type { ComponentPublicInstance } from "vue";

const slots = useSlots();
const hasFooterSlot = computed(() => !!slots.footer);
const hasHeaderSlot = computed(() => !!slots.header);
const props = defineProps({
  name: String,
  dataContainerWidth: {
    default: "450px",
    required: false,
  },
  dataContainerHeight: {
    type: String,
    required: false,
  },
  backgroundColor: {
    type: String,
    default: "white",
  },
  onlyCloseDialog: Boolean,
  loading: Boolean,
  withOutHeader: {
    default: false,
    type: Boolean,
  },
  titleColor: String,
});

// emits
const emit = defineEmits(["closeDialog"]);

// Refs
const modalRef = ref<ComponentPublicInstance | null>(null);
const modalContainer = ref<HTMLElement | null>(null);
const modalBody = ref<HTMLElement | null>(null);

// Methods
function closeModal() {
  emit("closeDialog");
}

function defineOk(e: Event) {
  if (modalRef.value) {
    if (!modalRef.value.$el.contains(e.target as Node)) {
      const dropdownContent = document.querySelector(".dropdown-content");

      if (dropdownContent && dropdownContent.contains(e.target as Node)) return;

      if (window.getSelection()?.toString()) return;
      if (!props.onlyCloseDialog) {
        closeModal();
      }
    }
  }
}

const handleResize = () => {
  if (modalContainer.value && modalBody.value) {
    const modalWidth = modalContainer.value.offsetWidth - 40; // Subtract padding
    const modalHeight = modalContainer.value.offsetHeight - 40; // Subtract padding

    modalBody.value.style.width = \`\${modalWidth}px\`;
    modalBody.value.style.height = \`\${modalHeight}px\`;
  }
};

onMounted(() => {
  handleResize();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
<\/script>

<style scoped lang="scss">
.modal-container {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  z-index: 100 !important;
  outline: none;

  .modal-container-body {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    padding: 20px;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    z-index: 9999 !important;
    justify-content: center;
    overflow: hidden;

    .modal-child-content {
      background: white;
      width: 100%;

      .modal-header {
        position: relative;
        .modal-body-content {
          overflow-y: auto;
          padding: 16px 8px;
        }
      }
    }
  }
}

.data-container {
  background-color: black;
}

.data-header {
  background-color: #fafdfd;
}

.close-icon {
  padding: 9px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #e1e4e4;
}

.close-icon:hover {
  background: #f5f5f8;
}

.close-icon:active {
  background: #fff;
}

::-webkit-scrollbar {
  width: 7px;
  border-radius: 28px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #e1e4e4;
  border-radius: 28px;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  border-radius: 28px;
  height: 8px;
}

@media only screen and (max-width: 767px) {
  .modal-container {
    .modal-container-body {
      padding: 4px;

      .modal-child-content {
        .modal-header {
          .modal-body-content {
            padding: 8px 4px;
          }
        }
      }
    }
  }
}
</style>
`;export{n as default};
