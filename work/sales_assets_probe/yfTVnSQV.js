const n=`<template>
  <div id="map2" class="map-content"></div>
</template>

<script setup lang="ts">
import { getOpenedItemsByKey } from "~/utils/local-storage";
import type {
  DetailVisitsModel,
  SequenceDataListModel,
  SequenceExpeditorDataListModel,
} from "~/interfaces/api/gps/GPS-model";
import { colorCodes } from "~/variable/map-route-colors";

// store

const gpsStore = useGPSStore("main");

// states
let mapInstance = null;

let clusterer = null;

let mapReadyPromise: Promise<void> | null = null;

const routeCache = new Map<string, any>();

const isMapClickEventAdded = ref<boolean>(false);

const isHasGpsUpdated = ref<boolean>(true);

const isShowMenu = ref<boolean>(
  getOpenedItemsByKey("gps-menu-optimization-route") ?? true,
);

const { yandexMapApiKey } = useRuntimeConfig().public;

let visitMarkers: ymaps.Placemark[] = [];
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
                preset: "islands#icon",
                iconColor: "#1E90FF",
              },
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

const createIconLayout = (borderColor: string) => {
  return ymaps.templateLayoutFactory.createClass(\`
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 35px;
      min-height: 35px;
      padding: 4px 8px;
      font-size: 13px;
      font-weight: 500;
      border: 4px solid \${borderColor};
      color: black;
      background: white;
      border-radius: 20px;
      white-space: nowrap;
    ">
      $[properties.iconContent]
    </div>
  \`);
};

const updateMarkers = async (
  clients: SequenceExpeditorDataListModel[],
  selectedMarkerIndex?: number,
) => {
  if (!mapInstance) {
    await initMap();
    if (!mapInstance) return;
  }
  visitMarkers = [];

  if (!isMapClickEventAdded.value) {
    mapInstance.events.add("click", (e: any) => {
      const target = e.get("target");

      if (target === mapInstance && !isHasGpsUpdated.value) {
        gpsUpdateFunction(true);
        isHasGpsUpdated.value = true;
      }
    });
    isMapClickEventAdded.value = true;
  }

  mapInstance.geoObjects.removeAll();

  const MIN_DISTANCE = 0.00001;
  const coordsSet = new Set<string>();

  const isValidCoordinate = ({
    latitude,
    longitude,
  }: {
    latitude: number;
    longitude: number;
  }) =>
    latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;

  const getAdjustedCoords = (() => {
    const goldenAngle = 137.5 * (Math.PI / 180);
    return ([lat, lng]: [number, number], index: number): [number, number] => {
      const key = \`\${lat.toFixed(6)},\${lng.toFixed(6)}\`;
      if (!coordsSet.has(key)) {
        coordsSet.add(key);
        return [lat, lng];
      }

      let attempt = index;
      while (true) {
        const radius = MIN_DISTANCE * Math.sqrt(attempt);
        const angle = attempt * goldenAngle;
        const adjusted: [number, number] = [
          lat + radius * Math.cos(angle),
          lng + radius * Math.sin(angle),
        ];

        const adjustedKey = \`\${adjusted[0].toFixed(6)},\${adjusted[1].toFixed(6)}\`;
        if (!coordsSet.has(adjustedKey)) {
          coordsSet.add(adjustedKey);
          return adjusted;
        }
        attempt++;
      }
    };
  })();
  const createMarker = (
    coords: [number, number],
    client: SequenceDataListModel,
    index: number,
    onClick: (index: number) => void,
  ) => {
    const marker = new ymaps.Placemark(
      coords,
      {
        iconContent: client?.visit_sequence_number,
        hintContent: client.name,
      },
      {
        iconLayout: "default#imageWithContent",
        iconImageHref:
          "https://yastatic.net/s3/mapsapi-jslibs/2.1/icons/placemark-circle.png",
        iconImageSize: [40, 40],
        iconImageOffset: [-20, -20],
        iconContentOffset: [0, 0],
        iconContentLayout: createIconLayout("#299B9B"),
      },
    );
    visitMarkers.push(marker);
    marker.events.add("click", () => onClick(index));
    return marker;
  };

  const validClients = clients.filter(
    (client) => client?.location && isValidCoordinate(client.location),
  );

  const coordinates: [number, number][] = [];
  const markers: ymaps.Placemark[] = [];

  validClients.map((client, index) => {
    const { latitude, longitude } = client.location;
    const visitMarkerIndex = clients.findIndex(
      (item) => item.visit_place_id === client.visit_place_id,
    );
    const adjustedCoords = getAdjustedCoords([latitude, longitude], index);

    coordinates.push(adjustedCoords);
    clients[visitMarkerIndex]["coordinate"] = adjustedCoords;

    const marker = createMarker(
      adjustedCoords,
      client,
      index,
      (clickedIndex) => {
        updateMarkers(clients, clickedIndex);
        return;
      },
    );

    markers.push(marker);
    mapInstance.geoObjects.add(marker);
  });

  if (selectedMarkerIndex !== undefined && coordinates.length > 1) {
    markers[selectedMarkerIndex].options.set({
      iconLayout: "default#imageWithContent",
      iconImageHref:
        "https://yastatic.net/s3/mapsapi-jslibs/2.1/icons/placemark-circle.png",
      iconImageSize: [40, 40],
      iconImageOffset: [-20, -20],
      iconContentOffset: [0, 0],
      iconContentLayout: createIconLayout("#bd8904"),
    });

    if (selectedMarkerIndex > 0) {
      await getRouteByOSRM(
        coordinates[selectedMarkerIndex - 1],
        coordinates[selectedMarkerIndex],
        selectedMarkerIndex - 1,
        "dash",
      );

      markers[selectedMarkerIndex - 1].options.set({
        iconLayout: "default#imageWithContent",
        iconImageHref:
          "https://yastatic.net/s3/mapsapi-jslibs/2.1/icons/placemark-circle.png",
        iconImageSize: [40, 40],
        iconImageOffset: [-20, -20],
        iconContentOffset: [0, 0],
        iconContentLayout: createIconLayout("#FF0000"),
      });
    }

    if (selectedMarkerIndex < coordinates.length - 1) {
      await getRouteByOSRM(
        coordinates[selectedMarkerIndex],
        coordinates[selectedMarkerIndex + 1],
        selectedMarkerIndex,
        "dash",
      );

      markers[selectedMarkerIndex + 1].options.set({
        iconLayout: "default#imageWithContent",
        iconImageHref:
          "https://yastatic.net/s3/mapsapi-jslibs/2.1/icons/placemark-circle.png",
        iconImageSize: [40, 40],
        iconImageOffset: [-20, -20],
        iconContentOffset: [0, 0],
        iconContentLayout: createIconLayout("#04bd13"),
      });
    }
  }
};

const getRouteByOSRM = async (
  startLocation: number[],
  endLocation: number[],
  strokeIndex: number,
  strokeStyle: string,
) => {
  const cacheKey = \`\${startLocation.join(",")}|\${endLocation.join(",")}\`;

  const strokeColor = getStrokeColor(strokeIndex);

  isHasGpsUpdated.value = false;

  if (routeCache.has(cacheKey)) {
    const cachedResponse = routeCache.get(cacheKey);
    await drawOSRMRoute(cachedResponse, strokeColor, strokeStyle);
    return;
  }

  const queryForRoute = { overview: "full" };
  const catchAll = \`\${startLocation[1]},\${startLocation[0]};\${endLocation[1]},\${endLocation[0]}?\${params2query(queryForRoute)}\`;
  if (startLocation.length === 0 || endLocation.length === 0) return;
  const response = await gpsStore.getRouteByOSRM(catchAll);

  routeCache.set(cacheKey, response.data);
  await drawOSRMRoute(response.data, strokeColor, strokeStyle);
};

const drawOSRMRoute = async (
  osrmResponse: any,
  strokeColor: string,
  strokeStyle: string,
) => {
  if (!mapInstance) {
    await initMap();
    if (!mapInstance) return;
  }

  const geometry = osrmResponse.routes[0].geometry;
  const decodedCoords = decodePolyline(geometry);
  const routeLine = new ymaps.Polyline(
    decodedCoords,
    {},
    {
      strokeColor: strokeColor,
      strokeWidth: 3,
      strokeOpacity: 0.7,
      strokeStyle: strokeStyle,
    },
  );
  mapInstance.geoObjects.add(routeLine);
};

const decodePolyline = (encoded: string) => {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let b,
      shift = 0,
      result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates.map((coord) => [coord[0], coord[1]]);
};

const setClientLocation = async (
  location: { latitude: number; longitude: number },
  data: DetailVisitsModel,
) => {
  if (!mapInstance || !location) return;

  await mapInstance.panTo(
    data?.coordinate || [location.latitude, location.longitude],
    {
      duration: 1000,
      flying: true,
    },
  );
  const marker = visitMarkers.find((marker) => {
    const markerCoords = marker.geometry.getCoordinates();
    return (
      markerCoords[0] === data?.coordinate[0] &&
      markerCoords[1] === data?.coordinate[1]
    );
  });
  visitMarkers.forEach((marker, index) => {
    marker.options.set({
      preset: "islands#circleIcon",
      iconColor: "#299B9B",
    });
  });

  if (marker) {
    await marker.options.set({
      preset: "islands#blueIcon",
      iconColor: "#0903f3",
    });
  }

  if (mapInstance.getZoom() === 9) {
    mapInstance.setZoom(14);
  }
};

// methods

const handleMenuChange = () => {
  isShowMenu.value = !isShowMenu.value;
  menuOpenClose();
};

const menuOpenClose = async () => {
  const menuContentDiv = document.querySelector(".map-content");
  const yMapsDiv = document.querySelector("#map2");

  // Apply transitions first
  menuContentDiv.style.transition = "width 0.3s ease-in-out";
  yMapsDiv.style.transition = "width 0.3s ease-in-out";

  if (isShowMenu.value) {
    menuContentDiv.style.width = "calc(100% - 240px)";
    yMapsDiv.style.width = "calc(100% - 240px)"; // Removed semicolon
  } else {
    menuContentDiv.style.width = "100%";
    yMapsDiv.style.width = "100%";
  }

  // Force Yandex Map to redraw after resize
  setTimeout(() => {
    if (mapInstance) {
      mapInstance.container.fitToViewport();
    }
  }, 300); // Match this with your transition duration

  setOpenedItemsToLocalByKey("gps-menu-optimization-route", isShowMenu.value);
};

const resizeObserver = new ResizeObserver((entries) => {
  if (mapInstance) {
    mapInstance.container.fitToViewport();
  }
});

const gpsUpdateFunction = async (isAllRoute: boolean) => {
  await updateMarkers(gpsStore.visitExpeditorSequenceData);
  if (isAllRoute) {
    await getAllRouteByOSRM();
  }
};

const getAllRouteByOSRM = async () => {
  const validPoints =
    gpsStore.visitExpeditorSequenceData?.filter((item) => item?.location) || [];

  if (validPoints.length <= 1) return;

  const routeCoords = validPoints
    .map(({ location }) => \`\${location.longitude},\${location.latitude}\`)
    .join(";");

  const queryParams = params2query({
    overview: "full",
    steps: true,
  });

  const fullQuery = \`\${routeCoords}?\${queryParams}\`;
  if (routeCache.has(fullQuery)) {
    const cachedResponse = routeCache.get(fullQuery);
    routeRenderByMarker(cachedResponse?.routes[0]?.legs);
    return;
  }
  const response = await gpsStore.getRouteByOSRM(fullQuery);
  routeCache.set(fullQuery, response.data);
  routeRenderByMarker(response.data.routes[0]?.legs);
};

const routeRenderByMarker = (data) => {
  data?.map((coor, index) => {
    coor?.steps?.map(async (childCoor) => {
      const strokeColor = getStrokeColor(index);
      await drawOSRMAllRoute(childCoor.geometry, strokeColor, "dash");
    });
  });
};

const drawOSRMAllRoute = async (
  geometry: string,
  strokeColor: string,
  strokeStyle: string,
) => {
  if (!mapInstance) {
    await initMap();
    if (!mapInstance) return;
  }

  const decodedCoords = decodePolyline(geometry);
  const routeLine = new ymaps.Polyline(
    decodedCoords,
    {},
    {
      strokeColor: strokeColor,
      strokeWidth: 3,
      strokeOpacity: 0.7,
      strokeStyle: strokeStyle,
    },
  );
  mapInstance.geoObjects.add(routeLine);
};

const getStrokeColor = (index: number): string => {
  return colorCodes[index % colorCodes.length] || "#000000";
};

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
});

// define expose

defineExpose({
  menuOpenClose,
  handleMenuChange,
  setClientLocation,
  gpsUpdateFunction,
});
<\/script>

<style lang="scss">
.map-content {
  width: 100%;
  height: calc(100vh - 90px);
  position: relative; // Add this
  overflow: hidden; // Add this

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
</style>
`;export{n as default};
