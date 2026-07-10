const n=`<template>
  <div
    class="dropdown"
    id="dropdown"
    ref="ourMenu"
    @keydown.esc="isMenuActive = false"
    v-click-outside="onOutsideClick"
  >
    <div @click="activate" ref="menuBtn" class="z-0">
      <slot name="btn"></slot>
    </div>
    <teleport :to="teleportTarget">
      <div
        v-show="isMenuActive"
        ref="DropdownContent"
        class="dropdown-content"
        :class="[
          menuPosition === 'left' ? 'left-0' : 'right-0',
          !isSizeFree ? 'full-width' : '',
          !withoutPadding && 'p-4',
        ]"
        @click.stop
      >
        <slot name="content"></slot>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { variableData } from "~/variable/variable";

// props
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  menuTopPositionOff: Boolean,
  sizeFree: Boolean,
  withoutPadding: Boolean,
  positionY: String,
  positionX: {
    type: String,
    default: "left",
  },
});

const emit = defineEmits(["onChangeIsActive"]);

// states
const { isActive } = variableData;

const DropdownContent = ref(null);
const ourMenu = ref(null);
const menuBtn = ref(null);
const teleportTarget = ref("body");
let menuPosition = ref("right");
let isMenuActive = ref(false);
let resizeObserver = null; // ResizeObserver to detect height changes
const visible = ref(false);

// hooks
const isSizeFree = computed(() => {
  return props.sizeFree;
});

watch(isMenuActive, () => {
  emit("onChangeIsActive", isMenuActive.value);
  if (isMenuActive.value) {
    window.addEventListener("scroll", updateDropdownPosition, true);
  } else {
    window.removeEventListener("scroll", updateDropdownPosition, true);
  }
});

watch(isActive, () => {
  if (!isActive.value) {
    isMenuActive.value = false;
  }
});

onMounted(() => {
  defineTeleportTarget();
  window.addEventListener("resize", updateDropdownPosition);

  // Observe DropdownContent size changes using ResizeObserver
  if (DropdownContent.value) {
    resizeObserver = new ResizeObserver(() => {
      updateDropdownPosition(); // Recalculate the position when size changes
    });
    resizeObserver.observe(DropdownContent.value);
  }

  updateDropdownPosition();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", updateDropdownPosition);
  window.removeEventListener("scroll", updateDropdownPosition, true);

  // Disconnect ResizeObserver when component unmounts
  if (resizeObserver && DropdownContent.value) {
    resizeObserver.unobserve(DropdownContent.value);
    resizeObserver.disconnect();
  }
});

// methods
const visibilityChanged = (isVisible, entry) => {
  visible.value = isVisible;
};

const activate = () => {
  if (props.disabled) return;
  isActive.value = true;
  isMenuActive.value = !isMenuActive.value;
  if (window.innerWidth / 2 > ourMenu.value?.offsetLeft) {
    menuPosition.value = props.positionX;
  } else {
    menuPosition.value = props.positionX === "left" ? "right" : "left";
  }
  updateDropdownPosition();
};

const onOutsideClick = (event) => {
  if (
    ourMenu.value &&
    DropdownContent.value &&
    !ourMenu.value.contains(event.target) &&
    !DropdownContent.value.contains(event.target)
  ) {
    isMenuActive.value = false;
  }
};

const updateDropdownPosition = () => {
  nextTick(() => {
    if (!ourMenu.value || !DropdownContent.value) return;

    const rect = ourMenu.value.getBoundingClientRect();
    const dropdownRect = DropdownContent.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const isButtonVisible = rect.bottom > 0 && rect.top < viewportHeight;
    if (!isButtonVisible) {
      isMenuActive.value = false;
      return;
    }

    let topPosition = rect.bottom + window.scrollY;
    if (topPosition + dropdownRect.height > viewportHeight + window.scrollY) {
      topPosition = rect.top - dropdownRect.height + window.scrollY;
    }

    const isInModal = ourMenu.value.closest(".modal-child-content");
    if (isInModal) {
      const modalRect = isInModal.getBoundingClientRect();
      const scrollOffsetTop = isInModal.scrollTop;

      topPosition = rect.bottom - modalRect.top + scrollOffsetTop;

      DropdownContent.value.style.top = \`\${topPosition}px\`;
      DropdownContent.value.style.left =
        menuPosition.value === "left"
          ? \`\${rect.left - modalRect.left}px\`
          : "auto";
      DropdownContent.value.style.right =
        menuPosition.value === "right"
          ? \`\${modalRect.right - rect.right}px\`
          : "auto";
    } else {
      if (topPosition + dropdownRect.height > viewportHeight + window.scrollY) {
        topPosition = rect.top - dropdownRect.height + window.scrollY;
      }

      if (props.positionY === "top") {
        DropdownContent.value.style.top = "auto";
        DropdownContent.value.style.bottom = \`\${
          window.innerHeight - rect.top
        }px\`;
      } else {
        DropdownContent.value.style.bottom = "auto";
        DropdownContent.value.style.top = \`\${topPosition}px\`;
      }

      DropdownContent.value.style.left =
        menuPosition.value === "left"
          ? \`\${rect.left + window.scrollX}px\`
          : "auto";
      DropdownContent.value.style.right =
        menuPosition.value === "right"
          ? \`\${viewportWidth - rect.right - window.scrollX}px\`
          : "auto";
    }

    DropdownContent.value.style.width = isSizeFree.value
      ? "auto"
      : \`\${rect.width}px\`;
  });
};

const defineTeleportTarget = () => {
  const isInModal = ourMenu.value?.closest("#modal-container");
  if (isInModal) {
    teleportTarget.value = ".modal-child-content";
    const modalContainer = ourMenu.value?.closest("#modal-container-body");
    if (modalContainer) {
      modalContainer.addEventListener("scroll", updateDropdownPosition, true);
    }
  } else {
    teleportTarget.value = "body";
  }
  updateDropdownPosition();
};
<\/script>

<style scoped>
.dropdown {
  display: inline-block;
  position: relative;
}

.dropdown.disabled {
  cursor: not-allowed;
}

.dropdown-content {
  position: absolute;
  overflow: auto;
  background: #fafdfd;
  box-shadow: rgba(0, 0, 0, 0.19) 0px 4px 12px;
  border-radius: 10px;
  z-index: 89;
  transform: translateY(5px);
}

.full-width {
  width: 100%;
}
</style>
`;export{n as default};
