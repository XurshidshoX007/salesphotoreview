const n=`<template>
  <div :class="cn('relative', { readonly: props.readOnly })">
    <component
      :is="fields[props.fieldKey].component"
      v-bind="resolvedFieldProps(props.fieldKey)"
      v-on="resolvedFieldActions(props.fieldKey)"
    />

    <transition-fade
      :show="
        props.differencesBetweenMainAndOthers?.[props.data.id]?.[props.fieldKey]
      "
    >
      <div
        class="absolute top-1/2 -translate-y-1/2 right-2.5 size-7 flex items-center justify-center rounded-lg border border-neutral-200 cursor-pointer bg-white"
        @click="
          emit('update:difference', props.fieldKey, props.data[props.fieldKey])
        "
      >
        <icon-pin-transfer size="20" class="text-primary-600" />
      </div>
    </transition-fade>

    <transition-fade
      :show="props.differencesBetweenMainAndOriginal?.[props.fieldKey]"
    >
      <div
        class="absolute top-1/2 -translate-y-1/2 right-2.5 size-7 flex items-center justify-center rounded-lg border border-neutral-200 cursor-pointer bg-white"
        @click="emit('reset:difference', props.fieldKey)"
      >
        <icon-undo size="20" class="text-red-500" />
      </div>
    </transition-fade>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { ClientDuplicationsModel } from "~/interfaces/api/clients/clients-duplication-model";
import { cn } from "#imports";

type Props = {
  data: ClientDuplicationsModel;
  fieldKey: keyof ClientDuplicationsModel;
  label: string;
  disabled?: boolean;
  readOnly?: boolean;
  withLabel?: boolean;
  differencesBetweenMainAndOthers?: Record<string, Record<string, boolean>>;
  differencesBetweenMainAndOriginal?: Record<string, boolean>;
};

type Emits = {
  (
    e: "update:difference",
    fieldKey: keyof ClientDuplicationsModel,
    value: ClientDuplicationsModel[keyof ClientDuplicationsModel]
  ): void;
  (e: "reset:difference", fieldKey: keyof ClientDuplicationsModel): void;
};

// Props
const props = defineProps<Props>();

// Emits
const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// Stores
const duplicationsMergeStore = useClientDuplicationsMergeStore();

// States
const statusState = ref([
  {
    name: props.withLabel ? t("column.status") : "",
    key: "is_active",
    isSingleSelect: true,
    disabled: props.disabled,
    get data() {
      return {
        items: [
          {
            name: "Активный",
            id: "true",
          },
          {
            name: "Не активный",
            id: "false",
          },
        ],
      };
    },
    get getSelectedData() {
      return String(props.data.is_active);
    },
    set setSelectedData(value: string) {
      props.data.is_active = value === "true";
    },
  },
]);

const categoryState = ref([
  {
    name: props.withLabel ? t("column.category") : "",
    key: "client-categories",
    isSingleSelect: true,
    required: true,
    disabled: props.disabled,
    get data() {
      return (
        duplicationsMergeStore.clientCategory ||
        (props.data.category ? { items: [props.data.category] } : undefined)
      );
    },
    get getSelectedData() {
      return props.data.category.id;
    },
    set setSelectedData(value: string) {
      props.data.category = duplicationsMergeStore.clientCategory?.items.find(
        (item) => item.id === value
      ) as BasicEntity;
    },
  },
]);

const territoryState = ref([
  {
    name: props.withLabel ? t("settings_sidebar.territory") : "",
    key: "territory",
    isSingleSelect: true,
    isTreeView: true,
    required: true,
    disabled: props.disabled,
    get data() {
      return duplicationsMergeStore.territories;
    },
    get getSelectedData() {
      return props.data.territory.id;
    },
    set setSelectedData(value: string) {
      props.data.territory.id = value;
    },
  },
]);

const otherStates = ref([
  {
    name: props.withLabel ? t("column.type") : "",
    key: "client-types",
    isSingleSelect: true,
    disabled: props.disabled,
    get data() {
      return (
        duplicationsMergeStore.clientTypes ||
        (props.data.client_type
          ? { items: [props.data.client_type] }
          : undefined)
      );
    },
    get getSelectedData() {
      return props.data.client_type?.id;
    },
    set setSelectedData(value: string) {
      props.data.client_type = duplicationsMergeStore.clientTypes?.items.find(
        (item) => item.id === value
      ) as BasicEntity;
    },
  },
  {
    name: props.withLabel ? t("settings_sidebar.sales_channel") : "",
    key: "sales-channel",
    isSingleSelect: true,
    disabled: props.disabled,
    get data() {
      return (
        duplicationsMergeStore.salesChanel ||
        (props.data.sales_channel
          ? { items: [props.data.sales_channel] }
          : undefined)
      );
    },
    get getSelectedData() {
      return props.data.sales_channel?.id;
    },
    set setSelectedData(value: string) {
      props.data.sales_channel = duplicationsMergeStore.salesChanel?.items.find(
        (item) => item.id === value
      ) as BasicEntity;
    },
  },
  {
    name: props.withLabel ? t("settings.client_format") : "",
    key: "client-format",
    isSingleSelect: true,
    disabled: props.disabled,
    get data() {
      return (
        duplicationsMergeStore.clientFormat ||
        (props.data.client_format
          ? { items: [props.data.client_format] }
          : undefined)
      );
    },
    get getSelectedData() {
      return props.data.client_format?.id;
    },
    set setSelectedData(value: string) {
      props.data.client_format =
        duplicationsMergeStore.clientFormat?.items.find(
          (item) => item.id === value
        ) as BasicEntity;
    },
  },
]);

const fields: Record<
  string,
  {
    component: string;
    props: Record<string, any>;
  }
> = {
  name: {
    component: "d-input",
    props: {
      type: "text",
      required: true,
    },
  },
  company_name: {
    component: "d-input",
    props: { type: "text" },
  },
  phone: {
    component: "d-input",
    props: { type: "tel" },
  },
  is_active: {
    component: "dropdowns-by-filter-states",
    props: {
      filterStates: statusState.value,
    },
  },
  inn: {
    component: "d-input",
    props: { type: "text" },
  },
  jshshir: {
    component: "d-input",
    props: { type: "text" },
  },
  category: {
    component: "dropdowns-by-filter-states",
    props: {
      filterStates: categoryState.value,
    },
  },
  address: {
    component: "d-input",
    props: { type: "text" },
  },
  territory: {
    component: "dropdowns-by-filter-states",
    props: {
      filterStates: territoryState.value,
    },
  },
  navigate: {
    component: "d-input",
    props: { type: "text" },
  },
  contact: {
    component: "d-input",
    props: { type: "text" },
  },
  number_of_contract: {
    component: "d-input",
    props: { type: "text" },
  },
  account: {
    component: "d-input",
    props: { type: "text" },
  },
  bank: {
    component: "d-input",
    props: { type: "text" },
  },
  mfo: {
    component: "d-input",
    props: { type: "text" },
  },
  oked: {
    component: "d-input",
    props: { type: "text" },
  },
  code_nds: {
    component: "d-input",
    props: { type: "text" },
  },
  client_type: {
    component: "dropdowns-by-filter-states",
    props: {
      filterStates: otherStates.value.filter(
        (state) => state.key === "client-types"
      ),
    },
  },
  sales_channel: {
    component: "dropdowns-by-filter-states",
    props: {
      filterStates: otherStates.value.filter(
        (state) => state.key === "sales-channel"
      ),
    },
  },
  client_format: {
    component: "dropdowns-by-filter-states",
    props: {
      filterStates: otherStates.value.filter(
        (state) => state.key === "client-format"
      ),
    },
  },
};

// Methods
const resolvedFieldProps = (key: keyof ClientDuplicationsModel) => {
  switch (fields[key].component) {
    case "d-input":
      return {
        ...fields[key].props,
        value: props.data[key],
        label: props.withLabel ? props.label : "",
        // d-input has not readonly prop, so we use disabled
        disabled: props.disabled || props.readOnly,
        class: {
          "[&_input]:!pr-11":
            fields[key].component === "d-input" &&
            props.differencesBetweenMainAndOthers?.[props.data.id]?.[
              key as string
            ],
        },
      };
    case "dropdowns-by-filter-states":
      return {
        ...fields[key].props,
        readonly: props.readOnly,
      };
    case "d-input-date-picker":
      return {
        ...fields[key].props,
        value: props.data[key] || undefined,
        withoutDefault: !props.data[key],
        withoutLabel: !props.withLabel,
        // d-input-date-picker has not readonly prop, so we use disabled
        disabled: props.disabled || props.readOnly,
      };
  }
};

const resolvedFieldActions = (key: keyof ClientDuplicationsModel) => {
  switch (fields[key].component) {
    case "d-input":
    case "d-input-date-picker":
      return {
        change: (value: string) => {
          (props.data[key] as any) = value;
        },
      };
    case "dropdowns-by-filter-states":
      return {
        onOpenDropdown: (state: string) => {
          if (
            state === "client-categories" &&
            !duplicationsMergeStore.clientCategory
          ) {
            duplicationsMergeStore.getClientCategories();
          } else if (
            state === "territory" &&
            !duplicationsMergeStore.territories
          ) {
            duplicationsMergeStore.getTerritories();
          } else if (
            state === "client-types" &&
            !duplicationsMergeStore.clientTypes
          ) {
            duplicationsMergeStore.getClientTypes();
          } else if (
            state === "sales-channel" &&
            !duplicationsMergeStore.salesChanel
          ) {
            duplicationsMergeStore.getSalesChannels();
          } else if (
            state === "client-format" &&
            !duplicationsMergeStore.clientFormat
          ) {
            duplicationsMergeStore.getClientFormat();
          }
        },
      };
  }
};

// Hooks
<\/script>

<style scoped lang="scss">
:deep(.dp__input) {
  height: 40px;

  @media (max-width: 576px) {
    height: 36px;
  }
}

.readonly {
  :deep(.form-field),
  :deep(.dp__input_wrap),
  :deep(.dropdown) {
    input,
    .disabled-input,
    div[type="button"] {
      color: theme("colors.neutral.950") !important;
      background-color: theme("colors.neutral.25") !important;
      opacity: 1 !important;
      border-radius: 10px;
    }
  }

  :deep(.dropdown) {
    & > .disabled {
      opacity: 1 !important;
      cursor: default;
    }

    .truncate {
      color: theme("colors.neutral.950") !important;
    }
  }

  :deep(.dp__input) {
    border: 1px solid theme("colors.neutral.200") !important;
    padding-left: 15px !important;
  }

  :deep(.calendar-input-left) {
    opacity: 1 !important;
  }

  :deep(.form-field) {
    label {
      left: 11px;
      top: 0;
      line-height: 16px;

      &.disabled_label {
        background: linear-gradient(
          0deg,
          theme("colors.neutral.25") 0%,
          #ffffff 100%
        ) !important;

        > .title {
          color: theme("colors.neutral.600") !important;
        }
      }

      .title {
        font-size: 12px;
        color: theme("colors.neutral.600") !important;
      }
    }
  }

  :deep(.d-input-datepicker-content) {
    svg {
      display: none;
    }

    .focused-date {
      left: 11px !important;
    }
  }
}
</style>
`;export{n as default};
