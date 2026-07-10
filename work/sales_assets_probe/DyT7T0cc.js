const e=`<template>
  <div class="mt-5">
    <div class="table-content-container">
      <div class="table-content-body !rounded-xl">
        <data-table
          :headers="favoriteStore.templates"
          :sorted="favoriteStore.params.order_by"
          :loading="favoriteStore.loading"
          :is-empty="!favoriteStore.data?.items.length"
          @sort="favoriteStore.sortData"
          :with-information-above-header="true"
        >
          <template #body>
            <c-tr v-for="data in favoriteStore.data?.items" :key="data.id">
              <c-td-no-edit
                v-for="key in favoriteStore.templates"
                :key="key.key"
                :is-checked="key.checked"
                :type="key.type"
              >
                <div v-if="key.key === 'color'">
                  <div
                    :style="{ backgroundColor: data['color'] }"
                    style="width: 24px; height: 24px; border-radius: 6px"
                  ></div>
                </div>
                <div
                  class="flex gap-2 float-right"
                  v-else-if="key.key === 'action' && data['can_update_delete']"
                >
                  <rounded-icon-btn
                    type="edit"
                    :icon-size="20"
                    @click="openEditDialog(String(data.id))"
                  />
                  <rounded-icon-btn
                    type="danger"
                    @click="openDeleteDialog(data)"
                  />
                </div>
                <div v-else-if="key.key === 'url'">
                  <link-component
                    :value="
                      getRouteName(
                        getDataValue(data, key.key, key.type) as string,
                      )
                    "
                    :to="getDataValue(data, key.key, key.type) as string"
                    nonCopyable
                  />
                </div>
                <div v-else :class="{ 'text-end': key.right }">
                  {{ getDataValue(data, key.key, key.type) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
      <div class="table-content-footer">
        <curren-page-btn
          :current-size="favoriteStore.params.page_size"
          :total-count="favoriteStore.data?.total_count"
          :page-number="favoriteStore.data?.page_number"
        />
        <page-index
          :available-pages="favoriteStore?.data?.total_pages"
          :current-page="favoriteStore?.data?.page_number"
          @set-page="favoriteStore.setPage"
        />
      </div>
    </div>
  </div>
  <transition name="modal">
    <d-modal
      v-if="favoriteStore.deletingId"
      :name="t('delete')"
      :data-container-width="'320px'"
      :with-out-header="true"
      @closeDialog="favoriteStore.deletingId = null"
    >
      <div class="flex flex-col items-center gap-4">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-100"
        >
          <rounded-icon-btn
            type="danger"
            :icon-size="24"
            withoutBorder
            withoutTooltip
            nonClickable
            class="!cursor-default"
          />
        </div>
        <div class="flex flex-col items-center gap-2">
          <p class="text-base font-medium text-neutral-900 mb-0">
            {{ t("delete") }}
          </p>
          <p class="text-center text-sm text-neutral-600 mb-0">
            {{ deleteDialogContent }}
          </p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-between items-center gap-2.5">
          <m-btn
            group="outlined"
            class="w-full"
            @click="favoriteStore.deletingId = null"
          >
            {{ t("filters.no") }}
          </m-btn>
          <m-btn
            group="delete"
            class="w-full"
            :loading="isDeleteLoading"
            @click="onDeleteItem"
          >
            {{ t("yes") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </transition>
  <transition name="modal">
    <div v-if="editingId">
      <account-favorite-page-dialog
        :id="editingId"
        @close-dialog="closeEditDialog"
        @clear-fetched-tab="clearFetchedTab"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useEventBus } from "~/composables/EventBus/eventBus";
import { SettingsEventKeys } from "~/variable/event-key-constants";
import { useI18n } from "vue-i18n";
import { getDataValue } from "~/utils/helpers";

// Composables
const { t } = useI18n();
const eventBus = useEventBus();

// Props
const props = defineProps<{
  isActive: boolean;
}>();

// Stores
const { isActive } = toRefs(props);
const favoriteStore = useFavoritePageSettings(isActive.value.toString());

// Emits
const emit = defineEmits(["clearFetchedTab"]);

// States
const urls = ref(favoriteStore.getFavoriteUrls());
const editingId = ref<string>("");
const featuredPages = ref<null | string>(null);
const isDeleteLoading = ref<boolean>(false);
const updateListEventKey = SettingsEventKeys.FAVORITE_PAGE_TABLE_UPDATE;

// Hooks
eventBus.on(updateListEventKey, async (updatedIsActive) => {
  if (updatedIsActive === isActive.value) {
    await getData();
  }
});

onMounted(async () => {
  await getData();
});

const deleteDialogContent = computed(() => {
  return \`\${t("settings.want_to_delete")} \${featuredPages.value} ?\`;
});

// Methods
const getRouteName = (id: string) => {
  return urls.value?.find((item) => item.id === id)?.name;
};

const onDeleteItem = async () => {
  isDeleteLoading.value = true;
  await favoriteStore.deleted();
  favoriteStore.deletingId = null;
  isDeleteLoading.value = false;
};

const getData = async () => {
  await favoriteStore.getData(isActive.value.toString());
};

const closeEditDialog = () => {
  editingId.value = "";
};

const clearFetchedTab = (isActive: boolean) => {
  emit("clearFetchedTab", isActive);
};

const openEditDialog = (id: string) => {
  editingId.value = id;
};

const openDeleteDialog = (item: { id: string | number; name: string }) => {
  favoriteStore.deletingId = String(item.id);
  featuredPages.value = item.name;
};
<\/script>
`;export{e as default};
