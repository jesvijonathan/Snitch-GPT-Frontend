<template>
  <div>
    <canvas class="chart_can_polar" :id="chartId"></canvas>
  </div>
</template>

<style>
.chart_can_polar {
  width: 15vw;
}
</style>

<script setup>
import { ref, onMounted, defineProps } from "vue";
import Chart from "chart.js/auto";

const props = defineProps(["ChartData", "ChartName"]);
const chartId = ref(`myChart-${Math.random().toString(36).substr(2, 9)}`);

let myChart;

onMounted(() => {
  const canvas = document.getElementById(chartId.value);
  const ctx = canvas.getContext("2d");

  const data = props.ChartData;
  const labels = Object.keys(data);
  const values = Object.values(data).map((val) => {
    if (val == null || val == undefined || isNaN(val)) {
      return 0.0;
    } else if (val > 1) {
      return 1.0;
    } else if (val < 0) {
      return 0.0;
    }
    return val;
  });

  myChart = new Chart(ctx, {
    type: "polarArea",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Score",
          data: values.map((val) => val * 100),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: ["white", "#fff"],
          borderWidth: 0.3,
          borderRadius: 1,
          cutout: "70%",
        },
      ],
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: props.ChartName,
          position: "bottom",
          padding: 10,
        },
        legend: {
          position: "right",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          display: false,
        },
      },
    },
  });
});
</script>
