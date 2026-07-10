const n=`<template>
  <div class="flex justify-center items-center min-h-15">
    <div v-if="chartData.labels?.length > 0" class="chart-container">
      <Doughnut :data="chartData" :options="options" />
    </div>
    <page-title20 v-else title="Нет информации" />
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  ArcElement,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import { Doughnut } from "vue-chartjs";
import { ref, onMounted } from "vue";

const supervisorByProductCategoryStore =
  useDashboardProductCategoryGroupStore("main");

const props = defineProps({
  categories: Array,
  amount: {
    type: Array,
    default: () => [3, 5, 6, 9, 10],
  },
  name: {
    type: Array,
    default: () => ["Aziz", "Botir", "Mirvali", "Ganisher"],
  },
  color: {
    type: Array,
    default: () => ["#009922", "#ccc"],
  },
  params: Object,
  isActive: Boolean,
});

const colors = [
  "#336666",
  "#D48C1E",
  "#1B2CC3",
  "#BB72F4",
  "#BB0A0A",
  "#DD7F00",
  "#178704",
  "#faef01",
  "#91fa01",
  "#01fa1d",
  "#01fac3",
  "#01fafa",
  "#01b2fa",
  "#1701fa",
  "#a701fa",
  "#fa01ef",
  "#fa0186",
  "#fa0133",
  "#fa9101",
  "#000000",
  "#ff9a68",
  "#943709",
  "#786803",
  "#488a08",
  "#014401",
  "#29a277",
  "#299ca2",
  "#1c509f",
];

const chartData = ref({
  labels: [],
  datasets: [
    {
      data: [],
      backgroundColor: colors,
    },
  ],
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      align: "start",
      position: "bottom",
      labels: {
        boxWidth: 20,
        borderRadius: 8,
        boxHeight: 20,
        font: {
          size: 14,
          family: '"Inter", sans-serif',
          weight: "400",
        },
      },
    },
    tooltip: {
      callbacks: {
        label: function (tooltipItem) {
          return \`\${tooltipItem.label}: \${tooltipItem.raw}%\`; // Customize tooltip label
        },
      }, // Background color of the tooltip
      titleFont: {
        size: 14,
        family: '"Inter", sans-serif',
        weight: "400",
      },
      bodyFont: {
        size: 12, // Font size for tooltip body
        family: '"Inter", sans-serif',
        weight: "400",
      },
    },
    // Additional plugin customizations can be added here
  },
};
// methods

const getChartData = async () => {
  const newLabels = [];
  const newData = [];

  supervisorByProductCategoryStore.dataChart?.forEach((item) => {
    newLabels.push(\`\${item.name.name}\`);
    newData.push(item.percentage);
  });

  chartData.value = {
    labels: newLabels,
    datasets: [
      {
        label: "Процент",
        backgroundColor: colors,
        data: newData,
      },
    ],
  };
};

// hooks

watch(
  () => supervisorByProductCategoryStore.dataChart,
  () => {
    getChartData();
  },
);
watch(
  () => props.params,
  async (newParams, oldParams) => {
    supervisorByProductCategoryStore.params = {
      ...supervisorByProductCategoryStore.params,
      ...props.params,
    };
    if (newParams && !props.isActive) {
      await supervisorByProductCategoryStore.getChartData();
    }
  },
  { deep: true },
);

ChartJS.register(
  CategoryScale,
  LinearScale,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
);
<\/script>

<style lang="scss">
.chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  width: 100%;
  min-height: 375px;
  gap: 24px;

  Doughnut {
    min-height: 300px;
  }
}

.chart-container .chart-js-legend {
  display: flex;
  justify-content: space-between; /* Distributes legend items with space between them */
  width: 33%; /* Sets the width of the legend container */
  margin: 0 auto; /* Centers the legend container horizontally */
}
</style>
`;export{n as default};
