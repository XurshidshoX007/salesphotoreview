const n=`<template>
  <flex-col class="gap-3 relative">
    <div class="cards" :class="gpsStore.isGetSequenceLoading && 'opacity-50'">
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
            <div
              class="truncate"
              :class="card.lat_lng ? 'card-title-location' : 'card-title'"
              :title="card?.name"
              @click="setClientLocation(card)"
            >
              {{ card?.name }}
            </div>
            <icon-menu-control-icon class="cursor-pointer" />

            <div class="circle-for-card">
              {{ card.visit_sequence_number }}
            </div>
          </div>
        </div>
      </VueDraggable>
      <div v-if="dataOptimizationOrCurrent?.length === 0" class="card-empty">
        {{ t("empty") }}
      </div>
    </div>
    <div
      v-show="gpsStore.isGetSequenceLoading"
      class="absolute top-[50%] left-[50%]"
    >
      <icon-loading :loading="true" :width="14" :height="14" />
    </div>
  </flex-col>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { SequenceDataListModel } from "~/interfaces/api/gps/GPS-model";
import { VueDraggable } from "vue-draggable-plus";
import { colorCodes } from "~/variable/map-route-colors";

// emits
const emit = defineEmits(["setClientLocation"]);

// props
const props = defineProps<{
  weekDay: {
    name: string;
    id: number;
    type: number;
  };
  mapActionId: string;
}>();

// store

const gpsStore = useGPSStore("main");

// state

const { t } = useI18n();

const draggableData = ref([]);

//methods

const setClientLocation = (data: SequenceDataListModel) => {
  if (!data.lat_lng) return;
  emit("setClientLocation", data?.lat_lng, data);
};

const updateSequenceNumbers = (data) => {
  return data.map((item, index) => {
    if (item.visit_sequence_number !== null) {
      // Explicit check for visit_sequence_number
      item.visit_sequence_number = index + 1;
    }
    return item;
  });
};

const changeDragEndDrop = () => {
  const updatedData = [...draggableData.value]; // Clone data once
  if (props.mapActionId === "current_route") {
    gpsStore.visitSequenceData = updateSequenceNumbers(updatedData);
  } else {
    const { type } = props.weekDay;
    gpsStore.visitSequenceOptimizationData[type] =
      updateSequenceNumbers(updatedData);
  }
};

const getBackgroundStyle = (card: SequenceDataListModel) => {
  const { value: data } = dataOptimizationOrCurrent;
  const currentIndex = data.indexOf(card);
  const validData = data.slice(0, currentIndex + 1);

  let effectiveIndex = currentIndex;

  if (!card.lat_lng) {
    const lastLocationIndex = validData
      .map((item) => !!item.lat_lng)
      .lastIndexOf(true);
    if (validData.some((item) => !item.lat_lng)) {
      const locatedItems = validData.filter((p) => p.lat_lng);
      effectiveIndex = lastLocationIndex >= 0 ? locatedItems.length - 1 : 0;
    } else {
      effectiveIndex = lastLocationIndex;
    }
  } else if (validData.some((item) => !item.lat_lng)) {
    const locatedItems = data.filter((p) => p.lat_lng);
    effectiveIndex = locatedItems.indexOf(card);
  }

  const topColor =
    colorCodes[(effectiveIndex - (card.lat_lng ? 1 : 0)) % colorCodes.length];
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

//hooks

const dataOptimizationOrCurrent = computed(() => {
  if (props.mapActionId === "current_route") {
    return gpsStore.visitSequenceData || [];
  }
  return gpsStore.visitSequenceOptimizationData[props.weekDay.type] || [];
});

watchEffect(() => {
  if (props.mapActionId === "current_route") {
    draggableData.value = [...(gpsStore.visitSequenceData || [])];
  } else {
    draggableData.value = [
      ...(gpsStore.visitSequenceOptimizationData[props.weekDay.type] || []),
    ];
  }
});
<\/script>

<style scoped lang="scss">
.cards {
  box-sizing: border-box;
  overflow-y: auto;
  height: calc(100vh - 177px);
  display: flex;
  flex-flow: column;
  position: relative;
  gap: 10px 0;
  padding: 5px 10px 5px 70px;

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

      .card-title,
      .card-title-location {
        font-weight: 600;
        font-size: 16px;
        font-family: "Inter", sans-serif;
        color: #424f4f;
        display: inline-block;
        width: 90%;
      }

      .card-title-location:hover {
        color: #299b9b;
        cursor: pointer;
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
    height: calc(100% - 12px);
    content: "";
    position: absolute;
    background: var(--route-color);
  }
  .card-section:nth-child(1):before {
    top: 12px;
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
