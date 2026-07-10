const n=`<template>
  <div>
    <div class="flex items-center justify-between w-full mb-4">
      <div>
        <span class="text-lg font-semibold"> {{ t("account.profile") }}</span>
      </div>
      <m-btn group="blue" @click="dialogStore.openDialog">
        {{ t("edit") }}</m-btn
      >
    </div>
    <div class="flex justify-between items-center py-3 border-b-1">
      <div class="label_">{{ t("column.name") }}</div>
      <div class="value">
        {{ company_profileStore?.data?.name }}
      </div>
    </div>
    <div class="flex justify-between items-center py-3 border-b-1">
      <div class="label_">{{ t("column.company_name") }}</div>
      <div class="value">
        {{ company_profileStore?.data?.company_name }}
      </div>
    </div>
    <div class="flex justify-between items-center py-3 border-b-1">
      <div class="label_">{{ t("column.phone") }}</div>
      <div class="value">
        {{ company_profileStore?.data?.phone }}
      </div>
    </div>
    <div class="flex justify-between items-center py-3 border-b-1">
      <div class="label_">{{ t("column.address") }}</div>
      <div class="value">
        {{ company_profileStore?.data?.address }}
      </div>
    </div>
    <div class="flex justify-between items-center py-3 border-b-1">
      <div class="label_">{{ t("labels.email") }}</div>
      <div class="value">
        {{ company_profileStore?.data?.email }}
      </div>
    </div>
    <div class="flex justify-between items-center py-3">
      <div class="label_">{{ t("labels.password") }}</div>
      <div class="value">
        <link-component :value="t('edit')" />
      </div>
    </div>
    <transition name="modal">
      <div v-if="dialogPasswordStore.isDialogOpen">
        <SettingsCompanyProfileChangePasswordBody
          @closeDialog="dialogPasswordStore.closeDialog"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
// Stores
import { useI18n } from "vue-i18n";

const company_profileStore = useCompany_profileStore(true);
const dialogStore = useDialogStore("company_profile");
const dialogPasswordStore = useDialogStore("change_password");

// State
const { t } = useI18n();
const draggable = ref(false);

// Methods
const onChangeTableHeaders = (param) => {
  company_profileStore.templates = param;
  draggable.value = false;
};
// Hooks
onMounted(async () => {
  await company_profileStore.getData();
});
<\/script>

<style lang="scss">
.label_ {
  font-family: "Inter", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #8fa0a0;
}

.value {
  font-weight: 500;
  font-family: "Inter", sans-serif;
  color: #424f4f;
  font-size: 16px;
}
</style>
`;export{n as default};
