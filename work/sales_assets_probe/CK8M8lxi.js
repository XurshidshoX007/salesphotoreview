const n=`<template>
  <div class="flex flex-col gap-4">
    <ClientsAboutClientsFilterCard @clear-fetched-tabs="clearFetchedTabs" />
    <div class="flex h-[400px]">
      <div class="rounded-lg border p-3 w-full">
        <page-title20 :title="t('clients.sales')" />
        <div class="h-[350px]">
          <Line :data="filteredDataLine" :options="options" />
        </div>
      </div>
    </div>
    <div class="flex h-[400px]">
      <div class="rounded-lg border p-3 w-full">
        <page-title20 :title="t('clients.sales')" />
        <div class="h-[350px]">
          <Bar :data="filteredDataBar" :options="options" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Line, Bar } from "vue-chartjs";
import { useI18n } from "vue-i18n";
import moment from "moment";

// store
const clientsOrdersStore = useClientsOrdersStore("main");

// emits
const emit = defineEmits(["clearFetchedTabs"]);

// chart-js states
const options = ref({
  responsive: true,
  maintainAspectRatio: false,
});

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
);

// state
const { t } = useI18n();
const route = useRoute();
const tabNumber = ref(7);

// hooks
const filteredDataLine = computed(() => {
  const dataLine = {
    labels: [],
    datasets: [
      {
        label: "",
        backgroundColor: "#299B9B",
        data: [],
      },
    ],
  };
  if (clientsOrdersStore.dynamicsByDay) {
    const startDate = moment(clientsOrdersStore.params.date.from);
    const endDate = moment(clientsOrdersStore.params.date.to);
    dataLine.datasets[0].label =
      t("clients.sales_last_dynamics") +
      " " +
      endDate.diff(startDate, "days") +
      " " +
      t("column.day");

    for (const dayDynamic of clientsOrdersStore.dynamicsByDay) {
      dataLine.labels.push(getFormattedDate(dayDynamic?.date, "DD MMM"));
      dataLine.datasets[0].data.push(dayDynamic?.total_sold.amount);
    }
  }

  return dataLine;
});

const filteredDataBar = computed(() => {
  const dataBar = {
    labels: [],
    datasets: [
      {
        label: t("clients.sales_month_dynamics"),
        backgroundColor: "#f87979",
        data: [],
      },
    ],
  };

  if (clientsOrdersStore.dynamicsByMonth) {
    for (const monthDynamic of clientsOrdersStore.dynamicsByMonth) {
      dataBar.labels.push(
        getFormattedDate(
          {
            year: monthDynamic.year,
            month: +monthDynamic.month.id - 1,
          },
          "MMM",
        ),
      );
      dataBar.datasets[0].data.push(monthDynamic?.total_sold.amount);
    }
  }

  return dataBar;
});

onMounted(async () => {
  clientsOrdersStore.params.client_id = route.params.id;
  await clientsOrdersStore.getSalesDynamicsByDay();
  await clientsOrdersStore.getSalesDynamicsByMonth();
});

// methods
const clearFetchedTabs = async () => {
  emit("clearFetchedTabs", tabNumber.value);
  await clientsOrdersStore.getSalesDynamicsByDay();
  await clientsOrdersStore.getSalesDynamicsByMonth();
};
<\/script>
`;export{n as default};
