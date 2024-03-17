<template>
  <div>
    <canvas class="char_can" :id="chartId"></canvas>
  </div>
</template>

<style></style>

<script setup>
import { ref, onMounted, defineProps } from "vue";
import Chart from "chart.js/auto";

const props = defineProps(["ChartValue", "ChartName"]);

const chartId = ref(`myChart-${Math.random().toString(36).substr(2, 9)}`);

let myChart;

onMounted(() => {
  const canvas = document.getElementById(chartId.value);
  const ctx = canvas.getContext("2d");

  let chartval = props.ChartValue;
  if (
    chartval == null ||
    chartval == undefined ||
    chartval == "" ||
    isNaN(chartval)
  ) {
    chartval = 0.0;
  } else if (chartval > 1) {
    chartval = 1.0;
  } else if (chartval < 0) {
    chartval = 0.0;
  }

  myChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [
        {
          label: "Score",
          data: [chartval * 100, 100 - chartval * 100],
          backgroundColor: ["white", "transparent"],
          borderColor: ["white", "#fff"],
          borderWidth: 0.1,
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
          padding: 20,
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

<style>
.char_can {
  height: 7vw;
  width: 7vw;
}
</style>
