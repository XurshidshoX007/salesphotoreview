const n=`<template>
  <flex-col class="page-gap">
    <page-title20
      v-if="locationHistoryData?.length > 0"
      :title="t('clients.coordinates')"
    />
    <div v-if="locationHistoryData">
      <div class="flex page-gap" v-if="locationHistoryData?.length > 0">
        <div
          class="flex justify-center items-center h-[495px] about-client"
          :class="
            locationHistoryData.length ? 'w-[80%] max-[767px]:w-full' : 'w-full'
          "
        >
          <YandexMapComponent
            :coordinate="[showingPosition?.lat, showingPosition?.lng]"
          />
        </div>
        <div v-if="locationHistoryData.length" class="settings-content-item">
          <div
            v-for="menu in clientLocationData"
            :key="menu"
            class="settings-sidebar"
            :class="{
              activeColor:
                isSelected.isActive && isSelected.date === menu?.for_date,
            }"
          >
            <div @click="onSelectLocation(menu?.for_date)">
              {{ getFormattedDate(menu?.for_date, "DD.MM.YYYY HH:mm") }}
            </div>
            <div
              v-if="isSelected.isActive && isSelected.date === menu?.for_date"
              class="active-arr"
            />
          </div>
        </div>
      </div>
      <div class="flex justify-center items-center py-10" v-else>
        <page-title20 :title="t('clients.location_point_not_included')" />
      </div>
    </div>
    <div v-else class="w-full flex justify-center items-center">
      <icon-loading :loading="true" :width="14" :height="14" />
    </div>
  </flex-col>
</template>

<script setup>
import { getFormattedDate } from "~/utils/formatters";
import { useI18n } from "vue-i18n";

// store
const clientsStore = useClientsStore("main");

// state
const { t } = useI18n();
const route = useRoute();
const clientId = ref(null);
const locationHistoryData = ref(null);
const showingPosition = ref(null);

const isSelected = ref({
  isActive: false,
  date: "",
});

// methods
const getClientLocationHistory = async () => {
  locationHistoryData.value = await clientsStore.getClientLocationHistory(
    clientId.value,
  );
};

const clientLocationData = computed(() => {
  return locationHistoryData.value?.sort(
    (a, b) => new Date(a.for_date) - new Date(b.for_date),
  );
});

onMounted(() => {
  clientId.value = route.params.id;
});

watchEffect(async () => {
  if (clientId.value) {
    await getClientLocationHistory();
    onSelectLocation();
  }
});

const getLocationByDate = (date) => {
  if (locationHistoryData.value && date) {
    return locationHistoryData.value.find(
      (locationData) => locationData.for_date === date,
    )?.lat_lng;
  }
};

function onSelectLocation(date = locationHistoryData.value[0]?.for_date) {
  isSelected.value.isActive = true;
  isSelected.value.date = date;

  const location = getLocationByDate(date);
  if (location) {
    showingPosition.value = {
      lat: location?.latitude,
      lng: location?.longitude,
    };
  }
}
<\/script>

<style lang="scss" scoped>
.settings-content-item {
  width: 20%;
  height: fit-content;
  border: 1px solid #e1e4e4;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background-color: #fafdfd;

  .settings-sidebar:hover {
    background: #299b9b0d;
  }

  .active-arr {
    position: absolute;
    top: 5px;
    right: 0;
    height: calc(100% - 10px);
    width: 5px;
    background-color: #299b9b;
    border-radius: 8px 0 0 8px;
  }
}

.about-client {
  .map-content {
    width: 100%;
    height: 100% !important;
  }
}

@media screen and (max-width: 767px) {
  .settings-content-item {
    display: none;
  }
}
</style>
`;export{n as default};
