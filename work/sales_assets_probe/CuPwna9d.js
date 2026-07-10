const n=`<template>
  <d-modal
    :name="modalName"
    dataContainerWidth="80%"
    @closeDialog="closeDialog"
  >
    <ReportsOrderByAgentsTotalBoxes
      :total-blocks="totalsByAgent"
      :is-loading="ordersByAgentsStore.isTotalsByIdLoading"
    />
  </d-modal>
</template>

<script setup lang="ts">
import type { ReportTotalModel } from "~/interfaces/api/reports/orders-by-agents/total";

// store
const ordersByAgentsStore = useOrdersByAgentsStore("main");

// props
const props = defineProps<{
  agentId: string;
  modalName: string;
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// states
const totalsByAgent = ref<ReportTotalModel[]>();

// hooks
onMounted(async () => getTotalsByAgentId());

// methods
const getTotalsByAgentId = async () => {
  totalsByAgent.value = await ordersByAgentsStore.getTotalsByAgentId(
    props.agentId,
  );
};

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
