const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="data?.id ? t('edit') : t('clients.add')"
      :loading="favoriteStore.loadingUpdate"
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <d-input
          type="text"
          required
          :label="t('column.name')"
          :value="data.name"
          focusable
          @change="data.name = $event"
        />
        <d-input
          :label="t('labels.sort')"
          type="number"
          pattern-type="sort"
          required
          :value="data.sort_number"
          @change="data.sort_number = $event"
        />
        <DropdownsByFilterStates
          :filterStates="filterStates"
          @onOpenDropdown="onOpenDropdown"
          @search="onSearch"
        />
        <div
          class="border border-neutral-200 rounded-xl px-2 py-1.5 overflow-hidden"
          @click.stop
        >
          <div class="flex justify-between items-center min-h-[28px]">
            <p class="text-sm mb-0 text-center align-middle flex-shrink-0">
              {{ t("labels.color") }}
            </p>
            <div
              class="color-swatches-container flex justify-end items-center gap-2 min-w-0 flex-1 py-2"
              :class="{ 'cursor-pointer': !isColorExpanded }"
              :style="swatchesContainerStyle"
              @click="onSwatchesContainerClick"
              @click.self="onSwatchesContainerSelfClick"
            >
              <template v-if="isColorExpanded || isClosing">
                <div
                  class="color-swatch-expanded-area flex flex-wrap gap-2 justify-end flex-shrink-0 items-center"
                >
                  <div
                    v-for="c in MOCK_COLORS"
                    :key="c"
                    class="color-swatch shrink-0 w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-opacity duration-150 ease-out hover:opacity-70"
                    :class="{
                      'border-2 border-white': c !== data.color,
                    }"
                    :style="getExpandedSwatchStyle(c)"
                    @click.stop="selectColor(c)"
                  >
                    <div
                      class="w-6 h-6 rounded-lg shrink-0"
                      :style="{ backgroundColor: c }"
                    />
                  </div>
                </div>
              </template>
              <div
                v-else
                class="flex items-center flex-shrink-0"
                :class="{ 'gap-2': isColorExpanded }"
              >
                <div
                  v-for="(c, i) in fixedColors"
                  :key="\`\${c}-\${i}\`"
                  class="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border-2 border-white cursor-pointer"
                  :class="{ '-ml-2': !isColorExpanded && i > 0 }"
                  @click.stop="expandColors"
                >
                  <div
                    class="w-6 h-6 rounded-lg shrink-0"
                    :style="{ backgroundColor: c }"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <Switch :active="data.is_active" @change="data.is_active = $event" />
      </flex-col>
      <template #footer>
        <m-btn :loading="isBtnLoading" class="w-full" type="submit">
          {{ !data.id ? t("clients.add") : t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import type { FavoritePageModel } from "~/interfaces/api/account/favorite-page-model";
import { darkenHex, getHexByTWColor } from "~/utils/helpers";

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Stores
const favoriteStore = useFavoritePageSettings("true");

// Props
const props = defineProps<{
  id?: string;
}>();

// Emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// Types
type UrlItem = {
  id: string | undefined;
  name: string;
};

// States
const isBtnLoading = ref<boolean>(false);
const isColorExpanded = ref(false);
const isClosing = ref(false);
const urlData = ref<{ items: UrlItem[] }>({ items: [] });
const initialDetailData = ref();

const CLOSE_DURATION_MS = 350;
const updateListEventKey = SettingsEventKeys.FAVORITE_PAGE_TABLE_UPDATE;

const MOCK_COLORS = [
  getHexByTWColor("bg-amber-500"),
  getHexByTWColor("bg-green-500"),
  getHexByTWColor("bg-blue-500"),
  getHexByTWColor("bg-red-500"),
  getHexByTWColor("bg-yellow-500"),
  getHexByTWColor("bg-teal-500"),
  getHexByTWColor("bg-violet-500"),
  getHexByTWColor("bg-pink-500"),
  getHexByTWColor("bg-gray-500"),
];

const filterStates = ref([
  {
    name: t("settings.url"),
    key: "url",
    isSingleSelect: true,
    required: true,
    get data() {
      return { items: urlData.value.items ?? [] };
    },
    get getSelectedData() {
      return data.value.url;
    },
    set setSelectedData(value: string) {
      data.value.url = value;
    },
  },
]);

const data = ref<Partial<FavoritePageModel>>({
  id: undefined,
  name: "",
  url: "",
  sort_number: null,
  color: "",
  icon_name: "",
  is_active: true,
  is_public: false,
});

// Hooks
const fixedColors = computed(() =>
  data.value.color ? [data.value.color] : MOCK_COLORS.slice(0, 3),
);
const swatchesContainerStyle = computed(() => {
  const collapsedW = data.value.color ? "32px" : "72px";
  const expandedW = "320px";
  return {
    maxWidth: isClosing.value
      ? collapsedW
      : isColorExpanded.value
        ? expandedW
        : collapsedW,
    transition: "max-width 0.35s ease-out",
    overflow: "hidden",
  };
});

const isActiveStateChangedOnEdit = computed(() => {
  if (!initialDetailData.value) return false;
  return initialDetailData.value?.is_active !== data.value.is_active;
});

onBeforeMount(async () => {
  await getSidebarData();
  if (props.id) {
    initialDetailData.value = await favoriteStore.getDetail(props.id);
    data.value = { ...initialDetailData.value };
  }
});

// Methods
const getExpandedSwatchStyle = (swatchColor: string) => {
  if (swatchColor !== data.value.color) return {};
  return {
    border: "none",
    boxShadow: \`0 0 0 0px #ffffff, 0 0 0 2px \${darkenHex(swatchColor)}\`,
  };
};

const expandColors = () => {
  isColorExpanded.value = true;
};

const onSwatchesContainerClick = () => {
  if (!isColorExpanded.value) expandColors();
};

const onSwatchesContainerSelfClick = () => {
  if (isColorExpanded.value) isColorExpanded.value = false;
};

const selectColor = (c: string) => {
  data.value.color = c;
  isClosing.value = true;
  setTimeout(() => {
    isColorExpanded.value = false;
    isClosing.value = false;
  }, CLOSE_DURATION_MS);
};

const save = async () => {
  isBtnLoading.value = true;
  const isActive = Boolean(data.value.is_active);
  await favoriteStore.add(data.value);
  updateListByActiveState(isActive);
  notify({ title: t("saved"), type: "success" });
  isBtnLoading.value = false;
  closeDialog();
};

const updateListByActiveState = (isActive: boolean) => {
  if (isActiveStateChangedOnEdit.value) {
    eventBus.emit(updateListEventKey, !isActive);
    emit("clearFetchedTab", !isActive);
    return;
  }
  eventBus.emit(updateListEventKey, isActive);
};

const getSidebarData = () => {
  urlData.value.items = favoriteStore.getFavoriteUrls() || [];
};

const onOpenDropdown = () => {
  getSidebarData();
};

const onSearch = (state: string, value: string) => {
  const searchResult: UrlItem[] = [];
  if (value) {
    favoriteStore.getFavoriteUrls()?.map((item) => {
      if (item.name.includes(value)) {
        searchResult.push(item);
      }
    });
    urlData.value.items = searchResult;
  } else {
    urlData.value.items = favoriteStore.getFavoriteUrls();
  }
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
