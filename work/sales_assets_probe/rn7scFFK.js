const n=`<template>
  <div class="dropdown relative" :class="{ 'is-open': isMenuActive }">
    <!-- Dropdown Button -->
    <div
      ref="ourMenu"
      id="dropdown"
      @click="toggleDropdown"
      @keydown.esc="isMenuActive = false"
      class="dropdown-button"
      tabindex="0"
      :class="{ disabled: props.disabled }"
    >
      <slot name="btn"></slot>
    </div>

    <div
      v-show="isMenuActive"
      ref="DropdownContent"
      class="dropdown-content"
      :style="{ zIndex: props.contentZIndex || 45 }"
      :class="[
        placementContent === 'top-start'
          ? 'dropdown-content-bottom'
          : 'dropdown-content-top',
      ]"
      @click.stop
    >
      <slot name="content"></slot>
    </div>
    <div v-if="props.arrow && isMenuActive" ref="arrowEl" id="arrow"></div>
  </div>
</template>

<script setup lang="ts">
import { limitShift } from "@floating-ui/core";
import {
  computePosition,
  autoUpdate,
  flip,
  shift,
  size,
  arrow,
} from "@floating-ui/dom";
import { debounce, throttle } from "~/utils/helpers";
import { variableData } from "~/variable/variable";

// props
const props = defineProps<{
  disabled?: boolean;
  sizeFree?: boolean;
  arrow?: boolean;
  withoutPadding?: boolean;
  contentZIndex?: number;
}>();

// emits
const emit = defineEmits(["onChangeIsActive", "update:modelValue"]);

// states
const { isActive } = variableData;
const isMenuActive = ref<boolean>(false);
const shouldWatchScroll = ref<boolean>(false);
const isFixed = ref<boolean>(false);
const buttonRect = ref<DOMRect | null>(null);
const placementContent = ref<string>("bottom-start");

const ourMenu = ref<HTMLElement>();
const DropdownContent = ref<HTMLElement>();
const arrowEl = ref<HTMLElement>();

const scrollContainer = ref<HTMLElement | null>(null);

let lastScrollY = window.scrollY;
const scrollInterval = ref<number | null>(null);

// hooks

const isSizeFree = computed(() => props.sizeFree);

const clickOutsideListenerOptions: AddEventListenerOptions = {
  capture: true,
};

watch(isMenuActive, (visible) => {
  if (visible) {
    // hasBeenOpened.value = true;
    document.addEventListener(
      "pointerdown",
      handleClickOutside,
      clickOutsideListenerOptions
    );
    scrollContainer.value = findScrollContainer(ourMenu.value!);

    window.addEventListener("resize", throttledUpdateDropdownPosition);

    startPositionTracking();
  } else {
    isFixed.value = false;
    document.removeEventListener(
      "pointerdown",
      handleClickOutside,
      clickOutsideListenerOptions
    );
    window.removeEventListener("resize", throttledUpdateDropdownPosition);
    removeScrollListeners();
    stopPositionTracking();
  }
  emit("onChangeIsActive", isMenuActive.value);
});

watch(shouldWatchScroll, () => {
  if (isMenuActive.value) {
    if (shouldWatchScroll.value) {
      startPositionTracking();
    } else {
      stopPositionTracking();
    }
    updateScrollListeners();
  }
});

watch(isActive, () => {
  if (!isActive.value) {
    isMenuActive.value = false;
  }
});

onBeforeUnmount(() => {
  document.removeEventListener(
    "pointerdown",
    handleClickOutside,
    clickOutsideListenerOptions
  );
  window.removeEventListener("resize", throttledUpdateDropdownPosition);
  removeScrollListeners();
  stopPositionTracking();
});

const startPositionTracking = () => {
  if (scrollInterval.value) return;

  if (ourMenu.value) {
    buttonRect.value = ourMenu.value.getBoundingClientRect();
  }

  lastScrollY = window.scrollY;

  scrollInterval.value = window.setInterval(() => {
    if (!isMenuActive.value || !isFixed.value) {
      stopPositionTracking();
      return;
    }

    if (window.scrollY !== lastScrollY) {
      lastScrollY = window.scrollY;
      updateFixedPosition();
    }

    if (ourMenu.value) {
      const currentRect = ourMenu.value.getBoundingClientRect();
      if (
        buttonRect.value &&
        (currentRect.top !== buttonRect.value.top ||
          currentRect.left !== buttonRect.value.left)
      ) {
        buttonRect.value = currentRect;
        updateFixedPosition();
      }
    }
  }, 5);
};

const stopPositionTracking = () => {
  if (scrollInterval.value) {
    window.clearInterval(scrollInterval.value);
    scrollInterval.value = null;
  }
};

const updateFixedPosition = () => {
  if (!isFixed.value || !ourMenu.value || !DropdownContent.value) return;

  const menu = ourMenu.value;
  const dropdown = DropdownContent.value;
  const rect = menu.getBoundingClientRect();

  dropdown.style.top = \`\${rect.bottom}px\`;
  dropdown.style.left = \`\${rect.left}px\`;
  dropdown.style.visibility = isButtonHorizontallyHidden()
    ? "hidden"
    : "visible";
};

const updateScrollListeners = () => {
  removeScrollListeners(); // Clean up first

  if (shouldWatchScroll.value && scrollContainer.value) {
    scrollContainer.value.addEventListener(
      "scroll",
      debouncedUpdateDropdownPosition
    );
  }
};

const removeScrollListeners = () => {
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener(
      "scroll",
      debouncedUpdateDropdownPosition
    );
  }
};

const findScrollContainer = (
  element: HTMLElement | null
): HTMLElement | null => {
  if (
    ourMenu.value?.closest(
      ".overflow-auto, .overflow-scroll, .overflow-y-auto, .overflow-y-scroll .overflow-x-auto, .overflow-x-scroll"
    )
  ) {
    return (
      ourMenu.value?.closest(".table-content-body") ||
      (ourMenu.value?.closest(".table-component") as HTMLElement)
    );
  }
  while (element) {
    if (
      element.scrollHeight > element.clientHeight &&
      getComputedStyle(element).overflowY !== "visible"
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
};

const isButtonHorizontallyHidden = () => {
  const menu = ourMenu.value;
  if (!menu) return false;
  const rect = menu.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  return rect.right - 110 < 0 || rect.left + 110 > windowWidth;
};
const isOpenedToTop = ref(false);

const updateDropdownPosition = () => {
  requestAnimationFrame(() => {
    const menu = ourMenu.value;
    const dropdown = DropdownContent.value;
    const arrowElement = arrowEl.value as HTMLElement;
    let cleanupAutoUpdate: (() => void) | null = null;

    if (!menu || !dropdown) return;

    dropdown.style.left = "";
    dropdown.style.maxHeight = "none";
    dropdown.style.position = "absolute";

    isFixed.value = false;

    cleanupAutoUpdate = autoUpdate(menu, dropdown, () => {
      computePosition(menu, dropdown, {
        placement: "bottom-start",
        strategy: "absolute",
        middleware: [
          shift({
            padding: 8,
            limiter: limitShift({ offset: 10 }),
            boundary: scrollContainer.value || "clippingAncestors",
          }),
          flip((state) => {
            return {
              fallbackPlacements: ["bottom-end", "top-start", "top-end"],
              padding: 8,
              crossAxis: true,
              boundary: scrollContainer.value || "clippingAncestors",
            };
          }),
          size({
            apply({ availableWidth, availableHeight, elements }) {
              const dropdownEl = elements.floating;
              const contentHeight = dropdownEl.scrollHeight;
              const contentWidth = dropdownEl.scrollWidth;

              const shouldUseFixed =
                isFixed.value ||
                contentHeight > availableHeight ||
                contentWidth > availableWidth;

              shouldWatchScroll.value = shouldUseFixed;
              isFixed.value = shouldUseFixed;

              if (shouldUseFixed) {
                dropdownEl.style.position = "fixed";
                dropdownEl.style.maxWidth = \`\${availableWidth}px\`;
                dropdownEl.style.maxHeight = "none";

                if (menu) {
                  buttonRect.value = menu.getBoundingClientRect();
                }

                const rect = buttonRect.value || menu.getBoundingClientRect();
                dropdown.style.top = \`\${rect.bottom}px\`;
                dropdown.style.left = \`\${rect.left}px\`;
                dropdown.style.width = isSizeFree.value
                  ? "auto"
                  : \`\${menu.offsetWidth}px\`;
                dropdown.style.visibility = isButtonHorizontallyHidden()
                  ? "hidden"
                  : "visible";

                startPositionTracking();

                // **STOP autoUpdate to prevent infinite loop**
                if (cleanupAutoUpdate) cleanupAutoUpdate();
              }
            },
          }),
          ...(props.arrow ? [arrow({ element: arrowElement })] : []),
        ],
      }).then(({ y, placement, middlewareData }) => {
        if (dropdown.style.position === "absolute") {
          Object.assign(dropdown.style, {
            top: \`\${y}px\`,
            width: isSizeFree.value ? "auto" : "100%",
          });
        }

        if (props.arrow && middlewareData.arrow) {
          Object.assign(arrowElement.style, {
            display: dropdown.style.position === "fixed" ? "none" : "block",
            left: "38px",
            position: "absolute",
            zIndex: "1",
            visibility: "visible",
            ...(placement.includes("top")
              ? {
                  top: "-8px",
                  bottom: "auto",
                  transform: "rotate(45deg)",
                }
              : {
                  bottom: "-8px",
                  top: "auto",
                  transform: "rotate(225deg)",
                }),
          });
        }
        const dropdownRect = dropdown.getBoundingClientRect();
        const buttonRectLocal = menu.getBoundingClientRect();
        isOpenedToTop.value = dropdownRect.top < buttonRectLocal.top;

        placementContent.value = isOpenedToTop.value
          ? "top-start"
          : "bottom-start";
      });
    });
  });
};

const debouncedUpdateDropdownPosition = debounce(updateDropdownPosition, 5);
const throttledUpdateDropdownPosition = throttle(updateDropdownPosition, 5);

const toggleDropdown = () => {
  if (props.disabled) return;
  isMenuActive.value = !isMenuActive.value;
  isActive.value = isMenuActive.value;
  if (isMenuActive.value) {
    nextTick(() => {
      updateDropdownPosition(); // Wait for DOM update
    });
  }
};

const handleClickOutside = (event: PointerEvent) => {
  if (
    ourMenu.value &&
    DropdownContent.value &&
    !ourMenu.value.contains(event.target as Node) &&
    !DropdownContent.value.contains(event.target as Node)
  ) {
    isMenuActive.value = false;
  }
};

watch(placementContent, (newPlacement) => {
  emit("update:modelValue", newPlacement);
});
<\/script>

<style scoped>
.dropdown {
  position: relative;
  display: inline-block;
  width: 100%;
}
.dropdown-button {
  box-sizing: border-box;
}

.dropdown-button.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.dropdown-content-top {
  box-sizing: border-box;
  background: theme("colors.neutral.0");
  border: 1px solid #e1e4e4;
  border-top: none;
  border-radius: 0px 0px 8px 8px;
  box-shadow: 0px 16px 32px theme("colors.neutral.alpha.10");
}

.dropdown-content-bottom {
  box-sizing: border-box;
  background: theme("colors.neutral.0");
  border: 1px solid #e1e4e4;
  border-bottom: none;
  border-radius: 8px 8px 0px 0px;
  box-shadow: 16px -12px 32px theme("colors.neutral.alpha.10");
}

#arrow {
  position: fixed;
  width: 12px;
  height: 12px;
  background: #fafdfd;
  transform: rotate(45deg);
  visibility: hidden;
  top: -6px;
  left: 50%;
  margin-left: -6px;
}
</style>
`;export{n as default};
