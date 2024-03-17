<template>
  <div>
    <canvas class="chart_can" :id="chartId"></canvas>
  </div>
</template>

<style>
.chart_can {
  height: 30vw;
  width: 100%;
}
</style>

<script setup>
import { ref, onMounted } from "vue";
import Chart from "chart.js/auto";

const chartId = ref(`myChart-${Math.random().toString(36).substr(2, 9)}`);

const props = defineProps(["model_bar"]);

let myChart;

onMounted(() => {
  const canvas = document.getElementById(chartId.value);

  const ctx = canvas.getContext("2d");
  let chartData = {};

  console.log(props.model_bar);

  if (props.model_bar) {
    for (let i = 0; i < props.model_bar.length; i++) {
      chartData[props.model_bar[i].model] = props.model_bar[i].score;
    }
  }

  myChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(chartData),
      datasets: [
        {
          label: "Model Score",
          data: Object.values(chartData),
          backgroundColor: [
            "rgba(255, 99, 132, 0.2)",
            "rgba(54, 162, 235, 0.2)",
            "rgba(255, 206, 86, 0.2)",
            "rgba(75, 192, 192, 0.2)",
            "rgba(153, 102, 255, 0.2)",
            "rgba(255, 159, 64, 0.2)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
            "rgba(255, 159, 64, 1)",
          ],
          borderWidth: 1,
          barThickness: (canvas.width / 100) * 10,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "right",
        },
      },
      scales: {
        y: {},
      },
    },
  });
});
</script>
