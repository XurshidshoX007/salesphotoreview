const n=`<template>
  <div class="photo-content">
    <div class="full-screen-photo-content">
      <div
        class="carousel-container"
        @mousedown="handleOutsideMouseDown"
        @mouseup="handleOutsideClick"
      >
        <div @click.stop="closeFullScreenImage" class="close-icon">
          <x-btn color="#ffffff" />
        </div>
        <div class="carousel-content" @click="handleClickByCarousel">
          <Carousel
            ref="fullScreenCarouselRef"
            v-model="currentCarousel"
            v-bind="settings"
            :breakpoints="breakpoints"
            @update:modelValue="(val: number) => (currentCarousel = val)"
          >
            <Slide v-for="slide in imageData" :key="slide">
              <div class="carousel__item">
                <img
                  :src="
                    slide?.path ||
                    slide?.url ||
                    slide?.file?.path ||
                    slide?.image
                  "
                  :alt="slide?.alt || ''"
                  class="carousel-image"
                />
                <div
                  v-if="hasSliderInfoSlot"
                  class="carousel-information-section"
                >
                  <div class="info-section" :class="{ visible: show }">
                    <div v-if="hasInfoClientNameSlot" class="information-item">
                      <div class="key">{{ t("column.client") }}:</div>
                      <div class="value">
                        <slot name="info-client" :item="slide"></slot>
                      </div>
                    </div>
                    <div v-if="hasInfoAuditNameSlot" class="information-item">
                      <div class="key">{{ t("audit.audit") }}:</div>
                      <div class="value">
                        <slot name="info-audit"></slot>
                      </div>
                    </div>
                    <div v-if="hasInfoNameSlot" class="information-item">
                      <div class="key">{{ t("users.agents.agent") }}:</div>
                      <div class="value">
                        <slot name="info-name" :item="slide"></slot>
                      </div>
                    </div>
                    <div v-if="hasInfoDateSlot" class="information-item">
                      <div class="key">{{ t("labels.time_picture") }}:</div>
                      <div class="value">
                        <slot name="info-date" :item="slide"></slot>
                      </div>
                    </div>
                    <div v-if="hasInfoCategorySlot" class="information-item">
                      <div class="key">{{ t("column.category") }}:</div>
                      <div class="value">
                        <slot name="info-category" :item="slide"></slot>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Slide>

            <template #addons>
              <Navigation />
            </template>
          </Carousel>
        </div>
        <div class="carousel-content-footer">
          <Carousel
            id="thumbnails"
            v-bind="thumbnailsConfig"
            v-model="currentCarousel"
            @slide-start="onSlideStart"
            @slide-end="onSlideEnd"
          >
            <Slide v-for="(image, index) in imageData" :key="image?.path">
              <template #default="{ currentIndex, isActive }">
                <div
                  class="thumbnail"
                  :class="{ 'is-active': currentIndex === currentCarousel }"
                  @click="slideTo(currentIndex)"
                >
                  <img
                    :src="
                      image?.path ||
                      image?.url ||
                      image?.file?.path ||
                      image?.image
                    "
                    alt="Image"
                    class="thumbnail-image"
                  />
                </div>
              </template>
            </Slide>
          </Carousel>
          <div
            class="active-circle"
            :style="{ transform: \`translateX(\${isActiveCardLeftWidth}px)\` }"
          />
        </div>
        <div
          v-if="hasSliderInfoSlot"
          v-tooltip="{
            text: show
              ? t('labels.hide_information')
              : t('labels.show_information'),
            placement: 'top',
          }"
          class="show-hide-info-btn"
          @click="toggleShowHideInfo"
        >
          <icon-full-screen-image-info-line v-if="show" />
          <icon-full-screen-image-close-information-line v-else />
        </div>
        <div
          class="carousel-size-content"
          :class="{ 'carousel-size-content-btn': !isOptsOpen }"
        >
          <div class="toolbar-container" :class="{ open: isOptsOpen }">
            <div class="toolbar-items-wrapper" :class="{ open: isOptsOpen }">
              <div class="toolbar-items" ref="toolbar">
                <div class="active-indicator" :style="indicatorPositionStyle">
                  <button>
                    <component :is="activeOptionBtn" />
                  </button>
                </div>
                <button
                  v-for="btn in buttons"
                  :key="btn.id"
                  class="toolbar-items-btn"
                  @click="setActive(btn.id, $event)"
                >
                  <component :is="btn.icon" />
                </button>
              </div>
            </div>
            <button class="toggle-btn" @click="isOptsOpen = !isOptsOpen">
              <icon-full-screen-image-grid :color="isOptsOpen && '#036666'" />
            </button>
          </div>
        </div>
      </div>
      <div v-show="isLoading" class="absolute top-[55%] left-[50%]">
        <icon-loading
          color="#ffffff"
          :loading="true"
          :width="14"
          :height="14"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Carousel, Navigation, Slide } from "vue3-carousel";
import type { PhotoReportDataModel } from "~/interfaces/api/gps/GPS-model";
import "vue3-carousel/dist/carousel.css";
import { defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
// emits
const emit = defineEmits(["closeFullScreenImage"]);

//props
const props = defineProps<{
  isLoading: boolean;
  imageData: PhotoReportDataModel[];
  currentImageIndex?: number;
}>();

// state
const { t } = useI18n();
const slots = useSlots();
const fullScreenCarouselRef = ref(null);
const currentCarousel = ref(props.currentImageIndex || 0);
const isOptsOpen = ref(false);
const activeOptBtn = ref(getPageSizeByKey("images-count-in-full-screen") || 1);
const isActiveCardLeftWidth = ref(0);
const indicatorPositionStyle = ref({});
const toolbar = ref(null);
let mouseDownTime = 0;
const buttons = [
  {
    id: 1,
    icon: defineAsyncComponent(
      () => import("@/components/icon/full-screen-image/GridOne.vue")
    ),
  },
  {
    id: 2,
    icon: defineAsyncComponent(
      () => import("@/components/icon/full-screen-image/GridTwo.vue")
    ),
  },
  {
    id: 3,
    icon: defineAsyncComponent(
      () => import("@/components/icon/full-screen-image/GridThree.vue")
    ),
  },
  {
    id: 4,
    icon: defineAsyncComponent(
      () => import("@/components/icon/full-screen-image/GridFour.vue")
    ),
  },
];
const show = ref(getCheckedItemsByKey("full-screen-information") || false);

const settings = {
  itemsToShow: 1,
  snapAlign: "center",
};
let breakpoints = {
  1024: {
    itemsToShow: activeOptBtn.value,
    itemsToScroll: activeOptBtn.value,
    snapAlign: "start",
    gap: 25,
  },
};

const thumbnailsConfig = {
  itemsToShow: 10,
  snapAlign: "center",
  gap: 4,
};

// methods
const toggleShowHideInfo = () => {
  show.value = !show.value;
  setCheckedItemsToLocalByKey("full-screen-information", show.value);
};

const handleOutsideMouseDown = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    mouseDownTime = Date.now();
  }
};

const handleOutsideClick = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    const pressDuration = Date.now() - mouseDownTime;
    if (pressDuration < 200) {
      closeFullScreenImage();
    }
  }
};

const handleClickByCarousel = (event: MouseEvent) => {
  const carousel = event.currentTarget as HTMLElement;
  if (!carousel) return;
  const rect = carousel.getBoundingClientRect();
  const middleX = rect.left + rect.width / 2;
  if (event.clientX < middleX) {
    fullScreenCarouselRef.value?.prev();
  } else {
    fullScreenCarouselRef.value?.next();
  }
};

const slideTo = (nextSlide: number) => {
  fullScreenCarouselRef.value?.slideTo(nextSlide);
  checkActiveCardLeftWidth();
};

const closeFullScreenImage = () => {
  emit("closeFullScreenImage");
};

const handleKeydown = (event: { key: string }) => {
  if (event.key === "ArrowRight") {
    fullScreenCarouselRef.value?.next();
  }
  if (event.key === "ArrowLeft") {
    fullScreenCarouselRef.value?.prev();
  }
  if (event.key === "Escape") {
    closeFullScreenImage();
  }
};

const activeNumberFunc = (num: number) => {
  breakpoints = {
    700: {
      itemsToShow: 4,
      snapAlign: "start",
      gap: 10,
    },
    1024: {
      itemsToShow: num,
      itemsToScroll: num,
      snapAlign: "start",
      gap: 25,
    },
  };
};

const setActive = (id: number, event) => {
  activeOptBtn.value = id;
  moveIndicator(event.currentTarget);
  activeNumberFunc(id);
  setTimeout(() => {
    carouselContentCheck();
  }, 10);
  setPageSizeByKey("images-count-in-full-screen", id);
};

const moveIndicator = (el) => {
  indicatorPositionStyle.value = {
    top: el.offsetTop + "px",
    left: el.offsetLeft + "px",
    width: el.offsetWidth + "px",
    height: el.offsetHeight + "px",
  };
};

const checkActiveCardLeftWidth = () => {
  const activeEl = document.querySelector(".is-active");
  const carouselFooter = document.querySelector(".carousel-content-footer");

  if (!activeEl || !carouselFooter) return;

  const { left: activeLeft } = activeEl.getBoundingClientRect();
  const { left: footerLeft } = carouselFooter.getBoundingClientRect();

  isActiveCardLeftWidth.value = activeLeft - footerLeft + 30;
};

const onSlideEnd = () => {
  checkActiveCardLeftWidth();
};

const onSlideStart = () => {
  setTimeout(() => {
    checkActiveCardLeftWidth();
  }, 200);
};
// Init on mount

onMounted(() => {
  const activeEl = document.querySelectorAll(".toolbar-items-btn");
  if (activeEl) moveIndicator(activeEl[activeOptBtn.value - 1]);
});

const carouselContentCheck = () => {
  const images = document.querySelectorAll<HTMLElement>(".carousel-image");
  const infoSections = document.querySelectorAll<HTMLElement>(
    ".carousel-information-section"
  );

  images.forEach((img, i) => {
    const imgRect = img.getBoundingClientRect();
    const containerRect = img
      .closest(".carousel__item")
      ?.getBoundingClientRect();

    if (containerRect && infoSections[i]) {
      const gap = containerRect.bottom - imgRect.bottom;
      infoSections[i].style.bottom = \`\${gap + 28}px\`;
    }
  });
};

// hooks
const hasInfoAuditNameSlot = computed(() => {
  const slot = slots["info-audit"];
  return !!slot;
});

const hasInfoClientNameSlot = computed(() => {
  const slot = slots["info-client"];
  return !!slot;
});

const hasInfoNameSlot = computed(() => {
  const slot = slots["info-name"];
  return !!slot;
});

const hasInfoDateSlot = computed(() => {
  const slot = slots["info-date"];
  return !!slot;
});

const hasInfoCategorySlot = computed(() => {
  const slot = slots["info-category"];
  return !!slot;
});

const hasSliderInfoSlot = computed(
  () =>
    hasInfoNameSlot.value ||
    hasInfoDateSlot.value ||
    hasInfoCategorySlot.value ||
    hasInfoAuditNameSlot.value
);

const activeOptionBtn = computed(() => {
  return buttons.find((i) => i.id === activeOptBtn.value).icon;
});

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  setTimeout(() => {
    checkActiveCardLeftWidth();
    carouselContentCheck();
  }, 100);
});

const defaultCarouselContent = () => {
  setTimeout(() => {
    carouselContentCheck();
  }, 200);
};

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
});

watch(currentCarousel, (val) => {
  const lastIndex = props.imageData.length - 1;
  if (val > lastIndex) {
    currentCarousel.value = lastIndex;
  } else if (val < 0) {
    currentCarousel.value = 0;
  }
  checkActiveCardLeftWidth();
});

watch(
  () => props.isLoading,
  (val) => {
    defaultCarouselContent();
  }
);

watch(props.imageData, (val) => {
  carouselContentCheck();
});

window.addEventListener("resize", carouselContentCheck);
window.addEventListener("load", carouselContentCheck);
<\/script>

<style lang="scss">
.photo-content {
  display: flex;
  background: rgba(0, 0, 0, 0.5);
  position: fixed;
  width: 100vw;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 120 !important;

  .full-screen-photo-content {
    padding: 0;
    width: 100vw;
    background: transparent;
    position: relative;

    .carousel-container {
      width: 100%;
      position: relative;
      height: 100vh !important;
      padding: 40px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;

      .close-icon {
        position: absolute;
        top: 50px;
        right: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 4;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .carousel-size-content {
        position: absolute;
        bottom: 65px;
        right: 40px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        z-index: 3 !important;

        .icon {
          display: flex;
          justify-content: center;
          width: 100%;
          cursor: pointer;
        }

        .toolbar-container {
          background: white;
          border-radius: 12px;
          padding: 7px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .toggle-btn {
          background: white;
          border: none;
          border-radius: 12px;
          width: 40px;
          height: 40px;
          cursor: pointer;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .toolbar-items-wrapper {
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition:
            max-height 0.35s ease-in-out,
            opacity 0.35s ease-in-out;
        }

        .toolbar-items-wrapper.open {
          max-height: 300px;
          opacity: 1;
        }

        .toolbar-items {
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
        }

        .active-indicator {
          position: absolute;
          background: #006d6d;
          border-radius: 8px;
          transition: all 0.3s ease;

          button {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            border-radius: 8px;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          button svg path,
          button svg rect {
            fill: white;
          }
        }

        .toolbar-items button {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          border-radius: 8px;
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .toolbar-items button:hover {
          background: #03666633;
        }
      }

      .show-hide-info-btn {
        position: absolute;
        bottom: 65px;
        right: 110px;
        background: white;
        border: none;
        border-radius: 12px;
        width: 54px;
        height: 54px;
        cursor: pointer;
        font-size: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 3 !important;
      }

      .carousel-size-content-btn:hover {
        background: #ffffffcc !important;
        border-radius: 12px;

        .toggle-btn {
          svg path,
          svg rect {
            fill: #036666;
          }
        }
      }

      .close-icon:hover {
        background: #f5f7fa;
        transition: all 0.3s ease;

        svg {
          path {
            fill: theme("colors.neutral.950");
          }
        }
      }

      .carousel-content {
        user-select: none;
        align-content: center;
        height: calc(100vh - 200px) !important;
        width: 100%;
        padding: 0 130px;
        background: transparent !important;

        .carousel__item {
          height: calc(100vh - 200px) !important;
          width: fit-content;
          color: black;
          font-size: 28px;
          display: flex;
          position: relative;
          justify-content: center;
          background: transparent !important;
          align-items: center;

          .carousel-information-section {
            position: absolute;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%);
            width: calc(100% - 56px);
            display: flex;
            justify-content: center;
            z-index: 1;

            .info-section {
              background: #ffffffcc;
              border-radius: 12px;
              padding: 8px;
              text-align: center;
              transform: translateY(50%);
              opacity: 0;
              transition:
                transform 0.3s ease,
                opacity 0.3s ease;
              display: block;

              .information-item {
                display: flex;
                align-items: start;
                gap: 8px;

                .key {
                  color: #525866;
                  font-size: 14px;
                  font-family: "Inter", sans-serif;
                  font-weight: 400;
                }

                .value {
                  font-size: 14px;
                  font-family: "Inter", sans-serif;
                  font-weight: 400;
                  color: #0e121b;
                  text-align: start;
                }
              }
            }

            .info-section.visible {
              transform: translateY(0);
              opacity: 1;
            }
          }

          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: cover;
            border-radius: 12px;
          }
        }

        .carousel__slide {
          width: 100%;
        }

        .carousel__next {
          width: 50px !important;
          height: 50px !important;
          box-sizing: content-box;
          border-radius: 12px;
          opacity: 1 !important;
          right: -90px;
          background: theme("colors.neutral.0");
          user-select: none;

          .carousel__icon {
            fill: theme("colors.neutral.600");
            width: 30px;
            height: 30px;
          }
        }

        .carousel__prev {
          user-select: none;
          width: 50px !important;
          height: 50px !important;
          box-sizing: content-box;
          border-radius: 12px;
          z-index: 2 !important;
          left: -90px;
          opacity: 1 !important;
          background: theme("colors.neutral.0");

          .carousel__icon {
            fill: theme("colors.neutral.600");
            width: 30px;
            height: 30px;
          }
        }

        .carousel__prev:before,
        .carousel__next:before {
          content: "";
          position: absolute;
          top: calc(calc(-100vh + 200px) / 2 + 25px);
          left: -40px;
          width: 130px;
          height: calc(100vh - 200px);
          border-radius: 0;
          cursor: pointer;
        }

        .carousel__next--disabled:before,
        .carousel__prev--disabled:before {
          cursor: default;
        }

        .carousel__next:before {
          right: -40px;
        }

        .carousel__prev:hover,
        .carousel__next:hover {
          .carousel__icon {
            fill: #299b9b;
          }
        }

        .carousel__prev:hover .carousel__icon,
        .carousel__next:hover .carousel__icon {
          fill: #299b9b;
        }

        .carousel__next--disabled,
        .carousel__next--disabled:hover,
        .carousel__prev--disabled:hover,
        .carousel__prev--disabled {
          background: #f5f7fa;
          cursor: not-allowed;

          .carousel__icon {
            fill: #cacfd8;
          }
        }
      }

      .carousel-content-footer {
        background: #0e121b4d;
        border-radius: 16px;
        padding: 8px;
        transition: all 0.4s ease;
        position: relative;

        .active-circle {
          position: absolute;
          bottom: -14px;
          width: 10px;
          height: 10px;
          background: theme("colors.neutral.0");
          border-radius: 50%;
          transition: transform 0.3s ease;
        }

        .carousel__track {
          display: flex;
          align-items: center;
          max-width: 816px;
        }

        img {
          border-radius: 16px;
          width: 68px;
          height: 68px;
          object-fit: cover;
          transition: all 0.3s ease;
        }

        #thumbnails {
          border-radius: 16px;
        }

        .thumbnail {
          height: 78px;
          width: 78px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .carousel__slide {
          height: 78px !important;
          width: 78px !important;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .carousel__slide--active,
        .carousel__slide:hover {
          height: 78px !important;
          width: 78px !important;
        }

        .thumbnail.is-active,
        .thumbnail:hover {
          img {
            height: 78px !important;
            width: 78px !important;
          }
        }
      }
    }
  }
}
</style>
`;export{n as default};
