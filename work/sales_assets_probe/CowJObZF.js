const n=`<template>
  <flex-col class="gap-3">
    <div class="flex w-full gap-3">
      <m-btn
        group="outlined"
        class="!border-[var(--primary-border)]"
        :class="{ '!text-primary-600': isSortedAsc }"
        @click="isSortedAsc = !isSortedAsc"
      >
        <IconSortByUp v-show="isSortedAsc" />
        <IconSortByDown v-show="!isSortedAsc" />
        {{ t("gps.sort_by_hour") }}
      </m-btn>

      <search-input
        :value="searchParams"
        @change="handleSearch"
        class="flex-1"
      />
    </div>
    <div class="w-full"></div>
    <div class="cards">
      <div
        v-for="card in filteredCards"
        :key="getCardId(card)"
        class="card-section"
      >
        <div
          class="card-content"
          :class="{ 'card-content-active': isCardActive(card) }"
          @click="handleCardClick(card)"
        >
          <div class="card-left-content">
            <div
              class="truncate"
              :class="hasLocation(card) ? 'card-title-location' : 'card-title'"
              :title="getCardTitle(card)"
            >
              {{ getCardTitle(card) }}
            </div>

            <!-- Visited-specific info -->
            <template v-if="isVisitedMode">
              <div class="section">
                {{ t("column.distance_to_client") }}:
                <span>{{ getDistanceToClient(card) }}</span>
              </div>
              <div class="section">
                {{ t("column.was_at_the_point") }}:
                <span>
                  {{
                    asVisitedCard(card).was_at_the_point
                      ? t("filters.yes")
                      : t("filters.no")
                  }}
                </span>
              </div>
              <div
                class="number-icon-number"
                :class="{ 'bg-red': asVisitedCard(card).is_rejected }"
              >
                {{
                  getFormattedDate(
                    asVisitedCard(card).visit_time ?? "",
                    "HH:mm",
                  )
                }}
              </div>
            </template>

            <!-- Unvisited-specific marker -->
            <div v-else class="circle-for-card" />
          </div>

          <div class="card-right-content">
            <div>
              <div
                v-if="!hasLocation(card)"
                v-tooltip="t('gps.no_location')"
                class="cursor-default"
              >
                <IconLocationHidden :size="24" />
              </div>
            </div>

            <div
              v-if="shouldShowPhotoReportBtn"
              class="photo-report-icon"
              :class="
                asVisitedCard(card).has_photo_reports
                  ? 'cursor-pointer'
                  : 'cursor-default'
              "
              @click.stop="handlePhotoReportClick(card)"
            >
              <div
                v-tooltip="
                  asVisitedCard(card).has_photo_reports
                    ? t('gps.photo_report_yes')
                    : t('gps.photo_report_no')
                "
              >
                <icon-camera v-if="asVisitedCard(card).has_photo_reports" />
                <icon-hide-camera v-else :size="24" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isLoading" class="loading-container">
        <icon-loading :loading="isLoading" :width="11" :height="11" />
      </div>

      <div v-if="!isLoading && !filteredCards?.length" class="card-empty">
        <no-data size="medium" />
      </div>
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import type { Template } from "~/interfaces/ui/template";
import { useI18n } from "vue-i18n";
import type {
  DetailUnVisitedModel,
  DetailVisitsModel,
} from "~/interfaces/api/gps/GPS-model";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { gpsPlaceType, gpsRouteStates } from "~/variable/column-constants";
import { EmployeeRole, VisitTabType } from "~/variable/gps-constants";
import { getFormattedDate } from "~/utils/formatters";

type CardData = DetailVisitsModel | DetailUnVisitedModel;

const props = defineProps<{
  mapActionStates?: Template[];
  placeType?: ConstantModel[];
  visitTab: VisitTabType;
}>();

const emit = defineEmits<{
  setClientLocation: [
    location: { latitude: number; longitude: number } | null,
    data: CardData,
  ];
  setOpenPhotoReport: [id: string];
  onSearch: [value: string | undefined];
}>();

const { t } = useI18n();
const route = useRoute();
const gpsStore = useGPSStore("main");

const searchParams = ref<string>();
const isActiveCard = ref<string | null>(null);
const actionData = ref<Template[] | null>(null);
const placeTypeFilter = ref<ConstantModel[] | null>(null);
const isLoading = ref(false);
const isSortedAsc = ref(false);

const isVisitedMode = computed(() => props.visitTab === VisitTabType.VISITED);

const asVisitedCard = (card: CardData): DetailVisitsModel =>
  card as DetailVisitsModel;
const asUnvisitedCard = (card: CardData): DetailUnVisitedModel =>
  card as DetailUnVisitedModel;

const getCardId = (card: CardData): string => {
  return isVisitedMode.value
    ? (asVisitedCard(card).visit_id ?? "")
    : (asUnvisitedCard(card).client?.id ?? "");
};

const getCardTitle = (card: CardData): string => {
  return isVisitedMode.value
    ? (asVisitedCard(card).place?.name ?? "")
    : (asUnvisitedCard(card).client?.name ?? "");
};

const getCardLocation = (card: CardData) => {
  if (isVisitedMode.value) {
    return asVisitedCard(card).location;
  }

  return asUnvisitedCard(card).client?.lat_lng ?? null;
};

const hasLocation = (card: CardData): boolean => Boolean(getCardLocation(card));

const isCardActive = (card: CardData): boolean =>
  isActiveCard.value === getCardId(card);

const getDistanceToClient = (card: CardData) => {
  if (
    !asVisitedCard(card).distance_to_client &&
    asVisitedCard(card).distance_to_client !== 0
  )
    return t("filters.no_data");
  return formatDistance(asVisitedCard(card).distance_to_client);
};

const rawCardData = computed<CardData[]>(() => {
  return isVisitedMode.value
    ? (gpsStore.detailVisitsData ?? [])
    : (gpsStore.detailUnVisitedData ?? []);
});

const filteredCards = computed(() => {
  if (!isVisitedMode.value) {
    return rawCardData.value;
  }

  let data = [...(rawCardData.value as DetailVisitsModel[])];

  if (placeTypeFilter.value?.length) {
    data = data.filter((item) =>
      placeTypeFilter.value!.some(
        (filter) => filter.checked && filter.id === item.place_type.id,
      ),
    );
  }

  if (actionData.value?.length) {
    const showOrders = actionData.value.some(
      (action) => action.key === "gps_orders" && action.checked,
    );
    const showRejections = actionData.value.some(
      (action) => action.key === "gps_rejections" && action.checked,
    );

    if (!showOrders && !showRejections) {
      return [];
    }

    if (showOrders && !showRejections) {
      data = data.filter((item) => !item.is_rejected);
    } else if (!showOrders && showRejections) {
      data = data.filter((item) => item.is_rejected);
    }
  }

  if (isSortedAsc.value) {
    data.sort((a, b) => {
      const timeA = new Date(asVisitedCard(a).visit_time ?? "").getTime();
      const timeB = new Date(asVisitedCard(b).visit_time ?? "").getTime();
      return timeA - timeB;
    });
  } else {
    data.sort((a, b) => {
      const timeA = new Date(asVisitedCard(a).visit_time ?? "").getTime();
      const timeB = new Date(asVisitedCard(b).visit_time ?? "").getTime();
      return timeB - timeA;
    });
  }

  return data;
});

const shouldShowPhotoReportBtn = computed(() => {
  const roleId = Number(route.query.role_id);
  return isVisitedMode.value && roleId !== EmployeeRole.EXPEDITOR;
});

const formatDistance = (distance: number): string => {
  if (distance < 1000) return \`\${Math.round(distance)} м\`;

  const kilometers = Math.floor(distance / 1000);
  const meters = Math.round(distance % 1000);

  return meters > 0 ? \`\${kilometers} км, \${meters} м\` : \`\${kilometers} км\`;
};

const handleCardClick = (card: CardData): void => {
  const location = getCardLocation(card);
  emit("setClientLocation", location, card);
  isActiveCard.value = getCardId(card);
};

const handlePhotoReportClick = (card: CardData): void => {
  if (!shouldShowPhotoReportBtn.value) return;

  const visitedCard = asVisitedCard(card);
  if (!visitedCard.has_photo_reports) return;

  emit("setOpenPhotoReport", getCardId(card));
};

const handleSearch = (value: string | null): void => {
  searchParams.value = value === null ? undefined : value;
  emit("onSearch", searchParams.value);
};

const fetchData = async (): Promise<void> => {
  try {
    isLoading.value = true;

    const { for_date, employee_id } = gpsStore.employeeRouteParams;
    if (!for_date || !employee_id) return;

    if (isVisitedMode.value) {
      await gpsStore.getDetailVisits();
    } else {
      await gpsStore.getDetailUnVisited();
    }
  } catch (error) {
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => gpsStore.employeeRouteParams,
  async () => {
    await fetchData();
  },
  { deep: true },
);

watch(
  () => props.mapActionStates,
  (newVal) => {
    actionData.value =
      newVal ?? (getCheckedItemsByKey(gpsRouteStates) as Template[] | null);
  },
  { deep: true, immediate: true },
);

watch(
  () => props.placeType,
  (newVal) => {
    placeTypeFilter.value =
      newVal ?? (getCheckedItemsByKey(gpsPlaceType) as ConstantModel[] | null);
  },
  { deep: true, immediate: true },
);

watch(
  () => props.visitTab,
  async () => {
    isActiveCard.value = null;
    handleSearch(null);
    await fetchData();
  },
);

watch(
  [
    () => gpsStore.detailVisitsDataForSearch,
    () => gpsStore.detailUnVisitedDataForSearch,
  ],
  () => {
    handleSearch(null);
  },
);

onMounted(async () => {
  if (!actionData.value) {
    actionData.value = getCheckedItemsByKey(gpsRouteStates) as
      | Template[]
      | null;
  }
  if (!placeTypeFilter.value) {
    placeTypeFilter.value = getCheckedItemsByKey(gpsPlaceType) as
      | ConstantModel[]
      | null;
  }

  await fetchData();
});
<\/script>

<style scoped lang="scss">
.cards {
  position: relative;
  box-sizing: border-box;
  overflow-y: auto;
  max-height: calc(100vh - 360px);
  min-height: 160px;
  display: flex;
  flex-flow: column;
  gap: 10px 0;
  padding: 10px 10px 10px 75px;

  .card-empty {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .card-section {
    position: relative;

    .card-content {
      padding: 12px;
      z-index: 2;
      border-radius: 12px;
      position: relative;
      background-color: rgb(255, 255, 255);
      transition: 450ms cubic-bezier(0.23, 1, 0.32, 1);
      box-sizing: border-box;
      font-family: "Open Sans", sans-serif;
      border: 1px solid theme("colors.neutral.200");
      display: flex;
      gap: 2px;
      cursor: pointer;
      user-select: none;

      .card-left-content {
        width: 80%;
      }

      .card-right-content {
        width: 20%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: flex-end;
      }

      .number-icon-number {
        border-radius: 20px;
        padding: 5px 10px;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: -75px;
        border: 4px solid theme("colors.neutral.0");
        background: theme("colors.primary.600");
        color: theme("colors.neutral.0");
        font-family: "Inter", sans-serif;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: center;

        &.bg-red {
          background: #de1f1f;
        }
      }

      .circle-for-card {
        border-radius: 50%;
        width: 25px;
        height: 25px;
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        left: -56px;
        border: 1px solid #299b9b;
        background: theme("colors.neutral.0");
      }

      .card-title,
      .card-title-location {
        width: calc(100% - 25px);
        font-weight: 500;
        font-size: 14px;
        font-family: "Inter", sans-serif;
        color: theme("colors.neutral.950");
        display: inline-block;
      }

      .section {
        font-family: "Inter", sans-serif;
        font-size: 12px;
        color: theme("colors.neutral.600");
        display: flex;
        align-items: center;
        font-weight: 400;
        gap: 0 6px;
      }
    }

    .card-content:before {
      top: 50%;
      left: -6px;
      content: "";
      position: absolute;
      width: 10px;
      height: 10px;
      background: white;
      border: 1px solid theme("colors.neutral.200");
      transform: translateY(-50%) rotate(45deg);
      border-bottom-left-radius: 3px;
      border-top: none;
      border-right: none;
    }

    .card-content-active:before {
      border-color: #05a9a980 !important;
    }

    .card-content-active,
    .card-content:hover,
    .card-content:before {
      border-color: #05a9a980;
    }
  }

  .card-disabled {
    .card-content {
      cursor: default;

      .card-title,
      .section,
      .circle-for-card {
        opacity: 0.5;
      }
    }

    .card-content .number-icon-number {
      opacity: 1 !important;
    }

    .photo-report-icon,
    .place-type-circle {
      opacity: 0.5;
    }

    .card-content:hover {
      border: 1px solid theme("colors.neutral.200");
    }
  }

  .card-section:before {
    top: 0;
    left: -44px;
    width: 4px;
    height: calc(100% + 10px);
    content: "";
    position: absolute;
    background: #05a9a933;
  }

  .card-section:last-child:before {
    background: linear-gradient(to bottom, #05a9a933 50%, white 50%);
  }

  .card-section:nth-child(1):before {
    background: linear-gradient(to bottom, white 50%, #05a9a933 50%);
  }
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

::-webkit-scrollbar {
  width: 6px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: #e1e4e4;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  height: 8px;
}
</style>
`;export{n as default};
