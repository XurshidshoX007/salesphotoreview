const n=`<template>
  <d-modal
    :dataContainerWidth="'625px'"
    :name="t('location_map')"
    @closeDialog="onCloseDialog"
  >
    <template #header-button>
      <div class="dropdown-maps rounded-lg">
        {{ t("clients.show_the_map") }}
        <div class="child">
          <div class="child-content rounded-lg">
            <div @click="generationGoogle" class="section rounded-lg">
              Google
            </div>
            <div @click="generationsYandex" class="section rounded-lg">
              Yandex
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-if="position" class="w-full relative">
      <YandexMapComponent
        :coordinate="[position.lat, position.lng]"
        class="w-full h-[300px]"
      />
    </div>
    <div v-else>{{ t("clients.client_no_location") }}</div>
    <template #footer>
      <div v-show="position" class="flex justify-between items-center">
        <m-btn @click="onShareLocation">{{ t("clients.share") }}</m-btn>
        <m-btn group="outlined" @click="onCloseDialog">{{
          t("clients.cancel")
        }}</m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup>
// props
import { useI18n } from "vue-i18n";

const props = defineProps({
  location: Object,
});

// emits
const emit = defineEmits(["closeDialog"]);
const { t } = useI18n();
// methods
const position = computed(() => {
  if (props.location && Object.keys(props.location).length > 0) {
    return { lat: props.location?.latitude, lng: props.location?.longitude };
  } else {
    return false;
  }
});

const onShareLocation = () => {
  const locationUrl = \`https://www.google.com/maps/search/?api=1&query=\${props.location?.latitude},\${props.location?.longitude}\`;
  const url = \`https://t.me/share/url?url=\${encodeURIComponent(locationUrl)}\`;
  window.open(url);
};

const onCloseDialog = () => {
  emit("closeDialog");
};
const generationsYandex = () => {
  const yandexMapsUrl = \`https://yandex.com/maps/?pt=\${props.location?.longitude},\${props.location?.latitude}&z=15\`;
  window.open(yandexMapsUrl, "_blank");
};
const generationGoogle = () => {
  const googleMapsUrl = \`https://www.google.com/maps/search/?api=1&query=\${props.location?.latitude},\${props.location?.longitude}\`;
  window.open(googleMapsUrl, "_blank");
};
<\/script>
<style lang="scss" scoped>
.dropdown-maps {
  font-size: 14px;
  background: #299b9b;
  color: white;
  padding: 8px 15px;
  z-index: 111;
  cursor: pointer;

  .child {
    width: 100%;
    display: none;
    position: relative;

    .child-content {
      width: calc(100% + 30px);
      position: absolute;
      top: 8px;
      left: -15px;

      background: white;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.175);

      .section {
        padding: 5px 15px;
        width: 100%;
        font-size: 13px;
        font-family: "Inter", sans-serif;
        color: #299b9b;
      }

      .section:hover {
        background: #f6f6f6;
      }
    }
  }
}

.dropdown-maps:hover {
  .child {
    display: block;
  }
}
</style>
`;export{n as default};
