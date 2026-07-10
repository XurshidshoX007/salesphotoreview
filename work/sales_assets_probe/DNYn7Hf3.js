const n=`<template>
  <div :id="mapId" class="size-full"></div>
</template>

<script setup lang="ts">
// Types
export interface MapPoint {
  id: string | number;
  latitude: number;
  longitude: number;
  [key: string]: any; // Additional data
}

export interface MarkerConfig {
  iconContent?: string;
  iconColor?: string;
  preset?: string;
  hintContent?: string;
  iconCaption?: string;
  customLayout?: any;
  balloonContent?: string;
  hideIconOnBalloonOpen?: boolean;
  // Vue component marker
  component?: any;
  componentProps?: Record<string, any>;
}

export interface PolylineConfig {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeStyle?: "solid" | "dash" | "dot";
}

// Constants
const MIN_COORDINATE_OFFSET = 0.000001;
const SPIRAL_ANGLE = 137.5 * (Math.PI / 180);

// Props
const props = withDefaults(
  defineProps<{
    points?: MapPoint[];
    markerGenerator?: (point: MapPoint, index: number) => MarkerConfig;
    onMarkerClick?: (point: MapPoint, marker: any) => void;
    showPolyline?: boolean;
    polylineConfig?: PolylineConfig;
    initialCenter?: [number, number];
    initialZoom?: number;
    autoFitBounds?: boolean;
    clustered?: boolean;
    mapId?: string;
    showSearchControl?: boolean;
  }>(),
  {
    showPolyline: false,
    initialCenter: () => [41.2825974, 69.2793667],
    initialZoom: 9,
    autoFitBounds: true,
    clustered: false,
    mapId: "yandex-map",
    showSearchControl: false,
  }
);

// Emits
const emit = defineEmits<{
  (e: "mapReady", map: any): void;
  (e: "markerClick", point: MapPoint, marker: any): void;
  (e: "boundsChanged", bounds: any): void;
}>();

// Composables
const { yandexMapApiKey } = useRuntimeConfig().public;

// State
let mapInstance: any = null;
let clusterer: any = null;
let mapReadyPromise: Promise<void> | null = null;
const markers = ref<any[]>([]);
const coordsSet = new Set<string>();

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

const initMap = async (): Promise<void> => {
  if (mapReadyPromise) return mapReadyPromise;

  mapReadyPromise = new Promise(async (resolve, reject) => {
    try {
      const ymaps: any = await loadYandexMaps();

      const controls = ["zoomControl", "typeSelector"];
      if (props.showSearchControl) {
        controls.push("searchControl");
      }

      ymaps.ready(() => {
        mapInstance = new ymaps.Map(props.mapId, {
          center: props.initialCenter,
          zoom: props.initialZoom,
          controls,
        });

        if (props.clustered) {
          clusterer = new ymaps.Clusterer({
            preset: "islands#invertedVioletClusterIcons",
            groupByCoordinates: false,
            clusterDisableClickZoom: false,
            clusterOpenBalloonOnClick: true,
          });
          mapInstance.geoObjects.add(clusterer);
        }

        if (props.showSearchControl) {
          setupSearchControl(ymaps);
        }
        emit("mapReady", mapInstance);
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
const createVueComponentLayout = (
  component: any,
  props: Record<string, any> = {}
) => {
  const ymaps = (window as any).ymaps;
  const uniqueId = \`marker-\${Math.random().toString(36).slice(2, 11)}\`;

  return ymaps.templateLayoutFactory.createClass(
    \`<div id="\${uniqueId}" class="vue-marker-container"></div>\`,
    {
      build() {
        this.constructor.superclass.build.call(this);

        nextTick(() => {
          const container = document.getElementById(uniqueId);
          if (!container) return;

          const app = createApp(component, props);
          app.mount(container);

          // Store app instance for cleanup
          (this as any)._vueApp = app;
        });
      },

      clear() {
        const app = (this as any)._vueApp;
        if (app) {
          app.unmount();
        }
        this.constructor.superclass.clear.call(this);
      },

      getShape() {
        const el = document.getElementById(uniqueId);
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
};

const createMarker = (coords: [number, number], config: MarkerConfig): any => {
  const ymaps = (window as any).ymaps;

  // If Vue component is provided, use it
  if (config.component) {
    const customLayout = createVueComponentLayout(
      config.component,
      config.componentProps || {}
    );

    return new ymaps.Placemark(
      coords,
      {
        hintContent: config.hintContent || "",
        balloonContent: config.balloonContent || "",
      },
      {
        iconLayout: customLayout,
        hideIconOnBalloonOpen: config.hideIconOnBalloonOpen ?? false,
      }
    );
  }

  // Default marker creation
  const markerOptions: any = {
    preset: config.preset || "islands#dotIcon",
    iconColor: config.iconColor || "#05A9A9",
  };

  if (config.customLayout) {
    markerOptions.iconLayout = config.customLayout;
  }

  if (config.hideIconOnBalloonOpen !== undefined) {
    markerOptions.hideIconOnBalloonOpen = config.hideIconOnBalloonOpen;
  }

  return new ymaps.Placemark(
    coords,
    {
      iconContent: config.iconContent || "",
      hintContent: config.hintContent || "",
      iconCaption: config.iconCaption || "",
      balloonContent: config.balloonContent || "",
    },
    markerOptions
  );
};

const clearMapObjects = () => {
  markers.value = [];
  coordsSet.clear();

  if (clusterer) {
    clusterer.removeAll();
  }

  if (mapInstance?.geoObjects) {
    const objectsToRemove: any[] = [];
    mapInstance.geoObjects.each((geoObject: any) => {
      if (geoObject !== clusterer) {
        objectsToRemove.push(geoObject);
      }
    });
    objectsToRemove.forEach((obj) => mapInstance.geoObjects.remove(obj));
  }
};

const createMarkers = (): any[] => {
  if (!props.points) return [];

  return props.points
    .filter((point) => isValidCoordinate(point.latitude, point.longitude))
    .map((point, index) => {
      const adjustedCoords = getAdjustedCoords(
        [point.latitude, point.longitude],
        index
      );

      // Use custom marker generator if provided
      const config = props.markerGenerator
        ? props.markerGenerator(point, index)
        : {
            preset: "islands#dotIcon",
            iconColor: "#05A9A9",
            hintContent: \`\${point.id}\`,
          };

      const marker = createMarker(adjustedCoords, config);

      // Attach click handler
      marker.events.add("click", () => {
        if (props.onMarkerClick) {
          props.onMarkerClick(point, marker);
        }
        emit("markerClick", point, marker);
      });

      return marker;
    });
};

const drawPolyline = (markersList: any[]) => {
  if (markersList.length <= 1 || !props.showPolyline) return;

  const ymaps = (window as any).ymaps;
  const polylineOptions = {
    strokeColor: props.polylineConfig?.strokeColor || "#05A9A9",
    strokeWidth: props.polylineConfig?.strokeWidth || 6,
    strokeOpacity: props.polylineConfig?.strokeOpacity || 1,
    strokeStyle: props.polylineConfig?.strokeStyle || "solid",
  };

  const polyline = new ymaps.Polyline(
    markersList.map((marker) => marker.geometry.getCoordinates()),
    {},
    polylineOptions
  );

  mapInstance.geoObjects.add(polyline);
};

const adjustMapBounds = (markersList: any[]) => {
  if (markersList.length === 0 || !props.autoFitBounds) return;

  const bounds = markersList.map((marker) => marker.geometry.getCoordinates());
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

const updateMap = async () => {
  if (!mapInstance) {
    await initMap();
    if (!mapInstance) return;
  }

  clearMapObjects();

  const newMarkers = createMarkers();
  markers.value = newMarkers;

  // Add markers to map
  if (props.clustered && clusterer) {
    clusterer.add(newMarkers);
  } else {
    newMarkers.forEach((marker) => mapInstance.geoObjects.add(marker));
  }

  // Draw polyline if needed
  if (props.showPolyline) {
    drawPolyline(newMarkers);
  }

  // Adjust bounds
  if (props.autoFitBounds) {
    adjustMapBounds(newMarkers);
  }
};

// Public Methods
const setCenter = (coords: [number, number], zoom?: number) => {
  if (!mapInstance) return;
  mapInstance.setCenter(coords, zoom || mapInstance.getZoom(), {
    duration: 1000,
    flying: true,
  });
};

const setBounds = (bounds: [[number, number], [number, number]]) => {
  if (!mapInstance) return;
  mapInstance.setBounds(bounds, {
    checkZoomRange: true,
    zoomMargin: 50,
    duration: 1000,
  });
};

const getMap = () => mapInstance;

const getMarkers = () => markers.value;

// Watch for points changes
watch(
  () => props.points,
  () => {
    updateMap();
  },
  { deep: true }
);

// Lifecycle
const resizeObserver = new ResizeObserver(() => {
  mapInstance?.container.fitToViewport();
});

onMounted(async () => {
  await initMap();
  await updateMap();

  const mapContainer = document.querySelector(\`#\${props.mapId}\`);
  if (mapContainer) {
    resizeObserver.observe(mapContainer);
  }

  // Emit bounds change events
  mapInstance?.events.add("boundschange", (e: any) => {
    emit("boundsChanged", mapInstance.getBounds());
  });
});

onBeforeUnmount(() => {
  resizeObserver.disconnect();
  clearMapObjects();

  if (mapInstance) {
    mapInstance.geoObjects.each((geoObject: any) => {
      if (geoObject.balloon?.isOpen()) {
        geoObject.balloon.close();
      }
    });
  }
});

// Expose Methods
defineExpose({
  setCenter,
  setBounds,
  getMap,
  getMarkers,
  updateMap,
  clearMapObjects,
});
<\/script>
`;export{n as default};
