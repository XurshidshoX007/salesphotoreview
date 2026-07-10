const n=`<template>
  <div class="flex items-center flex-wrap gap-0.5 w-full">
    <div class="flex items-center gap-0.5">
      <d-input
        class="w-28 flex-shrink-0"
        key="width"
        id="width"
        type="number"
        :label="getInputLabels('width')"
        :value="data.width"
        :after-point-length="5"
        :required="checkRequiredInput"
        @input="setInputValue($event.target.value, 'width')"
      />
      <div v-if="groupMultiple" class="icon-style">
        <IconPlus :size="14" color="#525866" />
      </div>
      <d-input
        class="w-28 flex-shrink-0"
        key="thickness"
        id="thickness"
        type="number"
        :label="getInputLabels('thickness')"
        :value="data.thickness"
        :after-point-length="5"
        :required="checkRequiredInput"
        @input="setInputValue($event.target.value, 'thickness')"
      />
      <div v-if="groupMultiple" class="icon-style">
        <IconPlus :size="14" color="#525866" />
      </div>
      <d-input
        class="w-28 flex-shrink-0"
        key="length"
        id="length"
        type="number"
        :label="getInputLabels('length')"
        :after-point-length="5"
        :value="data.length"
        :required="checkRequiredInput"
        @input="setInputValue($event.target.value, 'length')"
      />
    </div>

    <div v-if="groupMultiple" class="flex items-center gap-0.5">
      <div class="icon-style">
        <IconEqual class="text-sm text-neutral-600" />
      </div>
      <Tag size="large" color="gray" class="px-2 h-10">
        {{ getVolume() }} {{ currentVolumeUnit }}
      </Tag>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// Types
enum UnitEnums {
  M = 1,
  Sm = 2,
}

// Props
const props = defineProps<{
  item_dimension: {
    width: number | null;
    thickness: number | null;
    length: number | null;
  } | null;
  showTotalVolume?: boolean;
  withoutLabel?: boolean;
  withoutTabs?: boolean;
  volumeUnitId?: number;
  group: string;
  editId?: string;
}>();

// State
const { t } = useI18n();
const selectedVolumeUnitId = ref<number>(UnitEnums.M);

const data = ref({
  width: null,
  thickness: null,
  length: null,
});

const volumeUnits = ref([
  {
    name: t("labels.in_meter"),
    id: UnitEnums.M,
    unitName: "m3",
  },
  {
    name: t("labels.in_centimeter"),
    id: UnitEnums.Sm,
    unitName: "sm3",
  },
]);

// Emits
const emit = defineEmits(["setVolume", "setVolumeUnit"]);

// Computed Properties
const currentVolumeUnit = computed(
  () =>
    volumeUnits.value?.find((unit) => unit.id === selectedVolumeUnitId.value)
      ?.unitName,
);

const volumeType = computed(() =>
  selectedVolumeUnitId.value !== UnitEnums.M ? 1000000 : 1,
);

const checkRequiredInput = computed(() => {
  const { width, thickness, length } = data.value;
  return Boolean(width || thickness || length) && props.group !== "all";
});

const volumeUnit = computed(() =>
  selectedVolumeUnitId.value === UnitEnums.M ? "(m)" : "(sm)",
);

const groupMultiple = computed(() => {
  return props.group === "multiple" || props.group === "all";
});

onMounted(() => {
  if (props.volumeUnitId) {
    selectedVolumeUnitId.value = props.volumeUnitId;
  } else if (props.editId) {
    selectedVolumeUnitId.value = UnitEnums.Sm;
  }

  updateVolume();
});

watch(
  () => props.item_dimension,
  (newItemDimension) => {
    if (
      newItemDimension?.width !== data.value.width ||
      newItemDimension?.thickness !== data.value.thickness ||
      newItemDimension?.length !== data.value.length
    ) {
      updateVolume();
    }
  },
);

watch(
  () => props.volumeUnitId,
  (newVolumeUnitId) => {
    if (!newVolumeUnitId) return;

    selectedVolumeUnitId.value = newVolumeUnitId;
    updateVolume();
  },
);
// Methods
const setVolume = (type: string | null) => {
  const adjustedData =
    selectedVolumeUnitId.value === UnitEnums.M
      ? {
          thickness: (data.value.thickness ?? 0) * 100,
          length: (data.value.length ?? 0) * 100,
          width: (data.value.width ?? 0) * 100,
        }
      : { ...data.value };

  // Prevent unnecessary emits if data hasn't changed
  if (
    adjustedData.thickness !== props.item_dimension?.thickness ||
    adjustedData.length !== props.item_dimension?.length ||
    adjustedData.width !== props.item_dimension?.width
  ) {
    if (props.group === "all" && type) {
      emit("setVolume", { [type]: adjustedData[type] });
    } else {
      emit("setVolume", adjustedData);
    }
  }
};

const setInputValue = (value: string, type: string) => {
  data.value[type] = Number(value.replace(/\\s/g, ""));
  setVolume(type);
};

const getVolume = () => {
  const { width, thickness, length } = data.value;
  if (!Boolean(width && thickness && length)) return 0;

  return getFormattedAmount((width! * thickness! * length!) / volumeType.value);
};

const updateVolume = () => {
  const { width, thickness, length } = props.item_dimension ?? {};
  const nextData =
    selectedVolumeUnitId.value === UnitEnums.M
      ? {
          thickness: thickness == null ? null : thickness / 100,
          length: length == null ? null : length / 100,
          width: width == null ? null : width / 100,
        }
      : {
          thickness: thickness ?? null,
          length: length ?? null,
          width: width ?? null,
        };

  if (
    nextData.width !== data.value.width ||
    nextData.thickness !== data.value.thickness ||
    nextData.length !== data.value.length
  ) {
    data.value = nextData;
  }
};

const getInputLabels = (type: string) => {
  switch (type) {
    case "width":
      return !props.withoutLabel
        ? \`\${t("labels.width")} \${volumeUnit.value}\`
        : undefined;
    case "thickness":
      return !props.withoutLabel
        ? \`\${t("labels.thickness")} \${volumeUnit.value}\`
        : undefined;
    case "length":
      return !props.withoutLabel
        ? \`\${t("labels.length")} \${volumeUnit.value}\`
        : undefined;
  }
};
<\/script>

<style scoped lang="scss">
.icon-style {
  @apply flex items-center justify-center flex-shrink-0 !size-5 border border-neutral-200 bg-white rounded-md;
}
</style>
`;export{n as default};
