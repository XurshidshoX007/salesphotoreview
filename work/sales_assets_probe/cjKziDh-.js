const n=`<template>
  <d-modal
    :name="t('settings.bonus_detail')"
    dataContainerWidth="1200px"
    :loading="loading"
    @closeDialog="onCloseDialog"
  >
    <flex-col class="gap-4">
      <div class="bonus-detail-content" v-if="!loading">
        <div class="left">
          <div class="section">
            <div class="key">{{ t("column.name") }}</div>
            <div class="value">
              {{ detailData?.name }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("column.bonus_type") }}</div>
            <div class="value">
              {{ detailData?.bonus_type?.name }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("settings.valid") }}</div>
            <div class="value">
              {{ getFormattedDate(detailData?.valid_from) }}
              {{ t("filters.to") }}
              {{ getFormattedDate(detailData?.valid_to) }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("settings_sidebar.client_category") }}</div>
            <div
              v-if="detailData?.bonus_client_categories?.length !== 0"
              class="value"
            >
              <show-more
                :show-count="2"
                :data="
                  detailData?.bonus_client_categories?.map((item) => item.name)
                "
              />
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("settings_sidebar.payment_method") }}</div>
            <div
              v-if="detailData?.bonus_currencies?.length !== 0"
              class="value"
            >
              <show-more
                :show-count="2"
                :data="detailData?.bonus_currencies?.map((item) => item.name)"
              />
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("settings_sidebar.price_type") }}</div>
            <div
              v-if="detailData?.bonus_price_types?.length !== 0"
              class="value"
            >
              <show-more
                :show-count="2"
                :data="detailData?.bonus_price_types?.map((item) => item.name)"
              />
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("settings.bonus_category") }}</div>
            <div class="value">
              {{ detailData?.bonus_category?.name }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("labels.for_who") }}</div>
            <div class="value">
              {{
                detailData?.is_public
                  ? t("settings.for_all_clients")
                  : t("settings.for_selected_clients")
              }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("column.method") }}</div>
            <div class="value">
              {{
                detailData?.is_auto
                  ? t("settings.bonus_auto")
                  : t("settings.bonus_manual")
              }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("column.status") }}</div>
            <div class="value">
              {{ detailData?.is_active ? t("active") : t("not_active") }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("labels.in_blocks") }}</div>
            <div class="value">
              {{ detailData?.in_block ? t("filters.yes") : t("filters.no") }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("column.once_per_client") }}</div>
            <div class="value">
              {{
                detailData?.once_per_client ? t("filters.yes") : t("filters.no")
              }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("settings.availability") }}</div>
            <div class="value">
              {{
                detailData?.is_special
                  ? t("settings.for_selected_clients")
                  : t("settings.for_all_clients")
              }}
            </div>
          </div>
          <div class="section">
            <div class="key">{{ t("column.product_as_ordered") }}</div>
            <div class="value">
              {{
                detailData?.must_give_same_products_as_ordered
                  ? t("filters.yes")
                  : t("filters.no")
              }}
            </div>
          </div>
        </div>
        <div class="right">
          <div class="terms-table">
            <data-table
              :headers="bonusProductTemplate"
              :withInformationAboveHeader="true"
              class="whitespace-nowrap"
            >
              <template #body>
                <c-tr class="border-b-0">
                  <c-td-no-edit class="w-1/2">
                    <div
                      v-if="detailData?.from_products?.length !== 0"
                      class="item-card"
                    >
                      <div class="fs-14">
                        <show-more
                          :show-count="20"
                          :data="
                            detailData?.from_products?.map((item) => item.name)
                          "
                        />
                      </div>
                    </div>
                  </c-td-no-edit>
                  <c-td-no-edit>
                    <div
                      v-if="detailData?.to_products?.length !== 0"
                      class="item-card"
                    >
                      <div class="fs-14">
                        <show-more
                          :show-count="20"
                          :data="
                            detailData?.to_products?.map((item) => item.name)
                          "
                        />
                      </div>
                    </div>
                  </c-td-no-edit>
                </c-tr>
              </template>
            </data-table>
          </div>
          <div
            v-if="detailData?.bonus_territories?.length !== 0"
            class="item-card"
          >
            <div class="title">{{ t("settings_sidebar.territory") }}:</div>
            <div class="item">
              <show-more
                :show-count="10"
                :data="detailData?.bonus_territories?.map((item) => item.name)"
              />
            </div>
          </div>
          <div v-if="detailData?.agent_bonuses?.length !== 0" class="item-card">
            <div class="title">{{ t("labels.attached_agents") }}:</div>
            <div class="item">
              <show-more
                :show-count="10"
                :data="detailData?.agent_bonuses?.map((item) => item.name)"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="title">{{ t("settings.conditions") }}</div>
      <div class="terms-table">
        <data-table
          :headers="detailTermsTemplate"
          :withInformationAboveHeader="true"
          class="whitespace-nowrap"
        >
          <template #body>
            <c-tr
              v-for="data in detailData?.terms"
              :key="data.id"
              class="border-b-0"
            >
              <c-td-no-edit v-for="key in detailTermsTemplate" :key="key">
                <div :class="key?.right && 'text-end'">
                  {{ getFormattedAmount(data[key.key]) }}
                </div>
              </c-td-no-edit>
            </c-tr>
          </template>
        </data-table>
      </div>
    </flex-col>
  </d-modal>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

// store
const bonusStore = useBonusesStore("true");

// emits
const emit = defineEmits(["onCloseDialog"]);

// props
const props = defineProps({
  id: String,
});

// state
const { t } = useI18n();
const selectedClientTypeTab = ref<number>(1);
const loading = ref(false);
let detailData = ref<unknown>(null);

let bonusProductTemplate = ref([
  {
    name: t("settings.products"),
    checked: true,
    key: "products",
    is_sortable: false,
  },
  {
    name: t("column.bonus_products"),
    checked: true,
    key: "bonus_products",
    is_sortable: false,
  },
]);

// hooks
onMounted(async () => {
  if (props.id) {
    loading.value = true;
    try {
      const response = await bonusStore.getDetail(props.id);
      detailData.value = response;
      selectedClientTypeTab.value = response.is_special ? 2 : 1;
      loading.value = false;
    } catch (e) {
      loading.value = false;
    }
  }
});

const termHeaderNamesByBonusType = computed(() =>
  bonusStore.getTermTitlesByBonusTypeId(detailData.value?.bonus_type?.id)
);

let detailTermsTemplate = computed(() =>
  ["min", "value", "count", "max"].map((key, index) => ({
    key,
    name: termHeaderNamesByBonusType.value[index],
    checked: true,
    is_sortable: false,
  }))
);

// methods
const onCloseDialog = () => {
  emit("onCloseDialog");
};
<\/script>

<style lang="scss" scoped>
.bonus-detail-content {
  display: flex;
  width: 100%;
  min-height: 100px;
  gap: 0 20px;
  position: relative;
  justify-content: space-between;

  .left {
    width: 40%;

    .section {
      display: flex;
      align-items: center;
      border-bottom: 1px solid #e1e4e4;
      justify-content: space-between;
      width: 100%;
      gap: 12px;
      padding: 8px 0px;

      .key {
        color: #8fa0a0;
        font-size: 14px;
        font-family: "Inter", sans-serif;
        font-weight: 400;
      }

      .value {
        color: #000000;
        font-size: 14px;
        font-family: "Inter", sans-serif;
        font-weight: 400;
      }
    }

    .section:last-child {
      border: none;
    }
  }

  .right {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 60%;

    .item-card {
      display: flex;
      gap: 3px 6px;
      flex-wrap: wrap;
      width: 100%;

      .title {
        color: rgba(0, 0, 0, 1);
        font-size: 18px;
        font-weight: 400;
        font-family: "Inter", sans-serif;
        width: 100%;
        padding-bottom: 5px;
      }

      .item {
        font-size: 14px;
        font-family: "Inter", sans-serif;
        color: rgba(143, 160, 160, 1);
        font-weight: 400;
      }
    }

    tbody {
      tr:hover {
        td {
          background: transparent !important;
        }
      }
      tr {
        td {
          align-content: start !important;
        }
      }
    }
  }

  .active-button {
    padding: 6px 10px;
    border-radius: 18px;
    gap: 10px;
    background: rgba(5, 124, 209, 0.1);
    color: #057cd1;
    font-size: 12px;
    font-weight: 400;
  }

  .not-active-button {
    padding: 7px 12px;
    border-radius: 18px;
    gap: 10px;
    background: rgba(255, 241, 241, 1);
    color: rgba(209, 5, 5, 1);
    font-size: 12px;
    font-weight: 400;
  }
}

.terms-table {
  width: 100%;
  margin-top: 0;
  border: 1px solid #d2d7d7;
  border-radius: 12px;
  overflow: hidden;
}
.title {
  color: rgba(0, 0, 0, 1);
  font-size: 18px;
  font-weight: 400;
  font-family: "Inter", sans-serif;
  width: 100%;
}
</style>
`;export{n as default};
