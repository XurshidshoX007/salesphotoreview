const n=`<!-- ClientMarkerBalloon.vue -->
<template>
  <div class="maker-pop-up">
    <div
      class="absolute top-0 right-0 p-2.5 cursor-pointer"
      @click="closeBalloon"
    >
      <IconX color="#525866" />
    </div>
    <div v-if="isLoading" class="loader-container">
      <icon-loading :loading="isLoading" :width="12" :height="12" />
    </div>
    <template v-else>
      <div class="client-name">
        {{ infoData?.place_name }}
      </div>
      <div class="status-badge">
        <div
          class="circle"
          :style="\`background:\${infoData?.place_type?.hex_color || '#10b981'};\`"
        ></div>
        <div class="title">
          {{ infoData?.place_type?.name }}
        </div>
      </div>
      <div v-if="infoData?.phone" class="info-row border-t pt-3">
        <div class="label">Телефон:</div>
        <div class="value">{{ infoData.phone }}</div>
      </div>
      <div v-if="infoData?.place_name" class="info-row">
        <div class="label">Локация:</div>
        <div v-if="!infoData?.location" class="value">
          <div class="status-badge text-red-550">
            {{ t("not_available") }}
          </div>
        </div>
        <div v-else class="value">
          {{ infoData?.location?.latitude }},
          {{ infoData?.location?.longitude }}
        </div>
      </div>
      <div v-if="infoData?.territory" class="info-row">
        <div class="label">Территория:</div>
        <div class="value">{{ infoData.territory.name }}</div>
      </div>
      <button class="visit-location-btn" @click="handleVisitLocation">
        {{
          infoData?.location
            ? "Местоположение визита"
            : "Показать отчет по визиту"
        }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { VisitBaseDataModel } from "~/interfaces/api/gps/GPS-model";

// store
const gpsStore = useGPSStore("main");

// props
const props = defineProps<{
  visitId: string;
  closeBalloon: () => void;
}>();

// emit
const emit = defineEmits<{
  (e: "setOpenPhotoReport"): void;
}>();

// states
const { t } = useI18n();
const infoData = ref<VisitBaseDataModel>();
const isLoading = ref(true);

// computed
onMounted(async () => {
  await getData();
});

// methods
const handleVisitLocation = () => {
  emit("setOpenPhotoReport");
};

const getData = async () => {
  try {
    isLoading.value = true;
    const data = await gpsStore.getVisitBaseData(props.visitId);
    infoData.value = data;
  } catch (error) {
    console.error("Failed to load visit data:", error);
  } finally {
    isLoading.value = false;
  }
};

const closeBalloon = () => {
  props.closeBalloon();
};
<\/script>

<style lang="scss" scoped>
.maker-pop-up {
  width: 366px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: white;
  border-radius: 12px;

  .client-name {
    font-family: "Inter", sans-serif;
    font-size: 18px;
    font-weight: 600;
    line-height: 24px;
    color: theme("colors.neutral.950");
  }

  .status-badge {
    border: 1px solid theme("colors.neutral.200");
    border-radius: 6px;
    padding: 6px 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;

    .circle {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .title {
      font-weight: 500;
      font-size: 12px;
      line-height: 16px;
      white-space: nowrap;
      font-family: "Inter", sans-serif;
      color: theme("colors.neutral.950");
      text-transform: uppercase;
    }
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;

    .label {
      color: theme("colors.neutral.600");
      font-size: 14px;
      line-height: 20px;
      font-family: "Inter", sans-serif;
      font-weight: 400;
      white-space: nowrap;
    }

    .value {
      color: theme("colors.neutral.950");
      font-size: 14px;
      line-height: 20px;
      font-family: "Inter", sans-serif;
      font-weight: 500;
      text-align: right;
      flex: 1;
      word-break: break-word;
    }
  }

  .visit-location-btn {
    width: 100%;
    background: theme("colors.primary.250");
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 16px;
    font-family: "Inter", sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background: theme("colors.teal.700");
    }

    &:active {
      background: theme("colors.teal.800");
    }
  }

  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    min-height: 150px;
  }
}
</style>
`;export{n as default};
