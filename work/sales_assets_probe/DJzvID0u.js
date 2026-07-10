const t=`<template>
  <div class="w-full border-grey rounded-large">
    <DataTableCommon
      :headers="closuresStore.templatesSettingNew"
      @selectFormat="selectFormat = $event"
      @getAllId="getAllId"
    >
      <template #body>
        <c-tr
          v-for="(data, index) in closuresStore.data"
          :key="data"
          class="border-b-0"
        >
          <c-td-no-edit
            :class="
              index + 1 === closuresStore?.data?.length && 'c-td-css-bottom'
            "
          >
            <Checkbox
              :checked="data.is_active"
              @change="onSelect($event, data.type.id)"
              :title="data.type.name"
            />
          </c-td-no-edit>
          <c-td-no-edit
            :class="
              index + 1 === closuresStore?.data?.length && 'c-td-css-bottom'
            "
          >
            <div class="flex justify-end">
              <div v-if="selectFormat === 'date'">
                <div class="w-41">
                  <DInputDatePicker
                    left
                    withoutTime
                    :value="data.limit_start_date || null"
                    @change="changeAction($event, data.type.id, 'date')"
                  />
                </div>
              </div>
              <div v-else>
                <DInput
                  class="h-10.125 w-41"
                  placeholder="Входить"
                  type="number"
                  :value="data?.limit_start_day"
                  @change="changeAction($event, data.type.id, 'day')"
                />
              </div>
            </div>
          </c-td-no-edit>
        </c-tr>
      </template>
    </DataTableCommon>
  </div>
  <div class="flex justify-end">
    <div class="flex flex-row mt-2 items-center justify-between gap-2">
      <m-btn :loading="closuresStore.loadingSave" @click="onFinish">{{
        t("save")
      }}</m-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
// Store
import { useClosedStore } from "~/stores/settings/closures/closures";
import { useI18n } from "vue-i18n";

const closuresStore = useClosedStore("main");

// State
const { t } = useI18n();
let selectFormat = ref(null);

// Methods
const getAllId = (is_active: boolean) => {
  closuresStore.data = closuresStore.data?.map((item: any) => {
    item.is_active = is_active;
    return item;
  });
};

const onSelect = (is_active: boolean, type: string) => {
  closuresStore.data = closuresStore.data?.map((item: any) => {
    if (item.type.id === type) {
      item.is_active = is_active;
      return item;
    }
    return item;
  });
};

onMounted(() => {
  closuresStore.getData();
});

const changeAction = (date: any, id: number, status: string) => {
  closuresStore.data = closuresStore.data?.map((item: any) => {
    if (item.type.id === id) {
      if (status === "date") {
        item.limit_start_date = getFormattedDate(date, "YYYY-MM-DD");
        delete item.limit_start_day;
      } else {
        delete item.limit_start_date;
        item.limit_start_day = date;
      }
    }
    return item;
  });
};

const onFinish = async () => {
  const closed_action =
    closuresStore.data
      ?.filter((item: any) => item.limit_start_day || item.limit_start_date)
      .map((item: any) => ({
        ...item,
        type: item.type.id,
      })) || [];

  if (closed_action.length > 0) {
    await closuresStore.save(closed_action);
  }
};
<\/script>

<style lang="scss">
.c-td-css-bottom {
  border-radius: 0 0 12px 12px;
}
</style>
`;export{t as default};
