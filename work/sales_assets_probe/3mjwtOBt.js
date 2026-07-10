const e=`<template>
  <div class="relative h-full">
    <form @submit.prevent="onSave" class="h-full">
      <div class="manage-level-names pr-1 pb-1">
        <div v-if="isLoading">
          <SkeletonRows
            v-for="i in 5"
            :key="i"
            :rows="1"
            height="12px"
            :maxRowWidth="120"
          />
        </div>

        <div v-else class="levels-list">
          <div
            v-for="(level, index) in displayLevels"
            :key="level.level"
            :style="itemLevelIndentation(index)"
            class="level-item"
            :class="{ 'is-first': index === 0 }"
          >
            <div class="level-number">
              {{ level.level }}
            </div>
            <div class="level-input-wrapper">
              <shared-localized-input
                :base="level.default_name"
                :translations="level.name_l10n"
                :disabled="!hasAccess2SaveTerritioryLevel"
                :required="level.isExisting"
                :auto-focus="!level.isExisting"
                :placeholder="t('settings.enter_level_name')"
                class="level-input"
                @update:base="onLevelNameChange(index, $event)"
                @update:translations="onLevelNameL10nChange(index, $event)"
              />
            </div>
            <RoundedIconBtn
              v-if="hasAccess2SaveTerritioryLevel && !level.is_used"
              type="danger"
              @click="onRemoveLevel(index)"
            />
          </div>

          <!-- Add new level button -->
          <div
            v-if="hasAccess2SaveTerritioryLevel"
            :style="itemLevelIndentation(levels.length)"
            class="level-item"
          >
            <RoundedIconBtn
              icon="plus"
              bg-color="white"
              dashed-border
              @click="onAddLevel"
            />
          </div>
        </div>
      </div>

      <div
        v-if="!isLoading && levels?.length > 0"
        class="flex justify-self-end items-end"
      >
        <m-btn
          v-if="hasAccess2SaveTerritioryLevel"
          :loading="isSaving"
          type="submit"
          class="absolute right-0 z-2"
        >
          {{ t("save") }}
        </m-btn>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import { useI18n } from "vue-i18n";
import { useSettingsTerritoriesAccess } from "~/composables/access/settings/territories/territories";
import type { TerritoryLevelModel } from "~/interfaces/api/settings/territory-model";

// store
const territoriesStore = useTerritoriesStore("");

// states
const { t } = useI18n();
const { hasAccess2SaveTerritioryLevel } = useSettingsTerritoriesAccess();
const isLoading = ref<boolean>(true);
const isSaving = ref<boolean>(false);
const levels = ref<TerritoryLevelModel[]>([]);
const fetchedLevelCount = ref<number>(0); // Track number of originally fetched levels

// hooks
onMounted(async () => {
  await loadLevels();
});

// computed
const displayLevels = computed(
  (): (TerritoryLevelModel & { isExisting: boolean })[] => {
    // Mark levels as existing if they were part of the original fetch
    return levels.value.map((level, index) => ({
      ...level,
      isExisting: index < fetchedLevelCount.value,
    }));
  },
);

// methods
const loadLevels = async () => {
  isLoading.value = true;
  try {
    const data = await territoriesStore.getLevelList();
    levels.value = data!;
    fetchedLevelCount.value = data?.length || 0; // Store count of fetched levels
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isLoading.value = false;
  }
};

const itemLevelIndentation = (idx: number) => {
  return {
    "--level-indent": \`\${idx * 50}px\`,
  };
};

const onLevelNameChange = (idx: number, value: string) => {
  if (idx < levels.value.length) {
    levels.value[idx].default_name = value;
    levels.value[idx].default_name = value;
  }
};

const onLevelNameL10nChange = (idx: number, value: SupportedCulturesModel) => {
  if (idx < levels.value.length) {
    levels.value[idx].name_l10n = {
      ...(value || {}),
    };
  }
};

const onAddLevel = () => {
  const nextLevel = levels.value.length + 1;
  levels.value.push({
    default_name: "",
    name_l10n: {},
    level: nextLevel,
    is_used: false,
  });
};

const onRemoveLevel = (idx: number) => {
  // Remove the level and all levels after it
  levels.value = levels.value.slice(0, idx);
};

const onSave = async () => {
  const levelsToSave = levels.value.filter(
    (level) => level.default_name.trim() !== "",
  );

  if (levelsToSave.length === 0) {
    notify({ title: t("toast.error"), type: "error" });
    return;
  }

  const payload = levelsToSave.map(({ default_name, level, name_l10n }) => ({
    default_name,
    level,
    name_l10n,
  }));

  isSaving.value = true;
  try {
    const res = await territoriesStore.saveLevelNames(payload);
    if (res !== "error") {
      await loadLevels();
      notify({ title: t("toast.saved"), type: "success" });
    } else {
      notify({ title: t("toast.error"), type: "error" });
    }
  } catch (error) {
    notify({ title: t("toast.error"), type: "error" });
  } finally {
    isSaving.value = false;
  }
};
<\/script>

<style scoped>
.manage-level-names {
  height: 100%;
  display: flex;
  position: relative;
  overflow: auto;
}

.levels-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: var(--level-indent, 0px) !important;
  position: relative;
  min-height: 48px;
}

/* Vertical line from parent - stops at this item */
.level-item:not(.is-first)::before {
  content: "";
  position: absolute;
  left: 18px;
  top: -45px;
  height: 70px;
  width: 10px;
  border-left: 1px solid theme("colors.neutral.200");
  border-bottom: 1px solid theme("colors.neutral.200");
  border-bottom-left-radius: 8px;
}

.level-item:nth-child(2)::before {
  top: -11px;
  height: 36px;
}

/* Horizontal line connecting to the number badge */
.level-item:not(.is-first)::after {
  content: "";
  position: absolute;
  left: 28px;
  top: 24px;
  width: calc(var(--level-indent, 0px) - 32px);
  border-bottom: 1px solid theme("colors.neutral.200");
  border-bottom-left-radius: 8px;
}

.level-number {
  width: 36px;
  height: 36px;
  min-width: 36px;
  background-color: #299b9b;
  color: white;
  border-radius: 8px;
  font-weight: 500;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.level-input-wrapper {
  flex: none; /* disables full stretch */
}

.level-input {
  display: inline-block;
  min-width: 88px;
  width: auto;
}

.level-input:deep(input) {
  height: 36px !important;
}
</style>
`;export{e as default};
