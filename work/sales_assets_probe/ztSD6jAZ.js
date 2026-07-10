const n=`<template>
  <div class="order-tab-group" :class="!currentTab && 'mb-5'">
    <div
      v-for="(tab, index) in visibleTabs"
      :key="tab.id"
      class="form_radio_btn"
    >
      <input
        :id="\`tab-\${index + 1}\`"
        @click="onChangeTab(tab.id)"
        :class="currentTab?.includes(tab.id) && 'active'"
        type="checkbox"
        name="tab"
      />
      <label
        :for="\`tab-\${index + 1}\`"
        :class="[
          'tab-group-item',
          tab.bgClass,
          isLastVisibleTab(index) && 'rounded-r-md',
          isFirstVisibleTab(index) && 'rounded-l-md',
        ]"
      >
        {{ t(tab.label) }}
      </label>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from "vue-i18n";
import { useOrdersAccess } from "~/composables/access/orders/orders";

// props
const props = defineProps({
  currentTab: Array,
  isOrdersSelected: Boolean,
  showStatus: Boolean,
});

// emits
const emit = defineEmits(["onChangeTab"]);

// states
const {
  hasAccess2AttachExpeditor,
  hasAccess2PrintInvoice,
  hasAccess2ChequeDownloadExcel,
  hasAccess2ChangeConsignation,
} = useOrdersAccess();

const { t } = useI18n();

// methods
const onChangeTab = (param) => emit("onChangeTab", param);

const tabs = [
  {
    id: "change-status",
    label: "orders.change_status",
    show: props.showStatus,
    bgClass: "bg-[#23C00A]",
  },
  {
    id: "set-expeditor",
    label: "orders.attach_forwarder",
    show: hasAccess2AttachExpeditor.value,
    bgClass: "bg-[#BD7F06]",
  },
  {
    id: "show-totals",
    label: "orders.totals_for_orders",
    show: true,
    bgClass: "bg-[#057CD1]",
  },
  {
    id: "change-consignation",
    label: "labels.consignation_change",
    show: hasAccess2ChangeConsignation.value,
    bgClass: "bg-[#1B2CC3]",
  },
  {
    id: "downloads",
    label: "orders.downloads",
    show: hasAccess2PrintInvoice.value,
    bgClass: "bg-[#013636]",
  },
  // {
  //   id: "cheque",
  //   label: "labels.cheque",
  //   show: hasAccess2ChequeDownloadExcel.value,
  //   bgClass: "bg-[#D10505]",
  // },
];

const visibleTabs = computed(() => tabs.filter((tab) => tab.show));

const isFirstVisibleTab = (index) => index === 0;
const isLastVisibleTab = (index) => index === visibleTabs.value.length - 1;
<\/script>

<style scoped lang="scss">
.order-tab-group {
  width: fit-content;
  display: flex;
  border-radius: 8px;
  flex-wrap: wrap;

  .tab-group-item {
    padding: 8px 16px;
    color: white;
    width: 100%;
    display: flex;
    line-height: 22px;
    align-items: center;
    font-weight: 400;
    font-size: 14px;
    white-space: nowrap;
    text-align: center;
    border-right: 1px solid theme("colors.neutral.0");
  }

  .tab-group-item:hover {
    opacity: 0.9;
  }
}

.form_radio_btn {
  display: inline-block;
}

.form_radio_btn input[type="checkbox"] {
  display: none;
  border-right: 1px solid #000;
}

.form_radio_btn label {
  display: inline-block;
  cursor: pointer;
  user-select: none;
}

@media only screen and (max-width: 1170px) {
  .order-tab-group {
    gap: 16px;

    .tab-group-item {
      border-right: none;
      border-radius: 8px;
    }
  }
}

@media only screen and (max-width: 576px) {
  .order-tab-group {
    gap: 12px;

    .form_radio_btn {
      width: 100%;
    }

    .tab-group-item {
      padding: 7.5px 16px;
    }
  }
}

@media only screen and (max-width: 767px) {
  .order-tab-group {
    gap: 12px;

    .tab-group-item {
      padding: 7.5px 16px;
    }
  }
}
</style>
`;export{n as default};
