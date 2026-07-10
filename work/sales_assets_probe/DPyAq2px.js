const n=`<template>
  <card size="compact" variant="outlined" class="readonly">
    <div
      @click="isOpen = !isOpen"
      class="flex justify-between items-center text-sm cursor-pointer"
    >
      <span>{{ t("clients.duplication.teams") }}</span>
      <div class="flex">
        <div
          v-for="(item, index) in data"
          :key="item.ordinal_number"
          class="bg-primary-600 text-white size-7 border-2 border-white rounded-full font-extrabold flex items-center justify-center leading-none"
          :style="{
            marginLeft: index === 0 ? '0' : '-8px',
            zIndex: data.length - index,
          }"
        >
          {{ item.ordinal_number }}
        </div>
      </div>
    </div>
    <transition-expand
      :is-open="isOpen"
      class="grid gap-x-4 gap-y-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    >
      <div
        v-for="team in props.data"
        :key="team.ordinal_number"
        class="mt-4 space-y-4"
      >
        <div v-for="(item, key) in fields" :key="key" class="relative">
          <d-input v-bind="resolvedFieldProps(team, key)" />
          <component
            :is="item?.prefixIcon"
            class="absolute left-3 top-1/2 -translate-y-1/2 text-primary-600 size-5"
          />
        </div>
      </div>
    </transition-expand>
  </card>
</template>

<script setup lang="ts">
import { IconGroup, IconPerson, IconVehicle } from "#components";
import { useI18n } from "vue-i18n";

type Props = {
  data: TeamModel[];
};

// Props
const props = defineProps<Props>();

// Composables
const { t } = useI18n();

// States
const isOpen = ref(false);

const fields: Partial<
  Record<
    keyof TeamModel,
    {
      label: string;
      prefixIcon: Component;
    }
  >
> = {
  ordinal_number: {
    label: t("clients.duplication.team_name"),
    prefixIcon: IconGroup,
  },
  agent: {
    label: t("users.agents.agent"),
    prefixIcon: IconPerson,
  },
  expeditor: {
    label: t("column.expeditor"),
    prefixIcon: IconVehicle,
  },
};

// Methods
const resolvedFieldProps = (team: TeamModel, key: keyof TeamModel) => {
  let value = " ";
  if (key === "ordinal_number") {
    value = \`\${t("sidebar.team")} \${team.ordinal_number}\`;
  }
  if ((key === "agent" || key === "expeditor") && team[key]) {
    value = team[key].name;
  }

  return {
    disabled: true,
    value,
    label: fields[key]?.label,
    class: "[&_input]:!pl-10",
  };
};
<\/script>

<style scoped lang="scss">
:deep(.dp__input) {
  height: 40px;
}

.readonly {
  :deep(.form-field) {
    .disabled-input {
      color: theme("colors.neutral.950") !important;
      background-color: #fafbfc !important;
      opacity: 1 !important;
    }

    label {
      left: 11px;
      top: 0;
      line-height: 16px;

      &.disabled_label {
        background: linear-gradient(0deg, #fafbfc 0%, #ffffff 100%) !important;

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
}
</style>
`;export{n as default};
