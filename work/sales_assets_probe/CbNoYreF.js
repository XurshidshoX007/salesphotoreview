const n=`<template>
  <div
    class="w-full mr-5 settings-content-item rounded-large select-none bg-white"
  >
    <div class="w-full p-2 text-lg text-gray-3 border-b">
      {{ t("invoices.return.expeditors") }}
    </div>
    <SkeletonRows v-if="loading" :rows="6" />
    <div v-else>
      <div
        v-for="exp in expeditorsArr"
        :key="exp.id"
        class="settings-sidebar"
        :class="{ activeColor: exp.id === activeExpeditorId }"
        @click="onChangeActiveExp(exp.id)"
      >
        <div class="flex justify-between items-center">
          <div class="fs-14 fw-4">
            {{ exp.name }}
          </div>
          <div class="flex justify-self-end gap-2">
            <IconCheck v-if="exp?.checked" color="green" />
            <IconX v-else color="red" />
            <IconExclamation
              v-show="exp?.hasDebt"
              color="#d72828"
              :size="26"
              :tooltip="t('invoices.return.in_this_expeditor_has_debt')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// props
const props = defineProps<{
  expeditorsArr: Array<{
    id: string;
    name: string;
    checked?: boolean;
    hasDebt?: boolean;
  }>;
  activeExpeditorId: string;
  loading?: boolean;
}>();

// states
const { t } = useI18n();

// emits
const emit = defineEmits(["onChangeActiveExp"]);

// methods
const onChangeActiveExp = (expId: string) => {
  emit("onChangeActiveExp", expId);
};
<\/script>

<style scoped>
.activeColor:after {
  position: absolute;
  content: "";
  right: 0;
  bottom: 0;
  top: 0;
  margin: 3px 0;
  width: 4px;
  border-radius: 3px 0px 0px 3px;
  background: #299b9b;
}
</style>
`;export{n as default};
