const n=`<template>
  <flex-col class="gap-3 relative">
    <div
      class="gps-expeditor-cards"
      :class="gpsStore.isExpeditorGetSequenceLoading && 'opacity-50'"
    >
      <VueDraggable
        ref="el"
        v-model="draggableData"
        :animation="150"
        ghost-class="ghost"
        class="flex flex-col gap-2 w-full"
        @end="changeDragEndDrop"
      >
        <div
          v-for="(card, index) in dataOptimizationOrCurrent"
          class="card-section"
          :style="{ '--route-color': getBackgroundStyle(card).background }"
        >
          <div class="card-content">
            <div class="card-gps-left">
              <div class="flex items-center gap-x-2">
                <Tooltip :tooltip="getPlaceTypeName(card.visit_place_type)">
                  <div class="place-type">
                    <component
                      :is="iconComponent(card.visit_place_type)"
                      v-bind="resolveIconProps(card.visit_place_type)"
                    />
                  </div>
                </Tooltip>
                <div
                  class="truncate"
                  :class="card.location ? 'card-title-location' : 'card-title'"
                  :title="card?.visit_place_name"
                  @click="setClientLocation(card, index)"
                >
                  {{ card?.visit_place_name }}
                </div>
              </div>
              <div v-if="card.visit_reason" class="section truncate">
                {{ t("gps.visit_reason") }}:
                <span>{{ card.visit_reason }}</span>
              </div>
              <div v-if="!!card.visit_reason_types?.length" class="reason-tags">
                <div
                  v-for="tag in card.visit_reason_types"
                  class="visit-reason-tag"
                  :style="\`border:1px solid \${getVisitReasonType(tag)?.hex_color};color:\${getVisitReasonType(tag)?.hex_color}\`"
                >
                  {{ getVisitReasonType(tag)?.name }}
                </div>
              </div>
            </div>
            <Tooltip v-if="!card.location" :tooltip="t('labels.no_location')">
              <icon-info-circle color="#057CD1" />
            </Tooltip>

            <icon-menu-control-icon class="cursor-pointer" />

            <div class="circle-for-card">
              {{ card.visit_sequence_number }}
            </div>

            <div
              v-if="isShowFlagPoint(card.route_point_type)"
              class="flag-for-card"
              :class="
                isShowFlagPointChange(card.route_point_type, index) &&
                'cursor-pointer'
              "
              @click="middleRoutePointTypeChange(card.route_point_type, index)"
            >
              <Tooltip :tooltip="getFlagIconTooltip(card.route_point_type)">
                <icon-flag :color="getFlagIconColor(card.route_point_type)" />
              </Tooltip>
            </div>
            <div
              v-if="isShowAddPoint(card.route_point_type, index)"
              class="flag-for-card"
            >
              <div
                v-if="isShowDropdownForPoint(index, card.route_point_type)"
                v-click-outside="outsidePoint"
              >
                <div
                  class="point-content"
                  @click.stop="togglePoint(index, card.route_point_type)"
                >
                  <Tooltip :tooltip="getFlagIconTooltip(card.route_point_type)">
                    <icon-plus color="#299B9B" />
                  </Tooltip>
                  <div v-if="openPoint" class="point-component">
                    <div class="point-component-body">
                      <div
                        class="section"
                        @click="changePoint(RoutePointType.START_POINT, index)"
                      >
                        {{ t("gps.start_point") }}
                      </div>
                      <div
                        class="section"
                        @click="changePoint(RoutePointType.MIDDLE_POINT, index)"
                      >
                        {{ t("gps.middle_point") }}
                      </div>
                      <div
                        class="section"
                        @click="changePoint(RoutePointType.END_POINT, index)"
                      >
                        {{ t("gps.end_point") }}
                      </div>
                      <div class="arr"></div>
                    </div>
                  </div>
                </div>
              </div>

              <Tooltip
                v-else
                :tooltip="getAddIconTooltip(card.route_point_type, index)"
                @click="
                  middleRoutePointTypeChange(card.route_point_type, index)
                "
              >
                <icon-plus color="#299B9B" />
              </Tooltip>
            </div>
          </div>
        </div>
      </VueDraggable>
      <div v-if="dataOptimizationOrCurrent?.length === 0" class="card-empty">
        {{ t("empty") }}
      </div>
    </div>
    <div
      v-show="gpsStore.isExpeditorGetSequenceLoading"
      class="absolute top-[50%] left-[50%]"
    >
      <icon-loading :loading="true" :width="14" :height="14" />
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SequenceExpeditorDataListModel } from "~/interfaces/api/gps/GPS-model";
import { VueDraggable } from "vue-draggable-plus";
import type { ConstantModel } from "~/interfaces/api/constants/library-constants-model";
import { getCheckedItemsByKey } from "~/utils/local-storage";
import { gpsPlaceType } from "~/variable/column-constants";
import { colorCodes } from "~/variable/map-route-colors";
import { RoutePointType } from "~/variable/gps-constants";
import {
  IconUser,
  IconCash,
  IconBox,
  IconCar,
  IconLocation,
} from "#components";

// emits
const emit = defineEmits(["setClientLocation"]);

// props
const props = defineProps<{
  placeType?: ConstantModel[];
}>();

// store

const gpsStore = useGPSStore("main");

// state

const { t } = useI18n();

const draggableData = ref<SequenceExpeditorDataListModel[]>([]);

const placeType = ref(getCheckedItemsByKey(gpsPlaceType));

const openPoint = ref<boolean>(false);
//methods

const setClientLocation = (
  data: SequenceExpeditorDataListModel,
  index: number
) => {
  if (!data.location) return;
  emit("setClientLocation", data?.location, data, index);
};

const updateSequenceNumbers = (data: SequenceExpeditorDataListModel[]) => {
  return data.map((item, index) => {
    if (item.visit_sequence_number !== null) {
      item.visit_sequence_number = index + 1;

      return item;
    }

    return item;
  });
};

const changeDragEndDrop = () => {
  const updatedData = [...draggableData.value];
  const sortedData = updatedData.sort(
    (a, b) => a.route_point_type - b.route_point_type
  );
  gpsStore.visitExpeditorSequenceData = updateSequenceNumbers(sortedData);
};

const getFlagIconTooltip = (typeId: number) => {
  if (typeId === RoutePointType.START_POINT) {
    return t("gps.start_point");
  }
  if (typeId === RoutePointType.END_POINT) {
    return t("gps.end_point");
  }
  return t("gps.middle_point");
};

const getAddIconTooltip = (typeId: number, index) => {
  const prevStart =
    dataOptimizationOrCurrent.value[index - 1]?.route_point_type;
  const prevEnd = dataOptimizationOrCurrent.value[index + 1]?.route_point_type;

  if (
    prevStart === RoutePointType.START_POINT &&
    typeId === RoutePointType.MIDDLE_POINT
  ) {
    return t("gps.add_starting_point");
  } else if (
    prevEnd === RoutePointType.END_POINT &&
    typeId === RoutePointType.MIDDLE_POINT
  ) {
    return t("gps.add_end_point");
  }
};

const isShowFlagPoint = (typeId: number) => {
  return (
    typeId === RoutePointType.START_POINT || typeId === RoutePointType.END_POINT
  );
};

const isShowFlagPointChange = (typeId: number, index: number) => {
  const prev = dataOptimizationOrCurrent.value[index - 1]?.route_point_type;
  const next = dataOptimizationOrCurrent.value[index + 1]?.route_point_type;
  const isEdge =
    index === 0 || index === dataOptimizationOrCurrent.value.length - 1;

  if (isEdge) return false;

  if (typeId === RoutePointType.START_POINT) {
    return (
      next === RoutePointType.MIDDLE_POINT || next === RoutePointType.END_POINT
    );
  }

  if (typeId === RoutePointType.END_POINT) {
    return (
      prev === RoutePointType.MIDDLE_POINT ||
      prev === RoutePointType.START_POINT
    );
  }

  return false;
};

const getFlagIconColor = (typeId: number) => {
  if (typeId === RoutePointType.START_POINT) {
    return "#28a745";
  }
  if (typeId === RoutePointType.END_POINT) {
    return "#dc3545";
  }
  return "#299B9B";
};

const isShowAddPoint = (typeId: number, index: number) => {
  const prevStart =
    dataOptimizationOrCurrent.value[index - 1]?.route_point_type;
  const prevEnd = dataOptimizationOrCurrent.value[index + 1]?.route_point_type;

  if (
    (prevStart === RoutePointType.START_POINT ||
      prevEnd === RoutePointType.END_POINT) &&
    typeId === RoutePointType.MIDDLE_POINT
  )
    return true;

  return false;
};

const getVisitReasonType = (type: number) => {
  return gpsStore.employeeVisitReasonType.items.find((p) => p.id === type);
};

const getBackgroundStyle = (card: SequenceExpeditorDataListModel) => {
  const { value: data } = dataOptimizationOrCurrent;
  const currentIndex = data.indexOf(card);
  const validData = data.slice(0, currentIndex + 1);

  let effectiveIndex = currentIndex;

  if (!card.location) {
    const lastLocationIndex = validData
      .map((item) => !!item.location)
      .lastIndexOf(true);
    if (validData.some((item) => !item.location)) {
      const locatedItems = validData.filter((p) => p.location);
      effectiveIndex = lastLocationIndex >= 0 ? locatedItems.length - 1 : 0;
    } else {
      effectiveIndex = lastLocationIndex;
    }
  } else if (validData.some((item) => !item.location)) {
    const locatedItems = data.filter((p) => p.location);
    effectiveIndex = locatedItems.indexOf(card);
  }

  const topColor =
    colorCodes[(effectiveIndex - (card.location ? 1 : 0)) % colorCodes.length];
  const bottomColor = colorCodes[effectiveIndex % colorCodes.length];

  const isLast = data.length === currentIndex + 1;
  const isFirst = effectiveIndex === 0;

  let background;
  if (isLast) {
    background = \`linear-gradient(to bottom, \${topColor} 0%, \${topColor} 50%, transparent 50%, transparent 100%)\`;
  } else if (isFirst) {
    background = \`linear-gradient(to bottom, transparent 0%, \${bottomColor} 0%, \${bottomColor} 50%, \${bottomColor} 100%)\`;
  } else {
    background = \`linear-gradient(to bottom, \${topColor} 0%, \${topColor} 50%, \${bottomColor} 50%, \${bottomColor} 100%)\`;
  }

  return { background };
};

const getPlaceTypeName = (typeId: number) => {
  return gpsStore.visitPlaceType.items.find((p) => p.id === typeId).name;
};

const middleRoutePointTypeChange = (typeId: number, index: number) => {
  if (isShowFlagPointChange(typeId, index)) {
    dataOptimizationOrCurrent.value[index].route_point_type =
      RoutePointType.MIDDLE_POINT;
    return;
  }

  if (typeId !== RoutePointType.MIDDLE_POINT) return;

  const prevType = dataOptimizationOrCurrent.value[index - 1]?.route_point_type;
  const nextType = dataOptimizationOrCurrent.value[index + 1]?.route_point_type;

  if (prevType === RoutePointType.START_POINT) {
    dataOptimizationOrCurrent.value[index].route_point_type =
      RoutePointType.START_POINT;
  } else if (nextType === RoutePointType.END_POINT) {
    dataOptimizationOrCurrent.value[index].route_point_type =
      RoutePointType.END_POINT;
  }
};

const outsidePoint = () => {
  openPoint.value = false;
};

const togglePoint = (index: number, type: number) => {
  const prevStart =
    dataOptimizationOrCurrent.value[index - 1]?.route_point_type;
  const prevEnd = dataOptimizationOrCurrent.value[index + 1]?.route_point_type;
  if (
    prevStart === RoutePointType.START_POINT &&
    prevEnd === RoutePointType.END_POINT &&
    type === RoutePointType.MIDDLE_POINT
  ) {
    openPoint.value = !openPoint.value;
  }
};

const isShowDropdownForPoint = (index: number, type: number) => {
  const data = dataOptimizationOrCurrent.value;
  return (
    type === RoutePointType.MIDDLE_POINT &&
    data[index - 1]?.route_point_type === RoutePointType.START_POINT &&
    data[index + 1]?.route_point_type === RoutePointType.END_POINT
  );
};

const changePoint = (typeId: number, index: number) => {
  dataOptimizationOrCurrent.value[index].route_point_type = typeId;
};
//hooks

const iconComponent = (typeId: number) => {
  switch (typeId) {
    case 1:
      return IconUser;
    case 2:
      return IconBox;
    case 3:
      return IconCash;
    case 4:
      return IconCar;
    case 5:
      return IconLocation;
    default:
      return null;
  }
};

const resolveIconProps = (typeId: number) => {
  switch (typeId) {
    case 1:
      return {
        size: 20,
        class: "text-[#525866]",
      };
    case 5:
      return {
        size: 20,
        class:
          "text-[#6DCECE] fill-transparent hover:text-[#05A9A9] hover:fill-[#05A9A9] transition-colors",
      };
    default:
      return {};
  }
};

const dataOptimizationOrCurrent = computed(() => {
  let visitExpeditorSequenceData = gpsStore.visitExpeditorSequenceData;

  if (placeType.value?.length) {
    visitExpeditorSequenceData = visitExpeditorSequenceData?.filter((item) =>
      placeType.value.some(
        ({ id, checked }) => id === item.visit_place_type && checked
      )
    );
  }
  return (draggableData.value = [...(visitExpeditorSequenceData || [])]);
});

watch(
  () => props.placeType,
  (newVal) => (placeType.value = newVal),
  { deep: true }
);

watchEffect(() => {
  draggableData.value = [...(gpsStore.visitExpeditorSequenceData || [])];
});

onMounted(async () => {
  await gpsStore.getDataVisitPlaceType();
  await gpsStore.getEmployeeVisitReasonType();
});
<\/script>

<style scoped lang="scss">
.gps-expeditor-cards {
  box-sizing: border-box;
  overflow-y: auto;
  height: calc(100vh - 170px);
  display: flex;
  flex-flow: column;
  position: relative;
  gap: 10px 0;
  padding: 5px 10px 5px 75px;

  .card-empty {
    font-size: 16px;
    font-family: "Inter", sans-serif;
    font-weight: 500;
    color: #424f4f;
    padding-right: 60px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-section {
    position: relative;

    .card-content {
      padding: 14px;
      z-index: 2;
      border-radius: 4px;
      position: relative;
      background-color: rgb(255, 255, 255);
      transition: 450ms cubic-bezier(0.23, 1, 0.32, 1);
      box-sizing: border-box;
      font-family: "Open Sans", sans-serif;
      -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
      box-shadow:
        rgba(0, 0, 0, 0.1) 0px 1px 1px,
        rgba(0, 0, 0, 0.1) 0px 1px 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .circle-for-card {
        min-width: 32px;
        height: 32px;
        position: absolute;
        border-radius: 150px;
        top: 50%;
        transform: translateY(-50%);
        left: -49px;
        border: 1px solid #299b9b;
        background: theme("colors.neutral.0");
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #424f4f;
        font-weight: 500;
        font-family: "Inter", sans-serif;
        padding: 0 6px;
        z-index: 11;
      }

      .flag-for-card {
        min-width: 32px;
        height: 32px;
        position: absolute;
        top: 55%;
        transform: translateY(-55%);
        left: -80px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: #424f4f;
        font-weight: 500;
        font-family: "Inter", sans-serif;
        padding: 0 6px;
        z-index: 11;

        .point-content {
          position: relative;

          .point-component {
            position: absolute;
            z-index: 190 !important;
            background: white;
            bottom: calc(100% + 8px);
            border: 1px solid #e1e4e4;
            border-radius: 8px 8px 8px 0;
            left: 0;

            .point-component-body {
              width: 100%;
              height: 100%;
              z-index: 101 !important;
              position: relative;

              .section {
                cursor: pointer;
                color: #424f4f;
                font-size: 13px;
                font-family: "Inter", sans-serif;
                font-weight: 400;
                padding: 6px;
                text-wrap: nowrap;
                text-align: start;
                border-bottom: 1px solid #e1e4e4;
              }

              .section:nth-child(3) {
                border-bottom: none !important;
              }

              .section:hover {
                background: #fafdfd;
              }

              .arr {
                width: 15px;
                height: 15px;
                position: absolute;
                left: 2px;
                bottom: -8.2px;
                z-index: -1;
                border-top: 1px solid #e1e4e4;
                border-left: 1px solid #e1e4e4;
                transform: rotate(225deg);
                background: white;
              }
            }
          }
        }
      }

      .card-gps-left {
        width: 85%;

        .section {
          font-family: "Inter", sans-serif;
          font-size: 13px;
          color: #8fa0a0;
          display: flex;
          align-items: center;
          font-weight: 400;
          gap: 0 6px;
        }

        .card-title,
        .card-title-location {
          font-weight: 600;
          font-size: 16px;
          font-family: "Inter", sans-serif;
          color: #424f4f;
          display: inline-block;
          gap: 8px;
        }

        .place-type {
          border: 1px solid #d2d7d7;
          border-radius: 8px;
          background: #fafdfd;
          padding: 4px;

          svg {
            width: 18px;
            height: 18px;

            path {
              fill: #299b9b;
            }
          }
        }

        .card-title-location:hover {
          color: #299b9b;
          cursor: pointer;
        }

        .reason-tags {
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          margin-top: 8px;
          gap: 8px;

          .visit-reason-tag {
            padding: 2px 4px;
            font-size: 12px;
            background: #fafdfd;
            width: fit-content;
            font-weight: 400;
            font-family: "Inter", sans-serif;
            border-radius: 8px;
          }
        }
      }
    }

    .card-content:before {
      top: 50%;
      left: -10px;
      content: "";
      position: absolute;
      width: 18px;
      height: 18px;
      background: white;
      border: 1px solid #e1e4e4;
      transform: translateY(-50%) rotate(45deg);
      border-top: none;
      border-right: none;
    }
  }

  .card-section:before {
    top: 0px;
    left: -35px;
    width: 4px;
    height: calc(100% + 12px);
    content: "";
    position: absolute;
    background: var(--route-color);
    border-radius: 12px;
  }

  .card-section:last-child:before {
    top: 0px;
    left: -35px;
    width: 4px;
    height: calc(100% - 24px);
    content: "";
    position: absolute;
    background: var(--route-color);
  }

  .card-section:nth-child(1):before {
    top: 40px;
    left: -35px;
    width: 4px;
    height: 100%;
    content: "";
    position: absolute;
    background: var(--route-color);
  }
}

::-webkit-scrollbar {
  width: 6px;
  height: 8px;
}

::-webkit-scrollbar-track {
  height: 8px;
  background: transparent;
  margin-top: 6px;
  margin-bottom: 0;
}

::-webkit-scrollbar-thumb {
  background: #299b9b;
  height: 8px;
}
</style>
`;export{n as default};
