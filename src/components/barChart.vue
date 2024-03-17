<template>
  <div>
    <canvas class="chart_can" :id="chartId"></canvas>
  </div>
</template>

<style>
.chart_can {
  height: 30vw;
  width: 30vw;
}
</style>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

const chartId = ref(`myChart-${Math.random().toString(36).substr(2, 9)}`);

const props = defineProps(["model_bar", "reg_data"]);

let myChart;

onMounted(() => {
  const canvas = document.getElementById(chartId.value);

  const ctx = canvas.getContext("2d");

  if (model_bar) {
    let chartData = {};
    for (let i = 0; i < model_bar.length; i++) {
      chartData[model_bar[i].model] = model_bar[i].score;
    }
  }

  let chartData = {
    name_1: 0.34,
    name_2: 0.66,
    name_3: 0.5,
  };

  myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(chartData),
      datasets: [
        {
          label: "Chart Name",
          data: Object.values(chartData),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
          ],
          borderWidth: 1,
        },
      ],
    },
  });
});
</script>
