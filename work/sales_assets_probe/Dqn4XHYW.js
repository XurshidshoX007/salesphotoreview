const n=`<template>
  <div class="mb-4">
    <div class="flex items-start justify-between mb-3">
      <div class="flex items-start gap-x-10">
        <div class="section">
          <div>
            <link-component
              style="font-weight: 600; font-size: 30px; line-height: 30px"
              :to="'/clients/about-clients/' + route.params.id"
              :is-linkable="hasAccess2ClientDetail"
            >
              {{ clientDetail?.name }}
            </link-component>
            <div class="key" style="font-size: 18px">
              {{ clientDetail?.legal_name }}
            </div>
          </div>
        </div>
        <div class="section">
          <div class="key">{{ t("dashboard.tel") }}:</div>
          <a
            :href="'tel:' + clientDetail?.phone"
            class="underline text-[#299B9B]"
          >
            {{ clientDetail?.phone }}
          </a>
        </div>
        <div class="section">
          <div class="key">{{ t("settings_sidebar.territory") }}:</div>
          {{ clientDetail?.territory?.name }}
        </div>
      </div>
      <div class="flex gap-x-5 items-center">
        <Checkbox
          id="hide-total-block"
          :title="t('dashboard.show_shared_block')"
          :checked="hideTotalBlock"
          @change="onHideTotalBlock"
        />
        <m-btn
          :loading="clientsBalancesStore.isSubBalanceCardsLoading"
          @click="refreshBalanceCards"
          min-padding
        >
          {{ t("refresh_data") }}
        </m-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { useClientsAccess } from "~/composables/access/clients/clients";

//store
const clientsBalancesStore = useClientsBalancesStore("main");

// emits
const emit = defineEmits(["onHideTotalBlock", "refreshFunction"]);

// state
const { hasAccess2Detail: hasAccess2ClientDetail } = useClientsAccess();
const { t } = useI18n();
const route = useRoute();
const clientDetail = ref();
const hideTotalBlock = ref(getOpenedItemsByKey("hideTotalBlock"));

// hooks
onMounted(async () => {
  if (route.params.id) {
    clientDetail.value = await clientsBalancesStore.clientBalanceDetailInfo(
      route.params.id,
    );
  }
});

// methods
const onHideTotalBlock = (isChecked: boolean) => {
  hideTotalBlock.value = isChecked;
  setOpenedItemsToLocalByKey("hideTotalBlock", isChecked);
  emit("onHideTotalBlock", isChecked);
};

const refreshBalanceCards = () => {
  emit("refreshFunction");
};
<\/script>

<style scoped lang="scss">
.section {
  align-items: center;
  gap: 0 10px;
  display: flex;

  .key {
    font-weight: 600;
    font-size: 14px;
    color: #013636;
    font-family: "Inter", sans-serif;
  }

  .tag {
    background: white;
    border-radius: 16px;
    padding: 4px 12px;
    color: #424f4f;
    font-size: 16px;
    font-family: "Inter", sans-serif;
    background: rgba(0, 0, 0, 0.1);
    cursor: default;
  }

  .tag-a {
    background: white;
    border-radius: 16px;
    padding: 4px 12px;
    color: #424f4f;
    font-size: 16px;
    font-family: "Inter", sans-serif;
    position: relative;
    cursor: default;
  }
}
</style>
`;export{n as default};
