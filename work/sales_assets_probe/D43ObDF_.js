const n=`<template>
  <form id="app" @submit.prevent="save">
    <d-modal
      :name="t('clients.add')"
      data-container-width="516px"
      only-close-dialog
      @closeDialog="closeDialog"
    >
      <flex-col class="gap-5">
        <div
          v-for="(email, index) in data.confirmation_emails"
          class="flex justify-between gap-2 items-center"
        >
          <d-input
            type="text"
            :label="t('labels.email')"
            required
            pattern-type="email"
            :value="email"
            class="w-full"
            @change="setEmail($event, index)"
          />
          <tooltip
            v-if="data.confirmation_emails.length > 1"
            :tooltip="t('deleted')"
          >
            <icon-trash
              :size="20"
              class="text-red-600 cursor-pointer"
              @click="removeEmail(index)"
            />
          </tooltip>
        </div>

        <div class="flex justify-end">
          <m-btn group="border" @click="addEmails" class="!gap-2">
            <icon-plus :size="20" />
            {{ t("add_more") }}
          </m-btn>
        </div>
        <Switch
          :title="t('access.confirmation_required')"
          :active="data.is_confirmation_required"
          @change="data.is_confirmation_required = $event"
        />
      </flex-col>
      <template #footer>
        <m-btn
          :loading="accessStore.isByOperationSaveLoading"
          class="w-full"
          type="submit"
        >
          {{ t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import type { ByOperationSaveModel } from "~/interfaces/api/access/by-operation";

// Store
const accessStore = useAccessOperationsStore();

// props
const props = defineProps<{
  id: number;
}>();

// emits
const emit = defineEmits(["closeDialog", "clearFetchedTab"]);

// State
const { t } = useI18n();

const data = ref<ByOperationSaveModel>({
  is_confirmation_required: true,
  confirmation_emails: [""],
  id: props.id,
});

// Methods
const setEmail = (value: string, index: number) => {
  data.value.confirmation_emails[index] = value;
};

const removeEmail = (index: number) => {
  if (data.value.confirmation_emails.length === 1) return;
  data.value.confirmation_emails.splice(index, 1);
};

const addEmails = () => {
  data.value.confirmation_emails.push("");
};

const save = async () => {
  const res = await accessStore.onByOperationSave([data.value]);
  if (res !== "error") {
    notify({ title: t("toast.saved"), type: "success" });
    closeDialog();
  }
};

const closeDialog = () => {
  emit("closeDialog");
};

// hooks

onMounted(async () => {
  const responseData = await accessStore.getByOperationDetail(props.id);
  if (responseData) {
    data.value = responseData;
  }
});
<\/script>
`;export{n as default};
