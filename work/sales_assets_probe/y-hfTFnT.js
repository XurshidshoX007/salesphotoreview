const n=`<template>
  <d-modal name="Изменить данные компании" @closeDialog="closeDialog">
    <div class="w-full">
      <div class="flex flex-row mb-2">
        <span class="text-gray-3 fs-12 fw-4"> Логин </span>
      </div>
      <div class="flex flex-row gap-4">
        <d-input
          :placeholder="'Введите'"
          class="w-full"
          type="text"
          :value="data.login"
          @change="(e) => (data.login = e)"
        />
      </div>
      <div class="flex flex-row my-2">
        <span class="text-gray-3 fs-12 fw-4"> Пароль </span>
      </div>
      <div class="flex flex-row gap-4">
        <d-input
          :placeholder="'***********'"
          class="w-full"
          type="password"
          :value="data.password"
          @change="(e) => (data.password = e)"
        />
      </div>
    </div>
    <template #footer>
      <div class="p-4">
        <m-btn :loading="loadingPassword" @click="save" class="w-full">
          Сохранить
        </m-btn>
      </div>
    </template>
  </d-modal>
</template>

<script setup lang="ts">
// emits
import type { CompanyPassword } from "~/interfaces/api/settings/company_profile";

const emit = defineEmits(["closeDialog"]);

// State
const data = ref<CompanyPassword>({});
const loadingPassword = ref(false);
const dialogStore = useDialogStore("change_password");
const companyProfile = useCompany_profileStore();

// Methods
async function save() {
  loadingPassword.value = true;
  await companyProfile.addChangePassword(data.value);
  dialogStore.closeDialog();
  loadingPassword.value = false;
}

const closeDialog = () => emit("closeDialog");
<\/script>
`;export{n as default};
