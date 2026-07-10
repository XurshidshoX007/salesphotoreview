const e=`<template>
  <d-modal
    dataContainerWidth="1200px"
    :name="modalName || t('users.consignment_action')"
    only-close-dialog
    @closeDialog="closeDialog"
  >
    <div class="w-full">
      <div
        class="rounded-lg bg-white border-grey overflow-hidden"
        :class="agentStore.dataTradeDirection?.length > 7 && 'pr-1'"
      >
        <div
          class="w-full overflow-auto max-h-[500px] overflow-y-auto relative"
          :class="agentStore.dataTradeDirection?.length > 7 && 'pr-1'"
        >
          <data-table :is-empty="!agentStore.dataTradeDirection?.length">
            <template #header>
              <c-tr class="border-t-0 border-r-1 bg-[#FAFDFD]">
                <c-td-no-edit
                  v-for="key in checkedHeaders"
                  :key="key.name + key.type"
                  :type="key.type"
                  :is-checked="key.checked"
                >
                  <div
                    v-if="key.key === 'trade_direction'"
                    class="w-64 float-right"
                  >
                    <DropdownsByFilterStates
                      :filterStates="filterStatesForAll"
                    />
                  </div>
                  <div v-else>
                    {{ key.name }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
            <template #body>
              <template
                v-for="(data, index) in agentStore.dataTradeDirection"
                :key="data?.agent?.id"
              >
                <c-tr
                  :class="
                    index + 1 === agentStore.dataTradeDirection?.length &&
                    'border-b-0'
                  "
                >
                  <c-td-no-edit
                    v-for="key in checkedHeaders"
                    :key="key.name"
                    :type="key.type"
                    :is-checked="key.checked"
                    :class="
                      key.key === 'trade_direction' &&
                      agentStore.dataTradeDirection?.length > 7 &&
                      'border-r-1'
                    "
                  >
                    <div v-if="key.key === 'agent_name'">
                      {{ data.agent?.name }}
                    </div>
                    <div
                      v-else-if="key.key === 'trade_direction'"
                      :key="data?.agent?.id"
                      class="w-64 float-right"
                    >
                      <DropdownsByFilterStates
                        :key="data?.agent?.id"
                        :filterStates="createFilterState(index, data?.agent)"
                      />
                    </div>
                    <div v-else-if="key.key === 'agent_code'">
                      {{ data.agent?.code }}
                    </div>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </template>
          </data-table>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end items-center">
        <m-btn
          :loading="agentStore.isTradeDirectionSaveLoading"
          @click="save"
          :disabled="!hasAccess2AttachTradeDirection"
          >{{ t("save") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useAgentAccess } from "~/composables/access/users/agent-accesses";

// stores
const agentStore = useAgentsStore("true");

// props
const props = defineProps({
  modalName: String,
});

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const selectedTradeDirectionsForAll = ref([]);
const { hasAccess2AttachTradeDirection } = useAgentAccess();
const filterStatesForAll = ref([
  {
    name: t("settings_sidebar.trade_direction"),
    key: "trade-directions-for-all",
    disabled: !hasAccess2AttachTradeDirection.value,
    isSingleSelect: true,
    get data() {
      return agentStore.tradeDirections;
    },
    get getSelectedData() {
      return selectedTradeDirectionsForAll.value[0];
    },
    set setSelectedData(value: string) {
      selectedTradeDirectionsForAll.value = [value];
      for (let data of agentStore.dataTradeDirection) {
        data.trade_directions = selectedTradeDirectionsForAll.value;
      }
    },
  },
]);

// hooks
const checkedHeaders = computed(() => [
  {
    name: t("column.full_name"),
    checked: true,
    key: "agent_name",
    is_sortable: false,
  },
  {
    name: t("column.code"),
    key: "agent_code",
    checked: true,
    is_sortable: false,
  },
  {
    name: "",
    checked: true,
    key: "trade_direction",
    is_sortable: false,
    right: true,
    get borderX() {
      return agentStore.dataTradeDirection?.length > 7;
    },
  },
]);

onMounted(() => {
  agentStore.getTradeDirections();
  agentAttachTrade();
});

// methods
const agentAttachTrade = async () => {
  const agent_ids = [];
  if (agentStore.editMultipleDialog.length === 0) {
    const agentAllData = await agentStore.getAgents();
    agentAllData?.items?.map((item) => {
      agent_ids.push(item.id);
    });
    agentStore.getAgentTradeDirection(agent_ids);
  } else {
    agentStore.editMultipleDialog?.map((item) => {
      agent_ids.push(item.id);
    });
    agentStore.getAgentTradeDirection(agent_ids);
  }
};

const createFilterState = (index: number, agent: any) => {
  return [
    {
      key: "trade-directions" + agent.id + agent.code + agent.name + index,
      disabled: !hasAccess2AttachTradeDirection.value,
      isSingleSelect: true,
      get data() {
        return JSON.parse(JSON.stringify(agentStore.tradeDirections || []));
      },
      get getSelectedData() {
        return agentStore.dataTradeDirection[index].trade_directions[0] || null;
      },
      set setSelectedData(value: string) {
        agentStore.dataTradeDirection[index].trade_directions = [value];
      },
    },
  ];
};

const save = async () => {
  try {
    const postData = [];
    agentStore.dataTradeDirection?.map((item) => {
      postData.push({
        agent_id: item.agent.id,
        trade_direction_id_arr: item.trade_directions,
      });
    });
    if (postData?.length > 0) {
      await agentStore.saveTradeDirection(postData);
      closeDialog();
    }
    agentStore.dataTradeDirection = [];
  } catch (e) {
    // Handle error
  }
};

const closeDialog = () => {
  emit("closeDialog");
};
<\/script>

<style scoped lang="scss">
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px #e1e4e4;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.5);
}
</style>
`;export{e as default};
