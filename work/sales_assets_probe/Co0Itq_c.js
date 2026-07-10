const e=`<template>
  <div class="table-content-container">
    <div class="table-content-header">
      {{ t("plan.setting_plans.total_plans_by_users") }}
    </div>
    <data-table :headers="headers" :is-empty="!totalsByUsers?.length">
      <template #body>
        <c-tr
          v-for="item in totalsByUsers"
          :key="item.id"
          class="last-border-b-0"
        >
          <c-td-no-edit v-for="key in headers" :key="key.key">
            <template v-if="key.type === 'values'">
              <template v-for="type in valueTypes" :key="type.id">
                <template v-if="key.key === type.id.toString()">
                  {{
                    item.data_values?.find((dv) => dv.value_type === type.id)
                      ?.value || null
                  }}
                </template>
              </template>
            </template>
            <template v-if="key.key === 'role'">
              {{ getRoleName(item.role) }}
            </template>
            <template v-else>
              {{ getValue(item, key.key, key.type) }}
            </template>
          </c-td-no-edit>
        </c-tr>
      </template>
    </data-table>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { getDataValue, type SettingPlanListModel } from "#imports";

// types
type TotalsByUsersDataType = {
  id: string;
  name: string;
  role: number;
  data_values: Array<{ value_type: number; value: string | number }>;
};

// props
const props = defineProps<{
  data: SettingPlanListModel[] | undefined;
  valueTypes: ConstantModel[];
  roles: ConstantModel[];
}>();

// states
const { t } = useI18n();

const headers = computed<Template[]>(() => [
  {
    name: t("column.full_name"),
    key: "name",
    is_sortable: false,
    checked: true,
  },
  {
    name: t("settings.role"),
    key: "role",
    is_sortable: false,
    checked: true,
  },
  ...props.valueTypes.map((vt) => ({
    name: vt.name,
    key: vt.id.toString(),
    checked: true,
    is_sortable: false,
    type: "values",
  })),
]);

const totalsByUsers = computed<TotalsByUsersDataType[]>(() => {
  if (!props.data?.length) return [];

  const totalsByEmployee = new Map<
    string,
    {
      id: string;
      name: string;
      role: number;
      totals: Map<number, number>;
    }
  >();

  for (const group of props.data) {
    if (!group.children?.length) continue;

    for (const child of group.children) {
      let entry = totalsByEmployee.get(child.id);
      if (!entry) {
        entry = {
          id: child.id,
          name: child.name || "",
          role: child.role,
          totals: new Map<number, number>(),
        };
        totalsByEmployee.set(child.id, entry);
      }

      if (!child.data_values?.length) continue;

      for (const dv of child.data_values) {
        if (typeof dv.value !== "number") continue;
        entry.totals.set(
          dv.value_type,
          (entry.totals.get(dv.value_type) ?? 0) + dv.value
        );
      }
    }
  }

  return [...totalsByEmployee.values()].map((entry) => ({
    id: entry.id,
    name: entry.name,
    role: entry.role,
    data_values: [...entry.totals.entries()].map(([value_type, value]) => ({
      value_type,
      value: getFormattedAmount(value),
    })),
  }));
});

// methods
const getRoleName = (roleId: number): string => {
  const role = props.roles.find((r) => r.id === roleId);
  return role ? role.name : "";
};

const getValue = (item: TotalsByUsersDataType, key: string, type?: string) => {
  return getDataValue(item, key, type);
};
<\/script>
`;export{e as default};
