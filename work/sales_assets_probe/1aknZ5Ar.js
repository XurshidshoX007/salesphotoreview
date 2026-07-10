const n=`<template>
  <div id="map2" class="map-content"></div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { i18n } from "~/utils/i18nInstance";
import { getOpenedItemsByKey } from "~/utils/local-storage";
import type {
  DetailUnVisitedModel,
  DetailVisitsModel,
  EmployeeDataModel,
  EmployeeRouteDataModel,
  MiniReportDataModel,
} from "~/interfaces/api/gps/GPS-model";

import BalloonContent from "@/components/gps/employee-route/VisitMarkerBalloon.vue";
import ClientMarkerBalloon from "@/components/gps/employee-route/ClientMarkerBalloon.vue";
import ClientLocationSvg from "~/assets/svg/client-location.svg?url";
import vTooltip from "@/directives/vTooltip";

// Constants
const TASHKENT_CENTER = [41.2825974, 69.2793667] as [number, number];
const MIN_COORDINATE_OFFSET = 0.000001;
const SPIRAL_ANGLE = 137.5 * (Math.PI / 180);
const MAX_BALLOON_HEIGHT = 500;
const MAP_ZOOM_TRANSITION = 300;
const BALLOON_ADJUSTMENT_DELAY = 50;

const MARKER_COLORS = {
  VISIT_DEFAULT: "#05A9A9", // Teal color
  VISIT_NOT_AT_POINT: "#EF4444", // Red color
  ROUTE_START: "#10B981", // Green flag
  ROUTE_END: "#EF4444", // Red flag
  ROUTE_DEFAULT: "#05A9A9", // Teal blue
  ROUTE_SELECTED: "#33A9A9", // Darker teal
  ROUTE_UNSELECTED: "#7ED5D5", // Light blue
} as const;

// Props & Emits
const props = defineProps<{
  gpsActionType: {
    gps_orders: boolean;
    gps_route_line: boolean;
    gps_route_point: boolean;
    gps_rejections: boolean;
    gps_sales_points: boolean;
    gps_line: boolean;
  };
}>();

const emit = defineEmits<{
  (e: "setOpenPhotoReport", id: string): void;
}>();

// Composables & Store
const { t } = useI18n();
const gpsStore = useGPSStore("main");
const { yandexMapApiKey } = useRuntimeConfig().public;

// State
const isShowMenu = ref<boolean>(getOpenedItemsByKey("gps-menu-route") ?? true);

let mapInstance: any = null;
let clusterer: any = null;
let mapReadyPromise: Promise<void> | null = null;
const routeCache = new Map<string, any>();
let visitMarkers: any[] = [];
let visitClientMarkers: any[] = [];
let selectedVisitIndex = ref<number>(-1);
let currentRouteSegments: any[] = [];
const visitMarkerMap = new Map<string, any>();
const clientMarkerMap = new Map<string, any>();
type MarkerBalloonMetadata = {
  containerId: string;
  callback: () => void;
  extraClasses?: string[];
};

type SetupBalloonOptions = {
  extraClasses?: string[];
  preventAutoPan?: boolean;
};

const markerBalloonOpenHandlers = new WeakMap<any, () => void>();
const markerBalloonCallbacks = new WeakMap<any, MarkerBalloonMetadata>();

// Yandex Maps Initialization
const loadYandexMaps = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).ymaps) {
      resolve((window as any).ymaps);
    } else {
      const script = document.createElement("script");
      script.src = \`https://api-maps.yandex.ru/2.1/?apikey=\${yandexMapApiKey}&lang=ru_RU\`;
      script.async = true;
      script.onload = () => resolve((window as any).ymaps);
      script.onerror = reject;
      document.head.appendChild(script);
    }
  });
};

const createCustomCluster = (
  ymaps: any,
  color: string,
  number: number,
  putFlag: boolean = false,
  size: number = 30
): any => {
  const flagColor = putFlag && number === 1 ? "#10B981" : "#EF4444"; // Green for start, red for end

  return ymaps.templateLayoutFactory.createClass(
    \`<div style="border-color: \${color}; width: \${size}px; height: \${size}px;" class="custom-cluster">
        <span style="color: \${color};">{{properties.iconContent}}</span>
        \${
          putFlag
            ? \`<svg class="cluster-flag" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.09212 2.33887C7.36975 2.05304 8.64984 2.24503 9.73178 2.79728L9.94581 2.91249L9.997 2.94206L10.0443 2.9765C10.8711 3.5825 11.9623 3.84609 13.0628 3.59992C13.6351 3.47179 14.1661 3.21149 14.6101 2.84243L15.8581 1.80471L16.0804 2.7406C16.0876 2.74479 16.0952 2.74836 16.1023 2.7527C16.3975 2.93173 16.614 3.22195 16.6951 3.56265L18.1047 9.49816C18.1466 9.67562 18.1499 9.85931 18.115 10.0362C18.085 10.1881 18.0253 10.3304 17.9446 10.4596L17.9457 10.4603C17.2353 11.6414 16.0482 12.5459 14.5741 12.8758C13.2674 13.1694 11.8898 12.9677 10.7239 12.3044L10.6727 12.2748L10.6245 12.2406C9.79729 11.633 8.7052 11.3683 7.60342 11.6147L7.60247 11.6149C7.24248 11.6952 6.89875 11.8281 6.5826 12.0072L7.63587 16.4425C7.75841 16.959 7.66328 17.4962 7.38023 17.9356C7.09779 18.3739 6.65184 18.6799 6.14377 18.7936C5.63571 18.9072 5.09673 18.8217 4.64513 18.5476C4.19253 18.2728 3.86466 17.8302 3.74192 17.3138L1.05505 5.99953L1.019 5.80547C0.959059 5.35057 1.06299 4.89088 1.31068 4.50643L1.4248 4.34881C1.7062 3.99517 2.10276 3.74801 2.54714 3.6484L2.69144 3.62212C2.99275 3.57708 3.29102 3.60277 3.56873 3.68598C4.2619 3.02007 5.13458 2.55214 6.09212 2.33887Z" fill="\${flagColor}" stroke="white" stroke-width="2"/>
        </svg>\`
            : ""
        }
    </div>\`
  );
};

const initMap = async (): Promise<void> => {
  if (mapReadyPromise) return mapReadyPromise;

  mapReadyPromise = new Promise(async (resolve, reject) => {
    try {
      const ymaps: any = await loadYandexMaps();

      ymaps.ready(() => {
        mapInstance = new ymaps.Map("map2", {
          center: TASHKENT_CENTER,
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
        setupSearchControl(ymaps);
        resolve();
      });
    } catch (error) {
      console.error("Failed to load Yandex Maps:", error);
      reject(error);
    }
  });

  return mapReadyPromise;
};

const setupSearchControl = (ymaps: any) => {
  const searchControl = mapInstance.controls.get("searchControl");
  if (!searchControl) return;

  searchControl.options.set({
    size: "large",
    noPlacemark: true,
  });

  searchControl.events.add("resultselect", async (e: any) => {
    const index = e.get("index");
    const result = await searchControl.getResult(index);
    const coordinates = result.geometry.getCoordinates();

    mapInstance?.setCenter(coordinates, 14, { checkZoomRange: true });

    const searchMarker = new ymaps.Placemark(
      coordinates,
      {
        hintContent: result.properties.get("name"),
        balloonContent: result.properties.get("description"),
      },
      { preset: "islands#icon", iconColor: "#1E90FF" }
    );
    mapInstance?.geoObjects.add(searchMarker);
  });
};

// Coordinate Utilities
const isValidCoordinate = (lat: number, lng: number): boolean =>
  lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const coordsSet = new Set<string>();

const offsetCoordWithSpiral = (
  [lat, lng]: [number, number],
  index: number
): [number, number] => {
  let attempt = index;
  while (true) {
    const radius = MIN_COORDINATE_OFFSET * Math.sqrt(attempt);
    const angle = attempt * SPIRAL_ANGLE;
    const adjustedCoords: [number, number] = [
      lat + radius * Math.cos(angle),
      lng + radius * Math.sin(angle),
    ];

    const key = \`\${adjustedCoords[0].toFixed(6)},\${adjustedCoords[1].toFixed(6)}\`;
    if (!coordsSet.has(key)) {
      coordsSet.add(key);
      return adjustedCoords;
    }
    attempt++;
  }
};

const getAdjustedCoords = (
  [lat, lng]: [number, number],
  index: number
): [number, number] => {
  const key = \`\${lat.toFixed(4)},\${lng.toFixed(4)}\`;
  if (coordsSet.has(key)) {
    return offsetCoordWithSpiral([lat, lng], index);
  }
  coordsSet.add(key);
  return [lat, lng];
};

// Marker Creation
const createMarker = (
  coords: [number, number],
  iconContent: string,
  iconColor: string,
  preset: string,
  hintContent?: string,
  iconCaption?: string
) => {
  const ymaps = (window as any).ymaps;
  return new ymaps.Placemark(
    coords,
    { iconContent, hintContent, iconCaption },
    { preset, iconColor }
  );
};

const createClientMarker = (
  coords: [number, number],
  clientName: string,
  hintContent?: string
) => {
  const ymaps = (window as any).ymaps;

  const CustomLayout = ymaps.templateLayoutFactory.createClass(
    \`<div style="visibility: \${props.gpsActionType.gps_sales_points ? "visible" : "hidden"}" class="custom-client-marker">
      <div class="client-marker-icon">
        <img src="\${ClientLocationSvg}" alt="client" />
      </div>
      <div class="client-marker-name">{{ properties.iconContent }}</div>
    </div>\`,

    {
      getShape() {
        const el = this.getElement();
        if (!el) return null;

        const rect = el.getBoundingClientRect();
        return new ymaps.shape.Rectangle(
          new ymaps.geometry.pixel.Rectangle([
            [0, 0],
            [rect.width, rect.height],
          ])
        );
      },
    }
  );

  return new ymaps.Placemark(
    coords,
    {
      iconContent: clientName,
      hintContent,
    },
    {
      iconLayout: CustomLayout,
      hasBalloon: true,
      hasHint: true,
      interactiveZIndex: true, // Ensures it stays clickable even when overlaps occur
      hideIconOnBalloonOpen: false,
    }
  );
};

const createVisitMarkerWithNumber = (
  coords: [number, number],
  number: number,
  isRejected: boolean,
  totalVisits: number,
  hintContent?: string
) => {
  const ymaps = (window as any).ymaps;

  const iconColor = isRejected
    ? MARKER_COLORS.VISIT_NOT_AT_POINT
    : MARKER_COLORS.VISIT_DEFAULT;

  // Put flag on first (start) and last (end) visit markers
  const isStartOrEnd = number === 1 || number === totalVisits;
  const customLayout = createCustomCluster(
    ymaps,
    iconColor,
    number,
    isStartOrEnd
  );

  return new ymaps.Placemark(
    coords,
    {
      iconContent: number.toString(),
      hintContent,
    },
    {
      iconLayout: customLayout,
      iconShape: {
        type: "Circle",
        coordinates: [0, 0],
        radius: 30,
      },
      hideIconOnBalloonOpen: false,
    }
  );
};

const getRouteMarkerConfig = (): {
  iconLayout: any;
  iconContent: string;
  iconColor: string;
} => {
  const customLayout = createCustomCluster(
    (window as any).ymaps,
    "#999999",
    0,
    false,
    16
  );

  return {
    iconLayout: customLayout,
    iconContent: "",
    iconColor: "#999999",
  };
};

const clearMapObjects = () => {
  visitMarkers = [];
  visitClientMarkers = [];
  visitMarkerMap.clear();
  clientMarkerMap.clear();
  clusterer?.removeAll();
  coordsSet.clear();
  currentRouteSegments = [];
  selectedVisitIndex.value = -1;

  // Remove all geoObjects except the clusterer
  if (mapInstance?.geoObjects) {
    const objectsToRemove: any[] = [];
    mapInstance.geoObjects.each((geoObject: any) => {
      if (geoObject !== clusterer) {
        objectsToRemove.push(geoObject);
      }
    });
    objectsToRemove.forEach((obj) => mapInstance.geoObjects.remove(obj));
  }

  ["polyline", "visitPolyline", "osrmPolyline"].forEach((key) => {
    if (mapInstance?.[key]) {
      mapInstance.geoObjects.remove(mapInstance[key]);
      delete mapInstance[key];
    }
  });
};

const createRouteMarkers = (clients: EmployeeRouteDataModel[]): any[] => {
  return clients
    .filter((client) =>
      isValidCoordinate(client?.lat_lng?.latitude, client?.lat_lng?.longitude)
    )
    .map((client, index) => {
      const { latitude, longitude } = client.lat_lng;
      const adjustedCoords = getAdjustedCoords([latitude, longitude], index);
      const config = getRouteMarkerConfig();

      const ymaps = (window as any).ymaps;
      const marker = new ymaps.Placemark(
        adjustedCoords,
        { iconContent: config.iconContent },
        {
          iconLayout: config.iconLayout,
          iconColor: config.iconColor,
          iconShape: { type: "Circle", coordinates: [0, 0], radius: 10 },
        }
      );

      marker.events.add("click", () => handleMarkerClick(client, marker));
      return marker;
    });
};

const createVisitMarkers = (
  allVisits: DetailVisitsModel[],
  showOrders: boolean,
  showRejections: boolean
): any[] => {
  if (!Array.isArray(allVisits) || !allVisits.length) return [];

  const validData = allVisits.filter(
    ({ location, is_rejected }) =>
      location &&
      isValidCoordinate(location.latitude, location.longitude) &&
      ((showOrders && !is_rejected) || (showRejections && is_rejected))
  );

  const totalVisits = validData.length;
  if (!totalVisits) return [];

  const visitIdToIndex = new Map(allVisits.map((v, i) => [v.visit_id, i]));

  return validData.flatMap((item, index) => {
    const { location, visit_id, is_rejected } = item;
    const visitMarkerIndex = visitIdToIndex.get(visit_id);
    if (visitMarkerIndex == null) return [];

    const adjustedCoords = getAdjustedCoords(
      [location!.latitude, location!.longitude],
      visitMarkerIndex
    );

    (allVisits as any)[visitMarkerIndex].coordinate = adjustedCoords;

    const marker = createVisitMarkerWithNumber(
      adjustedCoords,
      index + 1,
      is_rejected,
      totalVisits
    );

    if (visit_id) {
      visitMarkerMap.set(visit_id, marker);
    }

    marker.events.add("click", async () => {
      await handleVisitMarkerClick(marker, item);
      highlightRouteSegment(visitMarkerIndex - 1);
    });

    visitMarkers.push(marker);
    return marker;
  });
};

const createClientMarkers = (data: any[], isVisitData: boolean): any[] => {
  return (data || [])
    .map((item, index: number) => {
      const key = isVisitData ? "place" : "client";
      const { [key]: entity } = item;
      const entityLatLng = entity?.lat_lng;
      const latitude = entityLatLng?.latitude;
      const longitude = entityLatLng?.longitude;

      if (!latitude || !longitude || !isValidCoordinate(latitude, longitude))
        return null;

      const adjustedCoords = getAdjustedCoords([latitude, longitude], index);

      const clientName = entity?.name || "";

      // Use custom client location icon with name
      const marker = createClientMarker(adjustedCoords, clientName, clientName);

      visitClientMarkers.push(marker);
      data[index]["client_coordinate"] = adjustedCoords;

      if (isVisitData && item?.visit_id) {
        clientMarkerMap.set(item.visit_id, marker);
      }

      marker.events.add("click", async () => {
        await handleClientMarkerClick(marker, data[index]);
      });

      return marker;
    })
    .filter(Boolean);
};

const drawStaticPolyline = (markers: any[]) => {
  if (markers.length <= 1) return;

  const ymaps = (window as any).ymaps;
  mapInstance.polyline = new ymaps.Polyline(
    markers.map((marker) => marker.geometry.getCoordinates()),
    {},
    {
      strokeColor: "#05A9A9",
      strokeWidth: 6,
      strokeOpacity: 1,
      strokeStyle: "solid",
    }
  );
  mapInstance.geoObjects.add(mapInstance.polyline);
};

const adjustMapBounds = (markers: any[]) => {
  if (markers.length === 0) return;

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
};

const setupClustererZoom = () => {
  let debounceTimeout: number | null = null;
  mapInstance.events.add("boundschange", () => {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = window.setTimeout(() => {
      clusterer.options.set({ gridSize: mapInstance.getZoom() >= 15 ? 0 : 64 });
    }, 100);
  });
};

const updateMarkers = async (
  clients: EmployeeRouteDataModel[],
  data: DetailVisitsModel[] | MiniReportDataModel[] | DetailUnVisitedModel[],
  changeZoom: boolean,
  isVisitData: boolean
) => {
  if (!mapInstance || !clusterer) {
    await initMap();
    if (!mapInstance || !clusterer) return;
  }

  clearMapObjects();

  // Create all markers based on filter settings
  const routeMarkers = createRouteMarkers(clients);

  const visitMarkers = createVisitMarkers(
    data as DetailVisitsModel[],
    props.gpsActionType.gps_orders,
    props.gpsActionType.gps_rejections
  );

  const clientMarkers = createClientMarkers(
    data as DetailVisitsModel[],
    isVisitData
  );

  // Add markers to map based on filter state
  const allMarkers: DetailVisitsModel[] = [];

  if (clientMarkers.length > 0) {
    clientMarkers.forEach((marker) => mapInstance.geoObjects.add(marker));
    allMarkers.push(...clientMarkers);
  }

  if (props.gpsActionType.gps_route_point && routeMarkers.length > 0) {
    routeMarkers.forEach((marker) => mapInstance.geoObjects.add(marker));
    allMarkers.push(...routeMarkers);
  }

  if (visitMarkers.length > 0) {
    visitMarkers.forEach((marker) => mapInstance.geoObjects.add(marker));
    allMarkers.push(...visitMarkers);
  }

  // Draw polylines
  if (props.gpsActionType.gps_route_line) {
    drawStaticPolyline(routeMarkers);
  }

  if (props.gpsActionType.gps_line) {
    await getAllRouteByOSRM(data as DetailVisitsModel[]);
  }

  // Adjust zoom
  if (changeZoom) {
    adjustMapBounds(allMarkers);
  }

  setupClustererZoom();
};

// OSRM Routing
const getAllRouteByOSRM = async (visits: DetailVisitsModel[]) => {
  if (!visits?.length) return;
  const filteredVisits = visits.filter((item) => item.location);
  const validPoints = filteredVisits.map((item) => item.location);

  if (validPoints.length <= 1) return;

  const routeCoords = validPoints
    .map((loc: any) => \`\${loc.longitude},\${loc.latitude}\`)
    .join(";");
  const fullQuery = \`\${routeCoords}?\${params2query({ overview: "full", steps: true })}\`;

  if (routeCache.has(fullQuery)) {
    const cachedResponse = routeCache.get(fullQuery);
    renderOSRMRoute(cachedResponse?.routes[0]?.legs);
    return;
  }

  const response: any = await gpsStore.getRouteByOSRM(fullQuery);
  if (response && response !== "error") {
    routeCache.set(fullQuery, response?.data);
    renderOSRMRoute(response?.data?.routes[0]?.legs);
  }
};

const renderOSRMRoute = (legs: any) => {
  if (!legs) return;

  // Clear previous route segments
  if (mapInstance.osrmPolyline) {
    mapInstance.geoObjects.remove(mapInstance.osrmPolyline);
    delete mapInstance.osrmPolyline;
  }

  currentRouteSegments = [];

  legs.forEach((leg: any, legIndex: number) => {
    leg?.steps?.forEach((step: any) => {
      const isSelected = selectedVisitIndex.value === legIndex;
      drawOSRMPolyline(
        step.geometry,
        "solid",
        MARKER_COLORS.ROUTE_DEFAULT,
        isSelected,
        legIndex
      );
    });
  });
};

const drawOSRMPolyline = async (
  geometry: string,
  strokeStyle: string,
  strokeColor: string,
  isSelected: boolean = false,
  segmentIndex: number = -1
) => {
  if (!mapInstance) {
    await initMap();
    if (!mapInstance) return;
  }

  const ymaps = (window as any).ymaps;
  const decodedCoords = decodePolyline(geometry);

  // Determine styling based on selection
  const strokeWidth = isSelected ? 10 : 5;
  const strokeOpacity = 1;

  const routeLine = new ymaps.Polyline(
    decodedCoords,
    {},
    { strokeColor, strokeWidth, strokeOpacity, strokeStyle }
  );

  // Store reference to segment
  currentRouteSegments.push({
    polyline: routeLine,
    segmentIndex,
  });

  if (!mapInstance.osrmPolyline) {
    mapInstance.osrmPolyline = new ymaps.GeoObjectCollection();
    mapInstance.geoObjects.add(mapInstance.osrmPolyline);
  }
  mapInstance.osrmPolyline.add(routeLine);
};

const highlightRouteSegment = (visitIndex: number) => {
  const ymaps = (window as any).ymaps;
  if (!ymaps || currentRouteSegments.length === 0) return;
  if (visitIndex < 0 || visitIndex >= currentRouteSegments.length) return;

  // Update selected visit index
  selectedVisitIndex.value = visitIndex;

  // Update all route segments
  currentRouteSegments.forEach(({ polyline, segmentIndex }) => {
    const isSelected = segmentIndex === visitIndex;

    // Update the polyline options
    polyline.options.set({
      strokeWidth: isSelected ? 10 : 5,
      strokeOpacity: 1,
      strokeColor: isSelected
        ? MARKER_COLORS.ROUTE_SELECTED
        : MARKER_COLORS.ROUTE_UNSELECTED,
    });
  });
};

const decodePolyline = (encoded: string): [number, number][] => {
  let index = 0,
    lat = 0,
    lng = 0;
  const coordinates: [number, number][] = [];

  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      b;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lat / 1e5, lng / 1e5]);
  }

  return coordinates;
};

// Balloon Utilities
const adjustBalloonHeight = (container: HTMLElement) => {
  const balloon = container.closest(".ymaps-2-1-79-balloon") as HTMLElement;
  const content = container.closest(
    ".ymaps-2-1-79-balloon__content"
  ) as HTMLElement;
  const layout = container.closest(
    ".ymaps-2-1-79-balloon__layout"
  ) as HTMLElement;

  if (!balloon || !content || !layout) return;

  const height = Math.min(container.scrollHeight, MAX_BALLOON_HEIGHT);

  const isClientMarker = container.id.startsWith("client-balloon-container");

  container.style.cssText = "height: auto; overflow: auto;";
  content.style.cssText = "height: auto; overflow: auto;";
  layout.style.cssText = "height: auto;";
  balloon.style.transform = \`translate(-30.5%, \${isClientMarker ? \`calc(-50% - \${height / 2}px + 38px))\` : "calc(-100% + 58px)"}\`;
};

const mountBalloon = (
  marker: any,
  component: any,
  containerId: string,
  props: any
) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (container.hasChildNodes()) {
    container.replaceChildren();
  }

  const app = createApp(component, props);

  app.use(i18n);

  const nuxtApp = useNuxtApp();
  const router = nuxtApp.$router;

  app.use(router);

  app.directive("tooltip", vTooltip);

  app.mount(container);

  setTimeout(() => adjustBalloonHeight(container), BALLOON_ADJUSTMENT_DELAY);

  const observer = new ResizeObserver(() => adjustBalloonHeight(container));
  observer.observe(container);

  const onBalloonClose = () => {
    observer.disconnect();
    app.unmount();
    if (container.isConnected) {
      container.replaceChildren();
    }
    marker.events.remove("balloonclose", onBalloonClose);
  };
  marker.events.add("balloonclose", onBalloonClose);
};

const setupBalloon = (
  marker: any,
  containerId: string,
  eventHandler: (id: string) => void,
  options: SetupBalloonOptions = {}
) => {
  if (!marker) return;

  const uniqueContainerId = \`\${containerId}-\${Math.random().toString(36).slice(2, 9)}\`;
  markerBalloonCallbacks.set(marker, {
    containerId: uniqueContainerId,
    callback: () => eventHandler(uniqueContainerId),
    extraClasses: options.extraClasses,
  });

  let onBalloonOpen = markerBalloonOpenHandlers.get(marker);
  if (!onBalloonOpen) {
    onBalloonOpen = () => {
      const metadata = markerBalloonCallbacks.get(marker);
      if (!metadata) return;
      setTimeout(() => {
        metadata.callback();

        const balloonEl = document.querySelector(
          \`.ymaps-2-1-79-balloon:has(#\${metadata.containerId})\`
        );

        if (balloonEl) {
          balloonEl.classList.add("custom-balloon");
          metadata.extraClasses?.forEach((cls) => balloonEl.classList.add(cls));
        }
      }, 0);
    };
    markerBalloonOpenHandlers.set(marker, onBalloonOpen);
    marker.events.add("balloonopen", onBalloonOpen);
  }

  if (marker.balloon.isOpen()) {
    marker.balloon.close();
  }

  marker.properties.set({
    balloonContent: \`<div id="\${uniqueContainerId}" style="overflow:visible;"></div>\`,
  });

  marker.options.set("balloonAutoPan", options.preventAutoPan ? false : true);

  setTimeout(() => {
    marker.balloon.open();
  }, 0);
};

// Marker Click Handlers
const handleMarkerClick = (client: EmployeeRouteDataModel, marker: any) => {
  const balloonContent = \`
    <div style="padding: 16px 0;">
      <p style="margin: 0;">\${t("column.battery")}: \${client?.charge || ""}</p>
      <p style="margin: 0;">\${t("gps.accuracy")}: \${client?.accuracy || ""}</p>
      <p style="margin: 0;">\${t("gps.internet")}: \${client?.network_type || ""}</p>
    </div>
  \`;

  marker.properties.set({ balloonContent });

  mapInstance?.geoObjects.each((geoObject: any) => {
    if (geoObject !== marker && geoObject.balloon?.isOpen()) {
      geoObject.balloon.close();
    }
  });
};

const handleVisitMarkerClick = async (
  marker: any,
  client: DetailVisitsModel,
  balloonOptions: SetupBalloonOptions = {}
) => {
  setupBalloon(
    marker,
    "balloon-container",
    (containerId) => {
      mountBalloon(marker, BalloonContent, containerId, {
        visitId: client.visit_id,
        onSetOpenPhotoReport: () => setOpenPhotoReport(),
        openClientMarkerBalloon: () => {
          const clientMarker = visitClientMarkers.find((cm) => {
            const cmCoords = cm.geometry.getCoordinates();
            const clientCoords = client["client_coordinate"];
            return (
              clientCoords &&
              cmCoords[0] === clientCoords[0] &&
              cmCoords[1] === clientCoords[1]
            );
          });
          if (clientMarker) {
            handleClientMarkerClick(clientMarker, client);
          }
        },
        closeBalloon: () => {
          marker.balloon.close();
        },
      });
    },
    balloonOptions
  );

  if (client.visit_id) {
    gpsStore.setSelectedVisitId = client.visit_id;
    await gpsStore.getVisitsOrderInfo(client.visit_id);
  }
};

const handleClientMarkerClick = async (
  marker: any,
  client: DetailVisitsModel
) => {
  if (!client.visit_id) return;

  setupBalloon(marker, "client-balloon-container", (containerId) => {
    mountBalloon(marker, ClientMarkerBalloon, containerId, {
      visitId: client.visit_id,
      closeBalloon: () => {
        marker.balloon.close();
      },
      onSetOpenPhotoReport: async () => {
        const location =
          client?.location ||
          (client?.coordinate
            ? {
                latitude: client.coordinate[0],
                longitude: client.coordinate[1],
              }
            : null);
        await setClientLocation(location, client);
      },
    });
  });
};

const setClientLocation = async (
  location: { latitude: number; longitude: number } | null,
  data: DetailVisitsModel
) => {
  if (!mapInstance) return;

  // Find the visit index to highlight the route segment
  const visitIndex = gpsStore.detailVisitsData.findIndex(
    (visit) => visit.visit_id === data.visit_id
  );

  if (visitIndex === -1) return;

  const visitHasLocation = Boolean(location?.latitude && location?.longitude);

  if (visitHasLocation) {
    const targetMarker =
      visitMarkerMap.get(data.visit_id) ?? visitMarkers[visitIndex];
    if (targetMarker) {
      highlightRouteSegment(visitIndex);
      handleVisitMarkerClick(
        targetMarker,
        gpsStore.detailVisitsData[visitIndex]
      );
      return;
    }
  }

  const clientMarker =
    clientMarkerMap.get(data.visit_id) ||
    visitClientMarkers.find((marker) => {
      const coords = marker.geometry.getCoordinates();
      const clientCoords = data["client_coordinate"];
      return (
        Array.isArray(clientCoords) &&
        coords[0] === clientCoords[0] &&
        coords[1] === clientCoords[1]
      );
    });

  if (clientMarker) {
    handleVisitMarkerClick(
      clientMarker,
      gpsStore.detailVisitsData[visitIndex],
      {
        extraClasses: ["without-tail"],
        preventAutoPan: true,
      }
    );
  }
};

// Public Methods
const gpsUpdateFunction = (
  changeZoom: boolean,
  isVisited: boolean,
  isShowActiveTab: boolean
) => {
  const visitsData = isShowActiveTab
    ? gpsStore.miniReportData
    : isVisited
      ? gpsStore.detailVisitsData
      : gpsStore.detailUnVisitedData;

  updateMarkers(gpsStore.employeeRouteData, visitsData, changeZoom, isVisited);
};

const setLocationEmployee = (employee: EmployeeDataModel) => {
  const latLng = employee?.location_data?.lat_lng;
  if (!latLng || !mapInstance) return;

  mapInstance
    .panTo([latLng.latitude, latLng.longitude], {
      duration: 1000,
      flying: true,
    })
    .then(() => mapInstance.setZoom(14));
};

const toggleMapWidth = (width: string) => {
  const mapContent = document.querySelector(".map-content") as HTMLElement;
  const yMap = document.querySelector("#map2") as HTMLElement;
  if (!mapContent || !yMap) return;

  mapContent.style.transition = "width 0.3s ease-in-out";
  yMap.style.transition = "width 0.3s ease-in-out";
  mapContent.style.width = width;
  yMap.style.width = width;

  setTimeout(() => mapInstance?.container.fitToViewport(), MAP_ZOOM_TRANSITION);
};

const handleMenuChange = () => {
  isShowMenu.value = !isShowMenu.value;
  menuOpenClose();
};

const menuOpenClose = async () => {
  const width = isShowMenu.value ? "calc(100% - 482px)" : "100%";
  toggleMapWidth(width);
  setOpenedItemsToLocalByKey("gps-menu-route", isShowMenu.value as any);
};

const menuTabOpenClose = async (isShowActiveTab: boolean) => {
  const width = isShowActiveTab ? "calc(100% - 890px)" : "100%";
  toggleMapWidth(width);
};

const setOpenPhotoReport = () => {
  const visitId = gpsStore.setSelectedVisitId;
  if (visitId) {
    emit("setOpenPhotoReport", visitId);
  }
};

// Lifecycle Hooks
const resizeObserver = new ResizeObserver(() => {
  mapInstance?.container.fitToViewport();
});

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

  // Clear all map objects before unmounting
  clearMapObjects();

  // Close any open balloons
  if (mapInstance) {
    mapInstance.geoObjects.each((geoObject: any) => {
      if (geoObject.balloon?.isOpen()) {
        geoObject.balloon.close();
      }
    });
  }

  // Clear cache
  routeCache.clear();
});

// Expose Methods
defineExpose({
  menuOpenClose,
  handleMenuChange,
  setLocationEmployee,
  gpsUpdateFunction,
  setClientLocation,
  menuTabOpenClose,
});
<\/script>

<style lang="scss">
#balloon-container {
  min-height: 100px;
  overflow: visible;
}

.ymaps-2-1-79-balloon__content {
  padding: 20px 16px !important;
  ymaps {
    height: 100% !important;
    width: 100% !important;
  }
}

.ymaps-2-1-79-balloon__layout {
  height: auto !important;
  max-height: none !important;
}

.ymaps-2-1-79-balloon__close + .ymaps-2-1-79-balloon__content {
  margin-right: 10px !important;
}

.ymaps-2-1-79-map {
  width: 100% !important;

  .ymaps-2-1-79-balloon {
    border-radius: 8px;
  }

  .ymaps-2-1-79-balloon__layout {
    border-radius: 8px;
  }
}

.ymaps-2-1-79-balloon__tail {
  left: 45% !important;
}

.container {
  position: relative !important;
}

// Custom client marker styles
.custom-client-marker {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  z-index: 2;
}

.client-marker-icon {
  width: 22px;
  height: 37px;
  z-index: 3;
  img {
    object-fit: cover;
  }
}

.client-marker-name {
  position: relative;
  top: -7.5px;
  background: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin-left: -22px;
  padding-left: 24px;
  max-width: 220px;
  z-index: 1;
  box-shadow: 1px 1px 4px 0px rgba(0, 0, 0, 0.1);
}

.custom-cluster {
  position: relative;
  display: inline-block;
  text-align: center;
  border: 3px solid;
  border-radius: 50%;
  background-color: theme("colors.neutral.0");
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;

  .cluster-flag {
    position: absolute;
    top: -7px;
    left: 2%;
    transform: translateX(-50%) translateY(50%);
  }
}

.custom-balloon {
  .ymaps-2-1-79-balloon__close-button {
    display: none !important;
  }

  .ymaps-2-1-79-balloon__content {
    margin-right: 0 !important;
  }
}

.custom-balloon.without-tail {
  .ymaps-2-1-79-balloon__tail {
    display: none !important;
  }
}
</style>
`;export{n as default};
