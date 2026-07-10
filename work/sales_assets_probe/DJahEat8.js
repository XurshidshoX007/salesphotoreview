const n=`<template>
  <form id="app" class="w-full" @submit.prevent="onSave">
    <d-modal
      :name="name"
      @closeDialog="closeDialog"
      data-container-width="400px"
    >
      <div class="w-full">
        <div>
          <flex-col class="gap-4">
            <d-input-date-picker
              :label="datePlaceholder"
              required
              :value="dateTime"
              :withoutDefault="withoutDefaultDate"
              :min-date="minDate"
              :max-date="maxDate"
              type="text"
              @change="onChangeDateTime"
            />
            <dropdowns-by-filter-states
              v-if="expeditorField"
              ref="DropdownComponent"
              :filter-states="filterStates"
              @onOpenDropdown="onOpenDropdown"
            />
            <d-input
              v-if="commentField"
              type="text"
              pattern-type="comment"
              :label="t('column.comment')"
              @change="onChangeComment"
            />
          </flex-col>
        </div>
      </div>
      <template #footer>
        <m-btn :loading="isLoading" type="submit" class="w-full">
          {{ footerButtonName || t("save") }}
        </m-btn>
      </template>
    </d-modal>
  </form>
</template>

<script setup lang="ts">
import type { DropdownsByFilterStates } from "#components";
import type { ExpeditorModel } from "~/interfaces/api/users/expeditor-model";
import type { DropdownItemsModelByType } from "~/interfaces/ui/dropdown-items-model";

// i18n
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// dropdown
import { useDropdownsService } from "~/services/dropdowns";
import { defaultDropdownParams } from "~/variable/params";
const { getDropdownItemsByType } = useDropdownsService();

// props
const props = defineProps<{
  name: string;
  isLoading?: boolean;
  commentField?: boolean;
  expeditorField?: boolean;
  minDate?: string;
  maxDate?: string;
  initialDate?: string | null;
  withoutDefaultDate?: boolean;
  datePlaceholder?: string;
  footerButtonName?: string;
}>();

// emits
const emit = defineEmits(["onSave", "closeDialog"]);

// child-components
const DropdownComponent = ref<typeof DropdownsByFilterStates | null>(null);

//state
const dateTime = ref(props.initialDate || undefined);
const comment = ref<string | null>(null);
const expeditors = ref<DropdownItemsModelByType<ExpeditorModel>>();
const selectedExpeditorId = ref<string | null>(null);

const filterStates = ref([
  {
    name: t("clients.forwarder"),
    key: "expeditors",
    isSingleSelect: true,
    get data() {
      return expeditors.value || [];
    },
    get getSelectedData() {
      return selectedExpeditorId.value || "";
    },
    set setSelectedData(value: string) {
      selectedExpeditorId.value = value;
    },
  },
]);

// hooks
const datePlaceholder = computed(
  () => props.datePlaceholder || t("column.date")
);

// methods
const onChangeDateTime = (newDate: string) => {
  dateTime.value = newDate;
};

const onChangeComment = (newValue: string) => {
  comment.value = newValue;
};

const closeDialog = () => {
  emit("closeDialog");
};

const onOpenDropdown = async (key: string, value: unknown) => {
  if (key === "expeditors" && !expeditors.value) {
    await getExpeditors();
  }
};

const onSave = async () => {
  if (props.commentField) {
    const data = {
      date: dateTime.value,
      comment: comment.value,
      ...(props.expeditorField && {
        expeditorId: selectedExpeditorId.value,
      }), // Conditionally add expeditorId
    };
    emit("onSave", data);
    return;
  }

  emit("onSave", dateTime.value);
};

const getExpeditors = async () => {
  expeditors.value = await getDropdownItemsByType<ExpeditorModel>(
    "expeditors",
    defaultDropdownParams
  );
};
<\/script>
`;export{n as default};
