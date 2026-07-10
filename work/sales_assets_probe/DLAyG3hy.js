const n=`<template>
  <m-btn @click="openProcess" group="border">
    <IconFrame :result="result" />
    {{ t("clients.group_processing") }}
  </m-btn>
  <div
    v-if="process && groupProcess"
    class="absolute card-shadow rounded-lg px-4 py-2 bg-white right-0 top-[50px] z-50 card"
  >
    <div
      v-for="i in groupProcess"
      :key="i"
      @click="$router.push(i.url)"
      class="fs-14 border-b border-[#E1E4E4] py-1 cursor-pointer"
    >
      {{ i.name }}
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";

const props = defineProps({
  groupProcess: {
    type: Array,
  },
});
const { t } = useI18n();
const result = ref({
  resultTable: true,
});
const process = ref(false);
function openProcess() {
  process.value = !process.value;
}
<\/script>

<style scoped></style>
`;export{n as default};
