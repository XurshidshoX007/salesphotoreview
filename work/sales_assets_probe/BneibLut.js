const n=`<template>
  <div :class="['localized-input', isOpen && 'localized-input--open']">
    <div class="localized-input-main">
      <d-input
        type="text"
        :required="required"
        :disabled="disabled"
        :focusable="autoFocus"
        :readonly="isOpen"
        :label="!withoutLabel ? resolvedLabel : ''"
        :value="mainInputValue"
        :borderless="isOpen"
        @change="updateBase"
      >
        <template #suffix>
          <flex-row
            class="items-center gap-1 cursor-pointer"
            @click.stop="toggleOpen"
          >
            <span class="text-xs text-neutral-600">{{
              t("settings.is_default_short")
            }}</span>
            <IconTranslate class="text-primary-600" />
          </flex-row>
        </template>
      </d-input>
    </div>

    <div
      :class="[
        'localized-input-dropdown',
        isOpen && 'localized-input-dropdown--open',
      ]"
    >
      <TransitionExpand :is-open="isOpen" :destroy-on-close="false">
        <div class="translations-list">
          <div class="translation-item">
            <d-input
              type="text"
              :label="\`\${resolvedLabel} (\${t('settings.is_default')})\`"
              :value="mainInputValue"
              @change="updateBase"
            >
              <template #suffix>
                <IconEarth class="text-primary-600" />
              </template>
            </d-input>
          </div>

          <div
            v-for="culture in allCultures"
            :key="culture.name"
            class="translation-item"
          >
            <d-input
              type="text"
              :label="\`\${resolvedLabel} (\${getCultureCode(culture.name)})\`"
              :value="getCultureInputValue(culture.name)"
              @change="updateTranslation(culture.name, $event)"
            >
              <template #suffix>
                <flex-row class="items-center gap-1">
                  <span class="text-xs text-neutral-950">{{
                    getCultureCode(culture.name)
                  }}</span>
                  <img
                    v-if="culture.flag"
                    :src="getIconUrl(culture.flag)"
                    :alt="culture.display_name || culture.name"
                    class="culture-flag"
                  />
                </flex-row>
              </template>
            </d-input>
          </div>
        </div>
      </TransitionExpand>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SupportedCulturesModel } from "#imports";
import { useI18n } from "vue-i18n";

type LocalizedInputValue = {
  base: string;
  translations: SupportedCulturesModel;
};

type CultureModel = {
  name: string;
  display_name?: string;
  flag?: string;
};

const props = withDefaults(
  defineProps<{
    modelValue?: LocalizedInputValue;
    base?: string;
    translations?: SupportedCulturesModel;
    label?: string;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    withoutLabel?: boolean;
  }>(),
  {
    base: "",
    translations: () => ({}),
    required: false,
    disabled: false,
    autoFocus: false,
    withoutLabel: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: LocalizedInputValue): void;
  (e: "update:base", value: string): void;
  (e: "update:translations", value: SupportedCulturesModel): void;
}>();

const { t } = useI18n();
const { cultures, currentLang, loadCultures, getIconUrl } = useLocalization();

const isOpen = ref(false);

const normalizedValue = computed<LocalizedInputValue>(() => {
  if (props.modelValue !== undefined) {
    return {
      base: props.modelValue?.base || "",
      translations: props.modelValue?.translations || {},
    };
  }

  return {
    base: props.base || "",
    translations: props.translations || {},
  };
});

const resolvedLabel = computed(() => props.label || t("column.name"));

const isSameLanguage = (first: string, second: string) => {
  const normalizedFirst = first.toLowerCase();
  const normalizedSecond = second.toLowerCase();

  return (
    normalizedFirst === normalizedSecond ||
    normalizedFirst.startsWith(\`\${normalizedSecond}-\`) ||
    normalizedSecond.startsWith(\`\${normalizedFirst}-\`)
  );
};

const getCultureCode = (cultureName: string) => {
  return cultureName.split("-")[0].toUpperCase();
};

const currentCultureName = computed(() => {
  const matchedCulture = cultures.value.find((culture) =>
    isSameLanguage(culture.name, currentLang.value),
  );

  return matchedCulture?.name || currentLang.value;
});

const allCultures = computed<CultureModel[]>(() => {
  if (cultures.value.length) {
    return cultures.value;
  }

  return [
    {
      name: currentCultureName.value,
      display_name: getCultureCode(currentCultureName.value),
    },
  ];
});

const getTranslationValueByCulture = (
  translations: SupportedCulturesModel,
  cultureName: string,
) => {
  const matchedKey = Object.keys(translations).find(
    (key) => key.toLowerCase() === cultureName.toLowerCase(),
  ) as keyof SupportedCulturesModel;

  if (!matchedKey) return "";
  return translations[matchedKey] || "";
};

const upsertTranslationByCulture = (
  translations: SupportedCulturesModel,
  cultureName: string,
  value: string,
) => {
  const nextTranslations = { ...translations };

  Object.keys(nextTranslations).forEach((key) => {
    if (
      key.toLowerCase() === cultureName.toLowerCase() &&
      key !== cultureName
    ) {
      delete nextTranslations[key as keyof SupportedCulturesModel];
    }
  });

  nextTranslations[cultureName as keyof SupportedCulturesModel] = value;

  return nextTranslations;
};

const mainInputValue = computed(() => {
  return normalizedValue.value.base || "";
});

const getCultureInputValue = (cultureName: string) => {
  const translationValue = getTranslationValueByCulture(
    normalizedValue.value.translations,
    cultureName,
  );

  if (translationValue) return translationValue;

  return "";
};

const emitCombinedValue = (
  base: string,
  translations: SupportedCulturesModel,
) => {
  emit("update:base", base);
  emit("update:translations", translations);
  emit("update:modelValue", {
    base,
    translations,
  });
};

const emitUpdatedValue = (translations: SupportedCulturesModel) => {
  emitCombinedValue(normalizedValue.value.base || "", translations);
};

const updateBase = (value: string) => {
  const normalizedInput = value || "";
  emitCombinedValue(normalizedInput, normalizedValue.value.translations);
};

const updateTranslation = (cultureName: string, value: string) => {
  const normalizedInput = value || "";
  const nextTranslations = upsertTranslationByCulture(
    normalizedValue.value.translations,
    cultureName,
    normalizedInput,
  );

  emitUpdatedValue(nextTranslations);
};

const toggleOpen = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

onMounted(async () => {
  await loadCultures();
});
<\/script>

<style scoped lang="scss">
.localized-input {
  position: relative;
  width: 100%;
}

.localized-input-main {
  width: 100%;
}

.localized-input--open .localized-input-main {
  box-sizing: border-box;
  border: 1.5px solid #2f9e9e;
  border-radius: 8px 8px 0 0;
  border-bottom: none;
  background: theme("colors.neutral.0");
}

.localized-input-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 60;
  padding: 0 12px;
}

.localized-input-dropdown--open {
  box-sizing: border-box;
  border: 1.5px solid #2f9e9e;
  border-top: none;
  border-radius: 0 0 8px 8px;
  background: theme("colors.neutral.0");
}

.translations-list {
  border-top: 1px solid theme("colors.neutral.200");
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.culture-flag {
  width: 16px;
  height: 16px;
  object-fit: contain;
  border-radius: 50%;
}
</style>
`;export{n as default};
