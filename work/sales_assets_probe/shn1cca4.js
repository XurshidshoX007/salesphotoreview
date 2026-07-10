const n=`<template>
  <d-modal
    dataContainerWidth="500px"
    :name="t('users.agent_following_operations')"
    @closeDialog="closeDialog"
  >
    <div v-if="isLoading" class="flex">
      <SkeletonRows v-for="i in 3" :key="i" :rows="1" :max-row-width="60" />
    </div>
    <flex-col v-else class="gap-4">
      <div v-if="formattedOperations">
        {{ t("users.agents.this_agent_operations") }}
      </div>
      <div v-if="formattedOperations" class="text-[14px] text-[#8FA0A0]">
        {{ formattedOperations }}
      </div>
      <div v-else class="text-center text-red text-xl">
        {{ t("users.agents.no_operations") }} !
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup>
import { useI18n } from "vue-i18n";

// store
const agentsStore = useAgentsStore("main");

// props
const props = defineProps({
  id: String,
});

// emits
const emit = defineEmits(["closeDialog"]);

// states
const { t } = useI18n();
const operations = ref();
const isLoading = ref(false);

// hooks
onBeforeMount(async () => {
  if (!props.id) closeDialog();
  isLoading.value = true;
  await getOperations();
  isLoading.value = false;
});

const formattedOperations = computed(() => {
  if (!operations.value?.length) return "";
  return operations.value?.join(", ");
});

// methods
const closeDialog = () => emit("closeDialog");

const getOperations = async () => {
  operations.value = await agentsStore.getOperations(props.id);
};
<\/script>
`;export{n as default};
