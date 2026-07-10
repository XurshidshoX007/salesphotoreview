const n=`<template>
  <d-modal :name="t('labels.change_term')" @closeDialog="onCloseChangeDeadline">
    <flex-col class="w-full gap-5">
      <DropdownsByFilterStates :filterStates="clientFilterState" />
      <DInputDatePicker
        :label="t('column.term')"
        withoutTime
        :value="term"
        @change="(newVal) => (term = newVal)"
      />
    </flex-col>
    <template #footer>
      <m-btn class="w-full" @click="onSave">{{ t("save") }}</m-btn>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
// store
import { useI18n } from "vue-i18n";

const clientsBalancesStore = useClientsBalancesStore("main");

// props
const props = defineProps<{
  changeDeadlineInfo: {
    clientId: string;
    clientName: string;
    currentTerm: string;
  };
}>();

// emits
const emit = defineEmits(["closeDialog"]);

// state
const { t } = useI18n();
const term = ref<string>(
  props.changeDeadlineInfo.currentTerm
    ? props.changeDeadlineInfo.currentTerm
    : "",
);

const clientFilterState = ref([
  {
    name: t("sidebar.clients"),
    key: "clients",
    required: true,
    isSingleSelect: true,
    get initialName() {
      return props.changeDeadlineInfo?.clientName;
    },
    disabled: true,
  },
]);

// methods

const onSave = async () => {
  const data = {
    client_id: props.changeDeadlineInfo.clientId,
    current_term: props.changeDeadlineInfo.currentTerm,
    new_term: term.value,
  };
  const res = await clientsBalancesStore.onChangeTerm(data);
  if (res !== "error") {
    emit("closeDialog");
  }
};

const onCloseChangeDeadline = () => {
  emit("closeDialog");
};
<\/script>
`;export{n as default};
