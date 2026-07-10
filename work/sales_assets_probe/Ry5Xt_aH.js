const n=`<template>
  <div id="map" class="map-content"></div>
</template>

<script setup lang="ts">
// types
interface YMaps {
  Map: any;
  Placemark: any;
  ready: (callback: () => void) => void;
  geolocation: {
    get: (options: any) => Promise<any>;
  };
}

declare global {
  interface Window {
    ymaps: YMaps;
  }
}

// states
let mapInstance = null as Pick<YMaps, "Map"> | null;
let clickMarker = null as Pick<YMaps, "Placemark"> | null;
const { yandexMapApiKey: _yandexMapApiKey } = useRuntimeConfig().public;
const yandexMapApiKey = _yandexMapApiKey;

// props
const props = defineProps({
  coordinate: {
    type: Array as () => number[],
    default: () => [41.2825974, 69.2793667],
  },
  changeLocation: {
    type: Boolean,
    default: false,
  },
});

// emits
const emit = defineEmits(["changeMap"]);

// methods
const getDefaultCoordinates = () => {
  return [41.2825974, 69.2793667];
};

const loadYandexMaps = () => {
  return new Promise((resolve, reject) => {
    if (window.ymaps) {
      resolve(window.ymaps);
    } else {
      const script = document.createElement("script");
      script.src = \`https://api-maps.yandex.ru/2.1/?apikey=\${yandexMapApiKey}&lang=ru_RU\`;
      script.async = true;
      script.onload = () => resolve(window.ymaps);
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
};

const initMap = async () => {
  try {
    const ymaps = (await loadYandexMaps()) as YMaps;

    ymaps.ready(() => {
      mapInstance = new ymaps.Map("map", {
        center:
          props.coordinate && !isInvalidCoordinate(props.coordinate)
            ? props.coordinate
            : getDefaultCoordinates(),
        zoom: 9,
        controls: [
          "zoomControl",
          "searchControl",
          "typeSelector",
          "fullscreenControl",
          "trafficControl",
          "rulerControl",
          "geolocationControl",
        ],
      });

      if (isInvalidCoordinate(props.coordinate)) {
        ymaps.geolocation
          .get({
            provider: "browser",
            mapStateAutoApply: true,
          })
          .then((result) => {
            result.geoObjects.options.set("preset", "islands#blueCircleIcon");
            mapInstance.geoObjects.add(result.geoObjects);
            mapInstance.setCenter(
              result.geoObjects.get(0).geometry.getCoordinates()
            );
          })
          .catch((error) => {
            console.error("Geolocation failed:", error);
          });
      } else if (props.coordinate) {
        const clickMarker = new ymaps.Placemark(
          props.coordinate,
          {},
          {
            preset: "islands#icon",
            iconColor: "#299B9B",
          }
        );
        mapInstance.geoObjects.add(clickMarker);
      }

      if (props.changeLocation) {
        mapInstance.events.add("click", async (e) => {
          const coords = e.get("coords");
          emit("changeMap", coords);

          mapInstance.geoObjects.removeAll();
          const clickMarker = new ymaps.Placemark(
            coords,
            {},
            {
              preset: "islands#icon",
              iconColor: "#299B9B",
            }
          );
          mapInstance.geoObjects.add(clickMarker);
        });
      }
    });
  } catch (error) {
    console.error("Failed to load Yandex Maps:", error);
  }
};

const isInvalidCoordinate = (coordinate: number[]) => {
  return (
    Array.isArray(coordinate) &&
    coordinate.length === 2 &&
    (coordinate[0] === null ||
      coordinate[1] === null ||
      (coordinate[0] === null && coordinate[1] === null))
  );
};

// hooks
onMounted(async () => {
  await initMap();
});

watch(
  () => props.coordinate,
  async (newCoords) => {
    if (mapInstance) {
      mapInstance.geoObjects.removeAll();

      if (newCoords && !isInvalidCoordinate(newCoords)) {
        clickMarker = new window.ymaps.Placemark(
          newCoords,
          {},
          {
            preset: "islands#icon",
            iconColor: "#299B9B",
          }
        );

        mapInstance.geoObjects.add(clickMarker);
        mapInstance.setCenter(newCoords);
      }
    }
  }
);
<\/script>
`;export{n as default};
