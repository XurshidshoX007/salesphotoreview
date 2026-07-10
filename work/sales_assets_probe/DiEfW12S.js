const n=`<template>
  <div id="map2" class="map-content"></div>
</template>

<script setup lang="ts">
import { getOpenedItemsByKey } from "~/utils/local-storage";
import type { EmployeeDataModel } from "~/interfaces/api/gps/GPS-model";
import { useI18n } from "vue-i18n";
import IconAvatarSvg from "~/assets/svg/Avatar.svg?url";

// store

const gpsStore = useGPSStore("main");

// states
const { t } = useI18n();

let mapInstance = null;

let clusterer = null;

let mapReadyPromise: Promise<void> | null = null;

const isShowMenu = ref<boolean>(getOpenedItemsByKey("gps-menu") ?? true);

const { yandexMapApiKey } = useRuntimeConfig().public;
// yandex-maps

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

const initMap = async (): Promise<void> => {
  if (mapReadyPromise) return mapReadyPromise;

  mapReadyPromise = new Promise(async (resolve, reject) => {
    try {
      const ymaps = await loadYandexMaps();

      ymaps.ready(() => {
        mapInstance = new ymaps.Map("map2", {
          center: [41.2825974, 69.2793667],
          zoom: 9,
          controls: ["zoomControl", "typeSelector"],
        });

        clusterer = new ymaps.Clusterer({
          preset: "islands#invertedVioletClusterIcons",
          groupByCoordinates: false,
          clusterDisableClickZoom: false,
          clusterOpenBalloonOnClick: true,
        });

        mapInstance.geoObjects.add(clusterer);

        // Search control setup...
        const searchControl = mapInstance.controls.get("searchControl");
        if (searchControl) {
          searchControl.options.set({
            size: "large",
            noPlacemark: true,
          });

          searchControl.events.add("resultselect", async (e) => {
            const index = e.get("index");
            const result = await searchControl.getResult(index);
            const coordinates = result.geometry.getCoordinates();
            mapInstance?.setCenter(coordinates, 14, {
              checkZoomRange: true,
            });

            const searchMarker = new ymaps.Placemark(
              coordinates,
              {
                hintContent: result.properties.get("name"),
                balloonContent: result.properties.get("description"),
              },
              {
                iconLayout: "default#image",
                iconImageHref: IconAvatarSvg,
                iconColor: "#1E90FF",
              }
            );
            mapInstance?.geoObjects.add(searchMarker);
          });
        }

        resolve();
      });
    } catch (error) {
      console.error("Failed to load Yandex Maps:", error);
      reject(error);
    }
  });

  return mapReadyPromise;
};

// If the seat is occupied, next attempt
const offsetCoord = ([lat, lng], attempt, coordsSet) => {
  const radius = 0.0002 * Math.sqrt(attempt);
  const angle = attempt * 137.508 * (Math.PI / 180);
  const adjustedCoords = [
    lat + radius * Math.cos(angle),
    lng + radius * Math.sin(angle),
  ];

  const key = \`\${adjustedCoords[0].toFixed(6)},\${adjustedCoords[1].toFixed(6)}\`;
  if (!coordsSet.has(key)) {
    coordsSet.add(key);
    return adjustedCoords;
  }

  return offsetCoord([lat, lng], attempt + 1, coordsSet);
};

const getAdjustedCoords = (coords, index, coordsSet) => {
  const [lat, lng] = coords;

  if (lat == null || lng == null) return null;

  const key = \`\${lat.toFixed(4)},\${lng.toFixed(4)}\`;
  if (coordsSet.has(key)) {
    return offsetCoord([lat, lng], index, coordsSet);
  }

  coordsSet.add(key);
  return [lat, lng];
};

const AVATAR_SVG = \`<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 16C0 7.16344 7.16344 0 16 0C24.8366 0 32 7.16344 32 16C32 24.8366 24.8366 32 16 32C7.16344 32 0 24.8366 0 16Z" fill="#87D2D2"/><g clip-path="url(#clip0_avatar)"><ellipse cx="16" cy="31.2" rx="12.8" ry="9.6" fill="white" fill-opacity="0.72"/><circle opacity="0.9" cx="16" cy="12.8" r="6.4" fill="white"/></g><defs><clipPath id="clip0_avatar"><rect width="32" height="32" rx="16" fill="white"/></clipPath></defs></svg>\`;

const WIFI_SVG = \`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10.0001 6.11133C9.48441 6.11133 8.98983 6.31619 8.62518 6.68084C8.26052 7.0455 8.05566 7.54007 8.05566 8.05577V15.8336C8.05566 16.3492 8.26052 16.8438 8.62518 17.2085C8.98983 17.5731 9.48441 17.778 10.0001 17.778C10.5158 17.778 11.0104 17.5731 11.375 17.2085C11.7397 16.8438 11.9446 16.3492 11.9446 15.8336V8.05577C11.9446 7.54007 11.7397 7.0455 11.375 6.68084C11.0104 6.31619 10.5158 6.11133 10.0001 6.11133Z" fill="#05A9A9"/><path d="M15.8331 2.22217C15.3174 2.22217 14.8228 2.42703 14.4582 2.79168C14.0935 3.15634 13.8887 3.65091 13.8887 4.16661V15.8333C13.8887 16.349 14.0935 16.8436 14.4582 17.2082C14.8228 17.5729 15.3174 17.7777 15.8331 17.7777C16.3488 17.7777 16.8434 17.5729 17.208 17.2082C17.5727 16.8436 17.7776 16.349 17.7776 15.8333V4.16661C17.7776 3.65091 17.5727 3.15634 17.208 2.79168C16.8434 2.42703 16.3488 2.22217 15.8331 2.22217Z" fill="#05A9A9"/><path d="M4.16661 10C3.65091 10 3.15634 10.2049 2.79168 10.5695C2.42703 10.9342 2.22217 11.4287 2.22217 11.9444L2.22217 15.8333C2.22217 16.349 2.42703 16.8436 2.79168 17.2083C3.15634 17.5729 3.65091 17.7778 4.16661 17.7778C4.68231 17.7778 5.17689 17.5729 5.54154 17.2083C5.9062 16.8436 6.11106 16.349 6.11106 15.8333V11.9444C6.11106 11.4287 5.9062 10.9342 5.54154 10.5695C5.17689 10.2049 4.68231 10 4.16661 10Z" fill="#05A9A9"/></svg>\`;

const CHARGE_SVG = \`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.875 12.7778H4.375C4.07663 12.7778 3.79048 12.6607 3.5795 12.4523C3.36853 12.244 3.25 11.9614 3.25 11.6667V8.33333C3.25 8.03865 3.36853 7.75603 3.5795 7.54766C3.79048 7.33929 4.07663 7.22222 4.375 7.22222H8.875C9.17337 7.22222 9.45952 7.33929 9.6705 7.54766C9.88147 7.75603 10 8.03865 10 8.33333V11.6667C10 11.9614 9.88147 12.244 9.6705 12.4523C9.45952 12.6607 9.17337 12.7778 8.875 12.7778ZM16.75 13.3333V12.7778H17.3125C17.7601 12.7778 18.1893 12.6022 18.5057 12.2896C18.8222 11.9771 19 11.5531 19 11.1111V8.88889C19 8.44686 18.8222 8.02294 18.5057 7.71038C18.1893 7.39782 17.7601 7.22222 17.3125 7.22222H16.75V6.66667C16.75 6.22464 16.5722 5.80072 16.2557 5.48816C15.9393 5.17559 15.5101 5 15.0625 5H2.6875C2.23995 5 1.81073 5.17559 1.49426 5.48816C1.17779 5.80072 1 6.22464 1 6.66667V13.3333C1 13.7754 1.17779 14.1993 1.49426 14.5118C1.81073 14.8244 2.23995 15 2.6875 15H15.0625C15.5101 15 15.9393 14.8244 16.2557 14.5118C16.5722 14.1993 16.75 13.7754 16.75 13.3333ZM15.0625 6.11111C15.2117 6.11111 15.3548 6.16964 15.4602 6.27383C15.5657 6.37802 15.625 6.51932 15.625 6.66667V7.77778C15.625 7.92512 15.6843 8.06643 15.7898 8.17061C15.8952 8.2748 16.0383 8.33333 16.1875 8.33333H17.3125C17.4617 8.33333 17.6048 8.39187 17.7102 8.49605C17.8157 8.60024 17.875 8.74155 17.875 8.88889V11.1111C17.875 11.2585 17.8157 11.3998 17.7102 11.5039C17.6048 11.6081 17.4617 11.6667 17.3125 11.6667H16.1875C16.0383 11.6667 15.8952 11.7252 15.7898 11.8294C15.6843 11.9336 15.625 12.0749 15.625 12.2222V13.3333C15.625 13.4807 15.5657 13.622 15.4602 13.7262C15.3548 13.8304 15.2117 13.8889 15.0625 13.8889H2.6875C2.53832 13.8889 2.39524 13.8304 2.28975 13.7262C2.18426 13.622 2.125 13.4807 2.125 13.3333V6.66667C2.125 6.51932 2.18426 6.37802 2.28975 6.27383C2.39524 6.16964 2.53832 6.11111 2.6875 6.11111H15.0625Z" fill="#05A9A9"/></svg>\`

const createBalloonContent = (client: EmployeeDataModel): string => {
  const name = client?.employee?.name || "-";
  const charge = client?.location_data?.charge;
  const accuracy = client?.location_data?.accuracy;
  const networkType = client?.location_data?.network_type || "";

  return \`
    <div class="gps-balloon">
      <div class="gps-balloon-header">
        <div class="gps-balloon-avatar">\${AVATAR_SVG}</div>
        <div class="gps-balloon-name">\${name}</div>
      </div>
      <div class="gps-balloon-details">
        \${charge != null ? \`<div class="gps-balloon-row"><span class="gps-balloon-label">\${t("column.battery")}:</span> <span class="gps-balloon-value">\${CHARGE_SVG} \${charge}%</span></div>\` : ""}
        \${networkType ? \`<div class="gps-balloon-row"><span class="gps-balloon-label">\${t("gps.internet")}:</span> <span class="gps-balloon-value">\${WIFI_SVG} \${networkType}</span></div>\` : ""}
        <div class="gps-balloon-row"><span class="gps-balloon-label">\${t("gps.accuracy")}:</span> <span class="gps-balloon-value">\${accuracy ?? ""}</span></div>
      </div>
    </div>
  \`;
};

const updateMarkers = async (clients: EmployeeDataModel[]) => {
  if (!mapInstance || !clusterer) {
    await initMap();
  }

  if (!mapInstance || !clusterer) {
    return;
  }
  clusterer.removeAll();

  const coordsSet = new Set<string>();

  const markers = clients
    .map((client, index) => {
      const { latitude, longitude } = client?.location_data?.lat_lng || {};
      if (latitude == null || longitude == null) return null;

      const adjustedCoords = getAdjustedCoords(
        [latitude, longitude],
        index,
        coordsSet
      );

      // Create custom layout for the marker
      const CustomLayout = ymaps.templateLayoutFactory.createClass(
        \`<div class="custom-marker">
          <div class="marker-avatar">
            <img src="\${IconAvatarSvg}" alt="avatar" />
          </div>
          <div class="marker-name">{{ properties.iconContent }}</div>
        </div>\`,
        {
          getShape() {
            return new ymaps.shape.Rectangle(new ymaps.geometry.pixel.Rectangle([[0, 0], [150, 30]]));
          }
        }
      );

      const marker = new ymaps.Placemark(
        adjustedCoords,
        {
          iconContent: client.employee?.name || "-",
          balloonContent: createBalloonContent(client),
        },
        {
          iconLayout: CustomLayout,
          iconShape: {
            type: "Circle",
            coordinates: [0, 0],
            radius: 30,
          },
          hideIconOnBalloonOpen: false,
        }
      );

      return marker;
    })
    .filter(Boolean);

  clusterer.add(markers);

  if (markers.length > 0) {
    const bounds = markers.map((marker) => marker.geometry.getCoordinates());
    const minLat = Math.min(...bounds.map((coord) => coord[0]));
    const maxLat = Math.max(...bounds.map((coord) => coord[0]));
    const minLng = Math.min(...bounds.map((coord) => coord[1]));
    const maxLng = Math.max(...bounds.map((coord) => coord[1]));

    mapInstance.setBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      {
        checkZoomRange: true,
        zoomMargin: 50,
        duration: 1000,
      }
    );
  }
};

// methods

const handleMenuChange = () => {
  isShowMenu.value = !isShowMenu.value;
  menuOpenClose();
};

const setLocationEmployee = (employee: EmployeeDataModel) => {
  if (employee?.location_data?.lat_lng) {
    if (!mapInstance) return;

    mapInstance
      .panTo(
        [
          employee?.location_data?.lat_lng.latitude,
          employee?.location_data?.lat_lng.longitude,
        ],
        {
          duration: 1000,
          flying: true,
        }
      )
      .then(() => {
        mapInstance.setZoom(14);
      });
  }
};

const menuOpenClose = async () => {
  const menuContentDiv = document.querySelector(".map-content");
  const yMapsDiv = document.querySelector("#map2");
  let width;

  if (window.innerWidth > 576) {
    width = "calc(100% - 440px)";
  } else {
    width = "calc(100% - 220px)";
  }

  // Apply transitions first
  menuContentDiv.style.transition = "width 0.3s ease-in-out";
  yMapsDiv.style.transition = "width 0.3s ease-in-out";

  if (isShowMenu.value) {
    menuContentDiv.style.width = width;
    yMapsDiv.style.width = width;
  } else {
    menuContentDiv.style.width = "100%";
    yMapsDiv.style.width = "100%";
  }

  setTimeout(() => {
    if (mapInstance) {
      mapInstance.container.fitToViewport();
    }
  }, 300);

  setOpenedItemsToLocalByKey("gps-menu", isShowMenu.value);
};

const resizeObserver = new ResizeObserver((entries) => {
  if (mapInstance) {
    mapInstance.container.fitToViewport();
  }
});

// hooks

onMounted(async () => {
  await initMap();
  const mapContainer = document.querySelector("#map2");
  if (mapContainer) {
    resizeObserver.observe(mapContainer);
  }
  if (isShowMenu.value) {
    await menuOpenClose();
  }
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();

  // Clear all markers and map objects
  if (clusterer) {
    clusterer.removeAll();
  }

  // Remove all geoObjects from the map
  if (mapInstance?.geoObjects) {
    mapInstance.geoObjects.removeAll();
  }

  // Destroy the map instance
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = null;
  }

  clusterer = null;
  mapReadyPromise = null;
});

watch(
  () => gpsStore.employeeData,
  async (newVal, oldVal) => {
    await updateMarkers(newVal);
  }
);

// define expose
defineExpose({
  menuOpenClose,
  handleMenuChange,
  setLocationEmployee,
});
<\/script>

<style lang="scss">
.map-content {
  width: 100%;
  height: calc(100vh - 90px);
  position: relative;
  overflow: hidden;

  #map2 {
    width: 100% !important;
    height: 100% !important;
    position: absolute !important;
    top: 0;
    left: 0;
    transition: width 0.3s ease-in-out;
  }

  .ymaps-2-1-79-map {
    width: 100% !important;
    height: 100% !important;

    .ymaps-2-1-79-controls__control_toolbar {
      position: absolute !important;
      left: 15px !important;
    }

    .ymaps-2-1-79-listbox_align_right .ymaps-2-1-79-listbox__panel {
      float: left !important;
    }
  }
}

.custom-marker {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.marker-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 2;
  position: relative;
  border: 3px solid #fff;
  background: rgba(255, 255, 255, 1);
  box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.1);

  &::after {
    content: "";
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: -10px;
    width: 0;
    height: 0;
    border-left: 16px solid transparent;
    border-right: 16px solid transparent;
    border-top: 16px solid white;
    z-index: -1;
  }

  img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
  }
}

.marker-name {
  position: relative;
  background: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin-left: -16px;
  padding-left: 16px;
  max-width: 220px;
  z-index: 1;
  text-align: end;
  box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.1);
}

.gps-balloon {
  font-family: "Inter", sans-serif;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  .gps-balloon-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e5e7eb;
  }

  .gps-balloon-avatar {
    flex-shrink: 0;

    svg {
      width: 32px;
      height: 32px;
    }
  }

  .gps-balloon-name {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
  }

  .gps-balloon-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gps-balloon-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    color: #1a1a2e;
  }

  .gps-balloon-value {
    display: inline-flex;
    align-items: center;
    gap: 4px;

    svg {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }
  }

  .gps-balloon-label {
    font-weight: 400;
    color: #525866;
  }
}

[class*="ymaps"][class*="balloon__layout"] {
  border-radius: 16px !important;
  overflow: hidden;
  border: none !important;
  outline: none !important;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12) !important;
}

[class*="ymaps"][class*="balloon__content"] {
  padding: 12px !important;
  margin: 0 !important;
  border: none !important;
}

[class*="ymaps"][class*="balloon_layout_panel"] {
  border: none !important;
  background: white !important;
  border-radius: 16px !important;
}

.ymaps-2-1-79-balloon {
  box-shadow: none !important;
}

.ymaps-2-1-79-balloon__tail {
  left: 62px !important;
}
</style>
`;export{n as default};
