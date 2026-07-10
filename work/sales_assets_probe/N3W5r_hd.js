const e=`<template>
  <flex-col
    class="bg-white rounded-lg py-4 max-h-[calc(100vh-6rem)] overflow-y-auto menu-body"
  >
    <div class="text-black text-lg font-medium border-b px-3 pb-3">
      {{ t("audit.report_audit.visit_details") }}
    </div>
    <div class="px-4">
      <div
        v-for="(item, key) in formattedDetails"
        :key="key"
        class="py-3 border-b"
        :class="{
          'last-border-b-0': !photoReports.length,
        }"
      >
        <flex-row
          class="items-center justify-between gap-2"
          :class="{ 'flex-wrap': !item.showTooltip }"
        >
          <div class="text-neutral-600 break-words">{{ key }}</div>
          <LinkComponent
            v-if="item?.link"
            :to="item.link"
            :value="item.text"
            non-copyable
          />
          <div
            v-else
            v-tooltip="item.showTooltip && item.text"
            class="text-end text-black break-words"
            :class="{ truncate: item.showTooltip }"
          >
            {{ item.text }}
          </div>
        </flex-row>
      </div>
    </div>

    <!-- IMAGE SLIDER SECTION -->
    <div v-if="photoReports.length" class="mt-3">
      <div class="text-black font-medium border-b p-3">
        {{ t("audit.report_audit.photo_reports") }}
      </div>
      <!-- Image Carousel -->
      <div class="relative p-4">
        <Carousel
          :items-to-show="1"
          class="rounded-lg overflow-hidden"
          ref="carousel"
          v-model="currentSlide"
        >
          <Slide v-for="(file, fileIdx) in allCategoryPhotos" :key="file.id">
            <div
              class="flex items-center justify-center bg-gray-100 h-64"
              @click="openImageFullScreen(fileIdx)"
            >
              <img :src="file.path" :alt="file.name" class="object-cover" />
            </div>
          </Slide>
        </Carousel>
      </div>

      <!-- Pagination of photo -->
      <div v-if="allCategoryPhotos.length > 1" class="flex justify-center mt-4">
        <page-index
          :available-pages="allCategoryPhotos.length"
          :current-page="currentSlide + 1"
          @setPage="setImagePage"
        />
      </div>
    </div>

    <AuditAuditReportDetailAudoWaveFormPlayer />
    <full-screen-image
      v-if="fullScreenedCategoryFiles"
      :image-data="fullScreenedCategoryFiles"
      :current-image-index="fullScreenedImgIdx"
      :is-loading="visitDetailStore.isMainDataLoading"
      @close-full-screen-image="closeFullScreenImage"
    >
      <template #info-audit>
        {{ visitDetailStore.mainData.employee?.name }}
      </template>
      <template #info-date="{ item }">
        {{ getFormattedDate(item?.created_date, "DD.MM.YYYY HH:mm") }}
      </template>
      <template #info-category="{ item }">
        {{ item?.category?.name }}
      </template>
    </full-screen-image>
  </flex-col>
</template>

<script setup lang="ts">
import "vue3-carousel/dist/carousel.css";
import type { CarouselMethods } from "vue3-carousel";
import { Carousel, Slide } from "vue3-carousel";
import { useI18n } from "vue-i18n";
import type { ByVisitIdModel } from "~/interfaces/api/audit/audit-report/detail-models";
import { getFormattedDate } from "~/utils/formatters";
import { formatTime } from "~/utils/formatters";

// store
const visitDetailStore = useAuditReportDetailStore("main");

// states
const { t } = useI18n();
const fullScreenedCategoryFiles = ref<
  ByVisitIdModel["photo_reports"][0]["files"] | null
>(null);
const fullScreenedImgIdx = ref<number>(0);

// Category and slide tracking
const currentSlide = ref(0);
const carousel = ref<CarouselMethods | null>(null);

// hooks
const formattedDetails = computed(() => {
  const {
    employee,
    role,
    client_name,
    client_visual_id,
    client_id,
    comment,
    note,
    spent_time,
    tracked_time_from,
    tracked_time_to,
  } = visitDetailStore.mainData || ({} as ByVisitIdModel);

  return {
    [t("audit.report_audit.user")]: {
      text: employee?.name,
      showTooltip: true,
    },
    [t("audit.report_audit.role")]: {
      text: role,
    },
    [t("column.client")]: {
      text: client_name,
      link: \`/clients/about-clients/\${client_id}\`,
    },
    [t("column.client_id")]: {
      text: client_visual_id,
    },
    [t("audit.report_audit.visit_start")]: {
      text: getFormattedDate(tracked_time_from),
    },
    [t("audit.report_audit.visit_end")]: {
      text: getFormattedDate(tracked_time_to),
    },
    [t("column.spent_time")]: {
      text: formatTime(spent_time, t),
    },
    [t("audit.report_audit.note")]: {
      text: note,
    },
    [t("column.comment")]: {
      text: comment,
    },
  };
});

const photoReports = computed<ByVisitIdModel["photo_reports"]>(() => {
  return visitDetailStore.mainData?.photo_reports || [];
});

const allCategoryPhotos = computed(() =>
  photoReports.value.flatMap((category) =>
    (category.files ?? []).map((file) => ({
      ...file,
      category: category.category,
    })),
  ),
);

// methods
const openImageFullScreen = (fileIdx: number) => {
  fullScreenedCategoryFiles.value = allCategoryPhotos.value;
  fullScreenedImgIdx.value = fileIdx;
};

const closeFullScreenImage = () => {
  fullScreenedCategoryFiles.value = null;
  fullScreenedImgIdx.value = 0;
};

const setImagePage = (page: number) => {
  const slideIndex = page - 1; // Convert from 1-based to 0-based index
  currentSlide.value = slideIndex;

  nextTick(() => {
    if (carousel.value && carousel.value.slideTo) {
      carousel.value.slideTo(slideIndex);
    }
  });
};
<\/script>

<style scoped>
.menu-body::-webkit-scrollbar {
  width: 10px;
}

.menu-body::-webkit-scrollbar-track {
  background: #fafafa;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  margin-top: 10px;
}

.menu-body::-webkit-scrollbar-thumb {
  border-radius: 10px;
  border: 3px solid transparent;
  background-clip: padding-box;
}
</style>
`;export{e as default};
