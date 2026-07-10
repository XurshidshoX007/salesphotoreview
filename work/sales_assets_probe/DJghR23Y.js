const n=`<template>
  <div>
    <card size="compact" :classes="{ root: 'w-full mb-5' }">
      <template #header>
        <m-btn group="outlined" class="size-10" @click="onBack">
          <icon-arrow-left />
        </m-btn>
        <page-title size="xl" :title="t('clients.duplication.merging')" />

        <m-btn
          type="submit"
          form="merge-form"
          :disabled="!mainClient"
          class="ml-auto"
          :loading="isMerging"
        >
          {{ t("clients.duplication.merge") }}
        </m-btn>
      </template>
    </card>

    <transition-expand :is-open="!!props.warningMessages">
      <card
        variant="danger"
        :classes="{
          root: 'mb-5',
          content: 'flex justify-between items-center gap-5 text-sm',
        }"
      >
        <ul>
          <li v-for="(message, index) in props.warningMessages" :key="index">
            {{ message }}
          </li>
        </ul>
        <div v-if="canSave" class="inline-flex gap-x-2.5">
          <m-btn
            class="w-36 !bg-[#eaedf1] !border-[#eaedf1] !text-neutral-600"
            @click="onBack"
          >
            {{ t("filters.no") }}
          </m-btn>
          <m-btn class="w-36" @click="isSaveModalOpen = true">
            {{ t("save") }}
          </m-btn>
        </div>
      </card>
    </transition-expand>

    <multi-panel
      :headers="menus"
      header-variant="menu"
      :open-items="openItems"
      @update:open-items="onUpdateOpenItems"
      :headers-label="t('clients.duplication.client_id')"
      :is-loading="props.isLoading"
      :entered-data="otherClients"
      prepent-is-fixed
      class="gap-x-5"
      content-class="gap-5"
    >
      <template #loading-columns>
        <skeleton-block
          v-for="item in Array(3)"
          :key="item"
          width="345px"
          height="1000px"
        />
      </template>

      <template #prepend>
        <card
          v-if="mainClient"
          :classes="{
            root: 'shrink-0 w-[345px] border-2 border-primary-300 transition-colors border-[#FACA0780] p-[18px] mb-4',
            header: [
              'flex-col items-start justify-between gap-0',
              !!props.mergeInfo && 'h-11',
            ],
            content: 'space-y-4',
          }"
        >
          <template #header>
            <template v-if="!!props.mergeInfo">
              <div class="text-[#FF8901] text-sm font-normal">
                {{ t("clients.duplication.main_client") }}
              </div>
              <div class="inline-flex items-center space-x-2">
                <icon-star :size="20" class="text-[#FACA07]" />
                <span> #{{ mainClient.visual_id }} </span>
              </div>
            </template>
            <div v-else class="inline-flex items-center space-x-2">
              <div
                v-if="props.canToggleMainClient"
                @click="unpinMainClient"
                class="cursor-pointer text-primary-600"
              >
                <icon-pin variant="bold" />
              </div>
              <span>#{{ mainClient.visual_id }}</span>
            </div>
          </template>
          <form id="merge-form" @submit.prevent="handleMerge" class="space-y-4">
            <clients-duplication-client-card
              :client="mainClient"
              :open-items="openItems"
              :differences-between-main-and-original="
                differencesBetweenMainAndOriginal
              "
              @reset:difference="resetMainByField"
            />
          </form>
        </card>
        <card
          v-else
          variant="blank"
          :classes="{
            root: 'shrink-0 w-[345px] mb-4',
            content: 'text-base',
          }"
        >
          <div class="inline-flex flex-col items-center gap-4">
            <p>{{ t("clients.duplication.select_one_object") }}</p>
            <icon-cursor-pointer size="38" />
          </div>
        </card>
      </template>

      <template #column="{ row }">
        <card
          :key="row.id"
          :hide-close-icon="false"
          :classes="{
            root: [
              'w-[345px] shrink-0 h-full transition-colors border border-transparent p-[19px]',
              !mainClient && 'hover:bg-neutral-25',
              selectedClients.includes(row?.id) && 'border-primary-300',
              props.mergeInfo?.[row?.id]?.is_merged && 'opacity-50',
            ],
            header: [
              'flex-col items-start justify-center gap-0',
              !!props.mergeInfo && 'h-11',
            ],
            content: 'space-y-4',
          }"
          @click="toggleActiveClient(row?.id)"
          @close="onRemoveClient(row.id)"
        >
          <template #header>
            <template v-if="props.mergeInfo?.[row?.id]">
              <div
                :class="
                  cn('text-sm font-normal', {
                    'text-red-500': !props.mergeInfo[row?.id]?.is_merged,
                    'text-green-500': props.mergeInfo[row?.id]?.is_merged,
                  })
                "
              >
                {{ props.mergeInfo[row?.id]?.message }}
              </div>
              <div class="inline-flex items-center space-x-2">
                <icon-exclamation
                  v-if="!props.mergeInfo[row?.id]?.is_merged"
                  color="#FB3748"
                  variant="bold"
                  :size="20"
                />
                <icon-check-circle
                  v-if="props.mergeInfo[row?.id]?.is_merged"
                  class="text-green-500"
                  variant="bold"
                  :size="20"
                />
                <span> #{{ row?.visual_id }} </span>
              </div>
            </template>
            <div v-else class="inline-flex items-center space-x-2">
              <div
                v-if="props.canToggleMainClient"
                @click="pinMainClient(row?.id)"
                :class="
                  cn('text-primary-600', {
                    'cursor-pointer': !mainClientId,
                    'opacity-50': mainClientId,
                  })
                "
              >
                <icon-pin variant="outline" />
              </div>
              <span>#{{ row?.visual_id }}</span>
            </div>
          </template>
          <clients-duplication-client-card
            :client="row"
            :merge-info="props.mergeInfo?.[row.id]"
            :open-items="openItems"
            :differences-between-main-and-others="
              differencesBetweenMainAndOthers
            "
            :read-only="true"
            @update:difference="applyDifferencesToMainClient"
          />
        </card>
      </template>
    </multi-panel>

    <transition name="modal">
      <div v-if="isSaveModalOpen">
        <clients-duplication-merge-save-dialog
          :initial-value="props.initialCommentary"
          :on-save="onSaveToDraft"
          @close-dialog="closeSaveModal"
          @on-success="handleSaveSuccess"
        />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { type ClientsDuplicationMergeMenu } from "#components";
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type {
  ClientDuplicationMergeInfoType,
  ClientDuplicationsModel,
} from "~/interfaces/api/clients/clients-duplication-model";
import { AppRoutes } from "~/variable/routes";
import { cn } from "#imports";
import { CLIENT_DUPLICATION_TAB_TYPES } from "~/variable/static-constants";
import BadgeMarker from "~/components/shared/map/markers/BadgeMarker.vue";
import type { MapPoint, MarkerConfig } from "~/components/shared/map/index.vue";
import { storeToRefs } from "pinia";
import type { MenuTreeItemType } from "~/interfaces/ui/SideMenuTypes";
import type { ClientDuplicationMenuItemType } from "~/interfaces/api/clients/clients-duplication-model";
import SkeletonBlock from "~/components/global/SkeletonBlock.vue";

type Props = {
  isLoading: boolean;
  mergeInfo: Record<string, ClientDuplicationMergeInfoType> | undefined;
  canToggleMainClient?: boolean;
  initialCommentary?: string;
  warningMessages?: string[];
  canSave: boolean;
  onSave: (data: ClientDuplicationDraftSaveModel) => Promise<unknown>;
};

type Emits = {
  (e: "back"): void;
  (
    e: "update:merge-info",
    id: string,
    info: ClientDuplicationMergeInfoType,
  ): void;
  (e: "merge-success"): void;
  (e: "remove-client", id: string): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const router = useRouter();
const { t } = useI18n();

// Stores
const duplicationsMergeStore = useClientDuplicationsMergeStore();

const { mainClientId } = storeToRefs(duplicationsMergeStore);

// Constants
const fieldsKeys: (keyof ClientDuplicationsModel)[] = [
  "name",
  "company_name",
  "phone",
  "is_active",
  "inn",
  "jshshir",
  "category",
  "address",
  "territory",
  "navigate",
  "number_of_contract",
  "account",
  "bank",
  "mfo",
  "oked",
  "code_nds",
  "client_type",
  "sales_channel",
  "client_format",
  "contact",
];

const locationMenu: MenuTreeItemType[] = [
  {
    id: "lat_lng",
    name: t("column.location"),
    children: [],
  },
];

// States
const mainClient = ref<ClientDuplicationsModel | null>();
const isSaveModalOpen = ref(false);
const isMerging = ref(false);
const selectedClients = ref<string[]>([]);
const openItems = ref<Record<string, boolean>>({});

// Methods
const onUpdateOpenItems = (value: Record<string, boolean>) => {
  openItems.value = value;
};

const pinMainClient = (id: string) => {
  if (!props.canToggleMainClient || mainClientId.value) return;

  mainClientId.value = id;
};

const unpinMainClient = () => {
  if (!props.canToggleMainClient) return;

  mainClientId.value = null;
};

const toggleActiveClient = (id: string) => {
  if (selectedClients.value.includes(id)) {
    selectedClients.value = selectedClients.value.filter(
      (clientId) => clientId !== id,
    );
  } else {
    selectedClients.value.push(id);
  }
};

const handleMerge = async () => {
  const data = mainClient.value;

  if (!data || !otherClients.value) return;

  try {
    isMerging.value = true;

    const response = await duplicationsMergeStore.mergeClients(
      data,
      otherClients.value.map((client) => client.id),
    );

    response.data.forEach((item) => {
      const info: ClientDuplicationMergeInfoType = {
        is_balance_zero: item.is_balance_zero,
        is_merged: item.is_deleted,
        not_completed_orders: item.not_completed_orders,
        message: item.is_deleted
          ? t("clients.duplication.client_merged")
          : t("clients.duplication.merge_failed"),
      };

      emit("update:merge-info", item.id, info);

      const originalClient = duplicationsMergeStore.data?.find(
        (client) => client.id === item.id,
      );

      if (originalClient) {
        originalClient.is_active = !item.is_disabled;
      }
    });

    emit("merge-success");
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isMerging.value = false;
  }
};

const onSaveToDraft = async (commentary: string) => {
  if (!otherClients.value || !mainClient.value) return;

  return props.onSave({
    commentary,
    duplicate_client_ids: otherClients.value.map((client) => client.id),
    master_client_id: mainClient.value.id,
  });
};

const closeSaveModal = () => {
  isSaveModalOpen.value = false;
};

const handleSaveSuccess = () => {
  closeSaveModal();
  router.replace({
    path: AppRoutes.clients.child.duplication,
    state: {
      defaultTab: CLIENT_DUPLICATION_TAB_TYPES.DRAFT,
    },
  });
};

const checkValuesEqual = (first: unknown, second: unknown) => {
  if (Array.isArray(first) || Array.isArray(second)) return;

  const _first = first ?? {};
  const _second = second ?? {};

  if (
    typeof _first === "object" &&
    typeof _second === "object" &&
    "id" in _first &&
    "id" in _second
  ) {
    return String(_first.id) === String(_second.id);
  } else {
    return JSON.stringify(_first) === JSON.stringify(_second);
  }
};

const applyDifferencesToMainClient = (
  key: keyof ClientDuplicationsModel,
  value: ClientDuplicationsModel[keyof ClientDuplicationsModel],
) => {
  if (!mainClient.value) return;

  mainClient.value = {
    ...mainClient.value,
    [key]: value,
  };
};

const resetMainByField = (key: keyof ClientDuplicationsModel) => {
  if (!mainClient.value) return;

  const original = duplicationsMergeStore.data?.find(
    (client) => client.id === mainClient.value?.id,
  );
  if (!original) return;

  mainClient.value = {
    ...mainClient.value,
    [key]: original[key],
  };
};

const generateMarker = (point: MapPoint, index: number): MarkerConfig => {
  return {
    component: BadgeMarker,
    componentProps: {
      text: point.label,
      color: point.color,
    },
  };
};

const onBack = () => emit("back");

const onRemoveClient = (id: string) => emit("remove-client", id);

// Hooks
onMounted(async () => {
  duplicationsMergeStore.getTerritories();
});

onUnmounted(() => {
  duplicationsMergeStore.$reset();
  duplicationsMergeStore.$dispose();
});

watch(mainClientId, () => {
  mainClient.value =
    clientsWithBalance.value?.find(
      (client) => client.id === mainClientId.value,
    ) || null;
});

const menus = computed<ClientDuplicationMenuItemType[]>(() => [
  {
    id: "balance",
    name: t("column.balance"),
    children: [balanceChildrenHeaders.value],
  },
  { id: "name", name: t("column.name") },
  { id: "company_name", name: t("column.legal_name") },
  { id: "phone", name: t("column.phone") },
  { id: "is_active", name: t("column.status") },
  { id: "inn", name: t("column.inn") },
  { id: "jshshir", name: t("column.pinfl") },
  { id: "category", name: t("column.category") },
  { id: "address", name: t("column.address") },
  { id: "territory", name: t("settings_sidebar.territory") },
  { id: "navigate", name: t("column.navigate") },
  {
    id: "bank_details",
    name: t("clients.duplication.bank_details"),
    children: [
      [
        { id: "number_of_contract", name: t("column.number_of_contract") },
        { id: "account", name: t("clients.account") },
        { id: "bank", name: t("column.bank") },
        { id: "mfo", name: t("column.mfo") },
        { id: "oked", name: t("column.oked") },
        { id: "code_nds", name: t("column.registration_code") },
      ],
    ],
  },
  {
    id: "additional_info",
    name: t("clients.duplication.additional_info"),
    children: [
      [
        { id: "client_type", name: t("column.type") },
        { id: "sales_channel", name: t("settings_sidebar.sales_channel") },
        { id: "client_format", name: t("settings.client_format") },
        { id: "contact", name: t("column.contact_person") },
      ],
    ],
  },
  {
    id: "statistics",
    name: t("clients.statistics"),
    children: [
      [
        { id: "order_count", name: t("clients.duplication.order_count") },
        {
          id: "not_completed_orders",
          name: t("clients.duplication.uncompleted_order_count"),
        },
        { id: "reject_count", name: t("clients.duplication.refusal_count") },
        { id: "bonus_count", name: t("column.bonus") },
        { id: "client_device_count", name: t("labels.equipment") },
      ],
    ],
  },
  { id: "code", name: t("column.code") },
  { id: "last_modified_date", name: t("column.last_modified_date") },
  {
    id: "teams",
    name: t("clients.duplication.teams"),
    children: teamsChildrenHeaders.value,
  },
]);

const mapPoints = computed(() => {
  const points: MapPoint[] =
    otherClients.value?.map((client) => ({
      id: client.id,
      latitude: client.lat_lng.latitude,
      longitude: client.lat_lng.longitude,
      label: \`#\${client.visual_id}\`,
      color: props.mergeInfo?.[client.id]
        ? props.mergeInfo[client.id]?.is_merged
          ? "#1fc16b"
          : "#fb3748"
        : "#299B9B",
    })) || [];

  if (mainClient.value) {
    points.push({
      id: mainClient.value.id,
      latitude: mainClient.value.lat_lng.latitude,
      longitude: mainClient.value.lat_lng.longitude,
      label: \`#\${mainClient.value.visual_id}\`,
      color: "#faca07",
    });
  }

  return points;
});

const balanceChildrenHeaders = computed(
  () =>
    duplicationsMergeStore.data?.reduce<ClientDuplicationMenuItemType[]>(
      (acc, client) => {
        client.balance.details?.forEach((balance) => {
          if (balance && !acc.some((item) => item.id === balance.currency.id)) {
            acc.push({
              id: balance.currency.id,
              name: balance.currency.name,
              renderType: "simpleLabel",
            });
          }
        });
        return acc;
      },
      [],
    ) || [],
);

const clientsWithBalance = computed(() => {
  return duplicationsMergeStore.data?.map((client) => ({
    ...client,
    balance: {
      ...client.balance,
      details: balanceChildrenHeaders.value.map((header) => {
        const balanceDetail = client.balance.details?.find(
          (balance) => balance?.currency.id === header.id,
        );
        return balanceDetail ? { ...balanceDetail } : null;
      }),
    },
  }));
});

const otherClients = computed(() => {
  return clientsWithBalance.value?.reduce<ClientDuplicationsModel[]>(
    (acc, client) => {
      if (client.id == mainClientId.value) {
        return acc;
      }

      acc.push(client);
      return acc;
    },
    [],
  );
});

const differencesBetweenMainAndOthers = computed(() => {
  if (!mainClient.value) return {};

  const main = mainClient.value;

  return otherClients.value?.reduce<
    Record<string, Partial<Record<keyof ClientDuplicationsModel, boolean>>>
  >((acc, client) => {
    acc[client.id] = {};

    for (const key of fieldsKeys) {
      if (!client[key]) continue;

      if (key === "phone") {
        if (
          !checkValuesEqual(
            client.phone?.replaceAll(/\\D/g, ""),
            main.phone?.replaceAll(/\\D/g, ""),
          )
        ) {
          acc[client.id][key] = true;
        }
      } else if (!checkValuesEqual(client[key], main[key])) {
        acc[client.id][key] = true;
      }
    }
    return acc;
  }, {});
});

const differencesBetweenMainAndOriginal = computed(() => {
  if (!mainClient.value) return {};

  const original = duplicationsMergeStore.data?.find(
    (client) => client.id === mainClient.value?.id,
  );
  if (!original) return {};

  return fieldsKeys.reduce<
    Partial<Record<keyof ClientDuplicationsModel, boolean>>
  >((acc, key) => {
    if (key === "phone") {
      if (
        !checkValuesEqual(
          mainClient.value?.phone?.replaceAll(/\\D/g, ""),
          original.phone?.replaceAll(/\\D/g, ""),
        )
      ) {
        acc[key] = true;
      }
    } else if (!checkValuesEqual(mainClient.value?.[key], original[key])) {
      acc[key] = true;
    }
    return acc;
  }, {});
});

const teamsChildrenHeaders = computed(() => {
  const maxTeamCount = duplicationsMergeStore.data?.length
    ? Math.max(
        ...duplicationsMergeStore.data.map((client) => client.teams.length),
      )
    : 0;

  return Array.from(
    { length: maxTeamCount },
    (_): ClientDuplicationMenuItemType[] => [
      {
        id: "ordinal_number",
        name: t("clients.duplication.team_name"),
        renderType: "simpleLabel",
      },
      { id: "agent", name: t("users.agents.agent"), renderType: "simpleLabel" },
      {
        id: "expeditor",
        name: t("column.expeditor"),
        renderType: "simpleLabel",
      },
    ],
  );
});
<\/script>

<style>
.carousel__liveregion {
  display: none;
}
</style>
`;export{n as default};
