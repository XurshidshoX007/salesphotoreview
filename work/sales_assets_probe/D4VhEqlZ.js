const n=`<template>
  <DropdownMenu
    :model-value="currentCulture?.name"
    :options="languageOptions"
    checkable
    class="w-full"
    :content-width="200"
    @select="changeLanguage"
  >
    <template #trigger="{ isOpen }">
      <div class="language-btn">
        <div class="section-lang-btn">
          <img
            v-if="currentCulture?.flag"
            :src="getIconUrl(currentCulture.flag)"
            :alt="currentCulture.display_name"
            class="flag"
          />
          <div class="title">
            {{ currentCulture?.display_name || currentLang }}
          </div>
        </div>
        <icon-arrow-bottom
          color="#525866"
          :class="[
            (isOpen && 'rotate-180 transition-all') ||
              'rotate-0 transition-all',
          ]"
        />
      </div>
    </template>

    <template #item-prefix="{ option }">
      <img :src="option.flag" :alt="option.name" class="flag" />
    </template>
  </DropdownMenu>
</template>

<script setup lang="ts">
import { clearLibConstants } from "~/utils/local-storage";

const { cultures, currentLang, setLanguage, loadCultures, getIconUrl } =
  useLocalization();

const isSameLanguage = (first: string, second: string) => {
  const normalizedFirst = first.toLowerCase();
  const normalizedSecond = second.toLowerCase();

  return (
    normalizedFirst === normalizedSecond ||
    normalizedFirst.startsWith(\`\${normalizedSecond}-\`) ||
    normalizedSecond.startsWith(\`\${normalizedFirst}-\`)
  );
};

const currentCulture = computed(() => {
  return cultures.value.find((culture) =>
    isSameLanguage(culture.name, currentLang.value),
  );
});

const languageOptions = computed(() =>
  cultures.value.map((culture) => ({
    label: culture.display_name || culture.name,
    value: culture.name,
    flag: culture.flag ? getIconUrl(culture.flag) : "",
  })),
);

const isCurrentCulture = (cultureName: string) => {
  return isSameLanguage(cultureName, currentLang.value);
};

const changeLanguage = (option: { value: string }) => {
  if (isCurrentCulture(option.value)) return;
  setLanguage(option.value);
  clearLibConstants();
};

onMounted(async () => {
  await loadCultures();
});
<\/script>

<style scoped lang="scss">
.language-btn {
  gap: 8px;
  width: 100%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .section-lang-btn {
    display: flex;
    align-items: center;
    gap: 8px;

    .title {
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: theme("colors.neutral.950");
    }
  }
}

.flag {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 50%;
}
</style>
`;export{n as default};
