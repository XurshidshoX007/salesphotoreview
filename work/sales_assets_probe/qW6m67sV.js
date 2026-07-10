const e=`<template>
  <div class="access-territory-dialog-modal">
    <d-modal
      with-out-header
      data-container-width="896px"
      @close-dialog="closeDialog"
    >
      <template #header>
        <div
          class="flex items-center gap-2 rounded-t-xl text-neutral-400 p-5 bg-red-lotion border-b -mt-3 -mx-2"
        >
          <span> {{ t("access.attach_territories") }}: </span>
          <span class="font-semibold text-neutral-950">{{ props.name }}</span>

          <span class="ml-auto"> {{ t("access.selected") }}: </span>
          <span class="font-semibold text-neutral-950">{{
            checkedItemIds.length
          }}</span>

          <icon-x
            class="cursor-pointer shrink-0 [&>path]:stroke-neutral-600"
            @click="closeDialog"
          />
        </div>
      </template>

      <div class="w-full p-2">
        <div v-if="isLoading" class="flex flex-col gap-4 w-full pb-4">
          <skeleton-block v-for="i in 4" :key="i" height="40px" width="300px" />
        </div>
        <page-title20
          v-else-if="data.length === 0"
          :title="t('access.all_available_territories_have_been_attached')"
        />
        <div v-else>
          <checkbox
            :title="t('filters.choose_all')"
            :checked="isAllChecked"
            :indeterminate="isAllIndeterminate"
            :disabled="!allowToSave"
            class="w-fit mb-4 ml-7"
            @change="toggleAll"
          />

          <side-menu
            variant="tree"
            :data="transformedData"
            :open-items="openItems"
            :classes="{
              root: 'overflow-x-hidden',
              wrapper: '*:!left-0',
              groupWrapper: 'before:left-9.5',
              itemWrapper: 'left-7',
              contentWrapper: 'overflow-hidden',
            }"
            @update:open-items="openItems = $event"
          >
            <template #default="{ item, isOpen, toggle, hasChildren }">
              <div class="flex items-center gap-2">
                <icon-arrow-righti
                  v-if="hasChildren"
                  :class="
                    cn(
                      'cursor-pointer transition-transform size-5 rotate-90',
                      isOpen && '-rotate-90',
                    )
                  "
                  @click.stop="toggle()"
                />
                <div v-else class="size-5" />
                <checkbox
                  :id="String(item.id)"
                  :title="item.name"
                  :checked="checkedItemIds.includes(String(item.id))"
                  :indeterminate="indeterminateIds.has(String(item.id))"
                  :disabled="item.isDisabled || !props.allowToSave"
                  :is-in-active-item="
                    item.isInactive && checkedItemIds.includes(String(item.id))
                  "
                  @change="toggleItem(String(item.id), $event)"
                />
              </div>
            </template>
          </side-menu>
        </div>
      </div>
      <template #footer v-if="allowToSave">
        <div class="flex justify-end items-center gap-4">
          <m-btn
            class="!bg-neutral-200 !border-neutral-200 !text-neutral-600"
            @click="closeDialog"
          >
            {{ t("cancel") }}
          </m-btn>
          <m-btn
            :disabled="disabledSaveButton"
            :loading="isBtnLoading"
            @click="onSaveAttach"
          >
            {{ t("save") }}
          </m-btn>
        </div>
      </template>
    </d-modal>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { cn } from "~/utils/helpers";
import { Checkbox } from "#components";
import type { AccessUnAttachedTerritoryModel } from "~/interfaces/api/access/unattached-territories-list-model";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";

// Props
const props = defineProps<{
  name?: string;
  allowToSave?: boolean;
  disabledSaveButton?: boolean;
}>();

// Emits
const emit = defineEmits(["closeDialog"]);

// Store
const accessStore = useAccessUsersStore();

// Composables
const { t } = useI18n();

// State
const dataList = ref<AccessUnAttachedTerritoryModel[]>([]);
const checkedItemIds = ref<string[]>([]);
const openItems = ref<Record<string, boolean>>({});
const isBtnLoading = ref<boolean>(false);
const isLoading = ref<boolean>(false);

// Computed
const data = computed(() => dataList.value);

const indeterminateIds = computed(() => {
  const result = new Set<string>();

  const checkIndeterminate = (
    territory: AccessUnAttachedTerritoryModel,
  ): void => {
    if (!territory.children?.length) return;

    territory.children.forEach(checkIndeterminate);

    const childIds = getAllDescendantIds(territory).filter((id) => {
      if (id === territory.id) return false;
      const t = findTerritoryById(id);
      return t ? !isDisabledTerritory(t) : true;
    });

    if (!childIds.length) return;

    const checkedCount = childIds.filter((id) =>
      checkedItemIds.value.includes(id),
    ).length;

    if (checkedCount > 0 && checkedCount < childIds.length) {
      result.add(territory.id);
    }
  };

  dataList.value.forEach(checkIndeterminate);
  return result;
});

const allSelectableIds = computed(() => {
  const ids: string[] = [];
  const collect = (t: AccessUnAttachedTerritoryModel) => {
    if (!isDisabledTerritory(t)) ids.push(t.id);
    t.children?.forEach(collect);
  };
  dataList.value.forEach(collect);
  return ids;
});

const isAllChecked = computed(() => {
  if (!allSelectableIds.value.length) return false;
  return allSelectableIds.value.every((id) =>
    checkedItemIds.value.includes(id),
  );
});

const isAllIndeterminate = computed(() => {
  if (!allSelectableIds.value.length) return false;
  const checkedCount = allSelectableIds.value.filter((id) =>
    checkedItemIds.value.includes(id),
  ).length;
  return checkedCount > 0 && checkedCount < allSelectableIds.value.length;
});

const transformedData = computed<MenuTreeItemType[]>(() => {
  const transform = (
    territory: AccessUnAttachedTerritoryModel,
  ): MenuTreeItemType => {
    const isTerritoryChecked = checkedItemIds.value.includes(territory.id);

    return {
      id: territory.id,
      name: territory.name,
      isInactive: !territory.is_active,
      isDisabled: !territory.is_active && !isTerritoryChecked,
      children: territory.children?.length
        ? [territory.children.map(transform)]
        : undefined,
    };
  };

  return dataList.value.map(transform);
});

// Hooks
onMounted(async () => {
  await getDataList();
  collectCheckedTerritoryIds();
});

// Methods
const closeDialog = () => emit("closeDialog");

const getAllDescendantIds = (
  territory: AccessUnAttachedTerritoryModel,
): string[] => {
  const ids: string[] = [];
  const collect = (t: AccessUnAttachedTerritoryModel) => {
    ids.push(t.id);
    t.children?.forEach(collect);
  };
  collect(territory);
  return ids;
};

const findTerritoryById = (
  id: string,
  list: AccessUnAttachedTerritoryModel[] = dataList.value,
): AccessUnAttachedTerritoryModel | null => {
  for (const t of list) {
    if (t.id === id) return t;
    if (t.children?.length) {
      const found = findTerritoryById(id, t.children);
      if (found) return found;
    }
  }
  return null;
};

const isDisabledTerritory = (territory: AccessUnAttachedTerritoryModel) =>
  !territory.is_active && !checkedItemIds.value.includes(territory.id);

const toggleItem = (id: string, checked: boolean) => {
  const territory = findTerritoryById(id);
  if (!territory) return;

  const idsToToggle = getAllDescendantIds(territory);

  if (checked) {
    const disabledIds = new Set(getDisabledDescendantIds(territory));
    const newIds = idsToToggle.filter(
      (i) => !checkedItemIds.value.includes(i) && !disabledIds.has(i),
    );
    checkedItemIds.value = [...checkedItemIds.value, ...newIds];
  } else {
    checkedItemIds.value = checkedItemIds.value.filter(
      (i) => !idsToToggle.includes(i),
    );
  }

  updateParentStates();
};

const getDisabledDescendantIds = (
  territory: AccessUnAttachedTerritoryModel,
): string[] => {
  const ids: string[] = [];
  const collect = (t: AccessUnAttachedTerritoryModel) => {
    if (isDisabledTerritory(t)) ids.push(t.id);
    t.children?.forEach(collect);
  };
  collect(territory);
  return ids;
};

const updateParentStates = () => {
  const update = (list: AccessUnAttachedTerritoryModel[]): void => {
    for (const territory of list) {
      if (territory.children?.length) {
        update(territory.children);

        const childIds = getAllDescendantIds(territory).filter(
          (id) => id !== territory.id,
        );
        const enabledChildIds = childIds.filter((id) => {
          const t = findTerritoryById(id);
          return t ? !isDisabledTerritory(t) : true;
        });

        if (!enabledChildIds.length) continue;

        const allChecked = enabledChildIds.every((id) =>
          checkedItemIds.value.includes(id),
        );

        if (allChecked) {
          if (!checkedItemIds.value.includes(territory.id)) {
            checkedItemIds.value = [...checkedItemIds.value, territory.id];
          }
        } else {
          checkedItemIds.value = checkedItemIds.value.filter(
            (i) => i !== territory.id,
          );
        }
      }
    }
  };

  update(dataList.value);
};

const toggleAll = (checked: boolean) => {
  if (checked) {
    checkedItemIds.value = [
      ...new Set([...checkedItemIds.value, ...allSelectableIds.value]),
    ];
  } else {
    checkedItemIds.value = [];
  }
  updateParentStates();
};

const onSaveAttach = async () => {
  isBtnLoading.value = true;
  const payload = {
    user_id: accessStore.activeUserId,
    territory_id_arr: checkedItemIds.value,
  };
  const res = await accessStore.onAttachTerritories(payload);
  if (res !== "error") {
    emit("closeDialog");
    notify({ title: t("toast.saved"), type: "success" });
  }
  isBtnLoading.value = false;
};

const getDataList = async () => {
  isLoading.value = true;
  const territories = await accessStore.getUserTerritories();
  dataList.value = territories || [];
  isLoading.value = false;
};

function collectCheckedTerritoryIds() {
  const collect = (territory: AccessUnAttachedTerritoryModel) => {
    if (territory.is_checked) {
      checkedItemIds.value.push(territory.id);
    }
    if (territory.children && territory.children.length) {
      territory.children.forEach((child) => {
        collect(child);
      });
    }
  };

  data.value.forEach((territory) => collect(territory));
}
<\/script>

<style lang="scss">
.access-territory-dialog-modal .modal-body-content {
  margin: 0 -8px;
  padding: 16px !important;
  @apply border-t border-neutral-200;
}
</style>
`;export{e as default};
