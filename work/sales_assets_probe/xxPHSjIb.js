const n=`<template>
  <d-modal
    dataContainerWidth="1200px"
    :name="modalName || t('users.consignment_action')"
    :loading="agentStore.isAgentOrderLimitLoading"
    @closeDialog="closeDialog"
  >
    <div class="w-full">
      <div
        class="rounded-lg bg-white border-grey overflow-hidden"
        :class="agentStore.dataConsignation?.length > 10 && 'pr-1'"
      >
        <div
          class="w-full overflow-auto max-h-[500px] overflow-y-auto"
          :class="agentStore.dataConsignation?.length > 10 && 'pr-1'"
        >
          <data-table
            :headers="checkedFilterStates"
            with-information-above-header
            :check="isTableAllChecked"
            :indeterminate="isTableIndeterminate"
            :is-empty="!agentStore.dataConsignation?.length"
            :sorted="agentStore.agent_params.order_by"
            :check-disabled="!allowToSave"
            @sort="agentStore.sortConsignationData"
            @getAllId="getAllAgentsId"
          >
            <template #body>
              <c-tr
                v-for="data in agentStore.dataConsignation"
                :key="data.agent.id"
                class="border-t-1 border-b-0"
              >
                <c-td-no-edit
                  v-for="key in checkedFilterStates"
                  :key="key"
                  :type="key.type"
                  :is-checked="key.checked"
                  :class="
                    key.key === 'checkbox' &&
                    agentStore.dataConsignation?.length > 10 &&
                    'border-r-1'
                  "
                >
                  <div class="flex justify-end" v-if="key.key === 'checkbox'">
                    <Checkbox
                      :disabled="!props.allowToSave"
                      :id="data.agent?.id"
                      :checked="isTableChecked(data.agent?.id)"
                      @change="onSelectAgent(data.agent?.id, $event)"
                    />
                  </div>
                  <div v-else-if="key.key === 'agent_name'">
                    {{ data["agent"]?.name }}
                  </div>
                  <div v-else-if="key.key === 'agent_code'">
                    {{ data["agent"]?.code }}
                  </div>
                </c-td-no-edit>
              </c-tr>
            </template>
          </data-table>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="flex justify-between items-center">
        <div class="text-[14px] fs-14 text-[#299B9B]">
          <span class="text-[#8FA0A0] mr-2 fs-14"
            >{{ t("users.selected_agents") }}
          </span>
          {{
            agentStore.editMultipleConsignation?.filter(
              (item) => item.can_order_with_consignation
            )?.length
          }}/{{ agentStore.dataConsignation?.length }}
        </div>
        <m-btn
          v-if="allowToSave"
          :loading="agentStore.isOrderLimitSaveLoading"
          @click="save"
          >{{ t("save") }}
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup>
// stores
import { ref } from "vue";
import { useI18n } from "vue-i18n";

// store
const agentStore = useAgentsStore("true");

// props
const props = defineProps({
  allowToSave: Boolean,
  modalName: String,
});

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();

// hooks
onMounted(() => {
  agentToConsignation();
});

const selectedAgentIds = computed(
  () =>
    agentStore.editMultipleConsignation
      .filter((f) => f.can_order_with_consignation)
      .map((agent) => agent.agent_id) || []
);

const isTableAllChecked = computed(() => {
  const items = agentStore.dataConsignation || [];
  return (
    items.length > 0 &&
    items.every((item) => selectedAgentIds.value.includes(item.agent.id))
  );
});

const isTableIndeterminate = computed(() => {
  const items = agentStore.dataConsignation || [];
  return (
    items.length > 0 &&
    !isTableAllChecked.value &&
    items.some((item) => selectedAgentIds.value.includes(item.agent.id))
  );
});

const checkedFilterStates = computed(() => [
  {
    name: t("column.full_name"),
    checked: true,
    key: "agent_name",
    type: "name",
  },
  {
    name: t("column.code"),
    key: "agent_code",
    checked: true,
    type: "name",
  },
  {
    name: "",
    checked: true,
    key: "checkbox",
    type: "checkbox",
    right: true,
    borderX: agentStore.dataConsignation?.length > 10,
  },
]);

// methods
const agentToConsignation = async () => {
  agentStore.agent_params = {
    order_by: null,
    search: null,
    agent_id_arr: [],
  };

  if (agentStore.editMultipleDialog.length === 0) {
    const agentAllData = await agentStore.getAgents();
    agentAllData.items?.map((item) => {
      agentStore.agent_params.agent_id_arr.push(item.id);
    });
    agentStore.getAgentOrderLimit(agentStore.agent_params);
  } else {
    agentStore.editMultipleDialog?.map((item) => {
      agentStore.agent_params.agent_id_arr.push(item.id);
    });
    agentStore.getAgentOrderLimit(agentStore.agent_params);
  }
};

const getAllAgentsId = (checked) => {
  if (checked) {
    agentStore.editMultipleConsignation = agentStore.dataConsignation.map(
      (agent) => {
        return {
          agent_id: agent.agent.id,
          can_order_with_consignation: true,
        };
      }
    );
  } else {
    agentStore.editMultipleConsignation = agentStore.dataConsignation.map(
      (agent) => {
        return {
          agent_id: agent.agent.id,
          can_order_with_consignation: false,
        };
      }
    );
  }
};

const isTableChecked = (agentId) => {
  return !!agentStore.editMultipleConsignation?.find(
    (id) => agentId === id.agent_id
  )?.can_order_with_consignation;
};

const onSelectAgent = (agentId, isChecked) => {
  agentStore.editMultipleConsignation =
    agentStore.editMultipleConsignation?.map((item) => {
      if (item.agent_id === agentId) {
        item.can_order_with_consignation = isChecked;
        return item;
      } else {
        return item;
      }
    });
};

const save = async () => {
  const response = await agentStore.saveAgentOrderLimit(
    agentStore.editMultipleConsignation
  );
  if (response !== "error") {
    closeDialog();
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
`;export{n as default};
