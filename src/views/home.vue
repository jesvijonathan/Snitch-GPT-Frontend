<script setup>
import { ref } from "vue";
// import axios from "axios";
// import { useRoute } from "vue-router";
import io from "socket.io-client";
import { onMounted } from "vue";
import circleChart from "../components/circleChart.vue";

import polarChart from "../components/polarChart.vue";
// import barChart from "../components/barChart.vue";
import { watch } from "vue";
import doubleBarChart from "../components/doubleBarChart.vue";

var loc = "http://127.0.0.1:5000/";

var server_status = ref({
  status: "Unknown", // Unknown, Connected, Disconnected, Free, Busy, Connecting
  no_jobs: 0, // Number of Jobs in queue
  no_connections: 0, // Number of connections
});

var user_info = ref({
  user_id: 0, // User ID
  user_no: 0, // User Number
});

let job_template = {
  job_id: 0, // Job ID
  user_id: server_status.value.user_id, // User ID
  job_name: "", // Job Name
  job_status: {
    progress: 0,
    updates: [], // Job Updates
    status: "Pending", // Pending, Processing, Completed, Failed
  },
  job_values: {
    text: "", // Text
    zero_shot: false, // Zero Shot
    text_check: true, // Text Check
    url_ratio_check: true, // URL Ratio Check
    emoji_ratio_check: true, // Emoji Check
    specialChar_ratio_check: true, // Special Char Check

    model_check: true, // Model Check
    random_seed: 0, // Random Seed | 0 default/none

    models: -1, // Model | -1 default
    parallel: -1, // Parallel | -1 default
  },

  job_result: {
    clean_text: "", // Clean Text
    urls_score: 0, // URL Score
    emoji_score: 0, // Emoji Score
    specialChar_score: 0, // Special Char Score
    text_score: 0, // Text Score

    textblob_score: {
      polarity: 0, // Polarity
      subjectivity: 0, // Subjectivity
    },

    vader_score: {
      pos: 0, // Positive
      neg: 0, // Negative
      neu: 0, // Neutral
      compound: 0, // Compound
    },
    sentiment_score: 0, // Sentiment Score
    sentiment_label: "", // Sentiment Label

    profanity_check: false, // Profanity Check
    profanity_prob: 0, // Profanity Probability
    profanity_score: 0, // Profanity Score

    one_shot_score: 0, // One Shot Score

    model_score: {
      model_avg: 0, // Model Average
      execution_time: 0, // Execution Time
      models: [
        {
          model: "", // Model
          details: "", // Details
          execution_type: "", // Execution Type
          score: 0, // Score
          time: 0, // Time
          device: "", // Device
        },
      ],
    },

    score: 0, // Score

    device: "", // Devices
    parallel: 0, // max_parallel
    max_length: 0, // Max Length
    max_memory: 0, // Max Memory
    execution_time: 0, // Time
  }, // Job Result
}; // job template

const jobs = ref([]); // Jobs

setInterval(() => {
  if (cur_job_in_focus.value.job_status.status == "Completed") {
    const elapsedTime = stopStopwatch();
  }
}, 3000);

let theme = ref("light");
function switchTheme() {
  if (theme.value == "light") {
    theme.value = "dark";
    document.styleSheets[0].insertRule(
      ".ai_input_text_cont_new { background: transparent !important; }",
      0
    );
    document.styleSheets[0].insertRule(
      ".ai_input_text_new { background: transparent !important; }",
      0
    );
  } else {
    theme.value = "light";

    document.styleSheets[0].deleteRule(0);
    document.styleSheets[0].deleteRule(0);
  }
}
function createJob() {
  startStopwatch();

  const text = messageInput.value;
  const values = { ...currentValues.value, text };

  const default_job_status = {
    progress: 0,
    updates: [], // Job Updates
    status: "Pending", // Pending, Processing, Completed, Failed
  };

  const job = {
    job_id: jobs.value.length,
    user_id: user_info.value.user_id,
    job_name: "", // Job Name
    job_status: { ...default_job_status }, // Use a copy of default_job_status
    job_values: { ...values }, // Job Values
    job_result: null,
  };

  return job;
}

const default_job_status = {
  progress: 0,
  updates: [], // Job Updates
  status: "Pending", // Pending, Processing, Completed, Failed
};

var messageInput = ref(""); // Message Input

const currentValues = ref({
  text: "", // Text
  zero_shot: false, // Zero Shot
  text_check: true, // Text Check
  url_ratio_check: true, // URL Ratio Check
  emoji_ratio_check: true, // Emoji Check
  specialChar_ratio_check: true, // Special Char Check

  model_check: true, // Model Check
  random_seed: 0, // Random Seed | 0 default/none

  models: -1, // Model | -1 default
  parallel: -1, // Parallel | -1 default
});

server_status.value["status"] = "Connecting";
var socket = io.connect(loc);

onMounted(() => {
  const inputBoxContainer = document.getElementById("input_box_container");
  const mainPanel = document.getElementById("main_panel");
  let lastScrollTop = 0;

  mainPanel.addEventListener("scroll", () => {
    if (job_screen_in_focus.value) {
      const scrollTop = mainPanel.scrollTop;

      if (scrollTop > lastScrollTop) {
        inputBoxContainer.style.transform = "translateY(120%)";
      } else {
        inputBoxContainer.style.transform = "translateY(0%)";
      }

      lastScrollTop = scrollTop;
    }
  });
});

function unfoc() {
  document.getElementById("message_input").blur();
}

function sendMessage() {
  jobs.value.push(createJob());
  currentValues.value.text = messageInput.value;

  clearInput();
  view_job(jobs.value.length - 1);

  if (server_status.value.status == "Disconnected") {
    server_status.value.status = "Connecting";
    socket.connect();
    while (server_status.value.status == "Disconnected") {
      setTimeout(() => {
        console.log("waiting for connection");
      }, 5000);
    }
    if (server_status.value.status == "Disconnected") {
      console.log("Server is disconnected");
      return;
    }
  }
  socket.emit("values", jobs.value[jobs.value.length - 1]);

  unfoc();
  try {
    setTimeout(() => {
      document.getElementById("console_live").scrollIntoView();
    }, 500);
  } catch (err) {
    console.log(err);
  }
}

function clearInput() {
  document.getElementById("input_box_container").style.transform =
    "translateY(0%)";
  messageInput.value = "";
  inputcheck();
}

function reloadPrevious() {
  if (jobs.value.length == 0) {
    return;
  }
  let job_id = jobs.value.length - 1;
  messageInput.value = jobs.value[job_id].job_values.text;
  inputcheck();
}

function stopConnection() {
  // Logic to stop the connection
}

// stop connection
socket.on("disconnect", function () {
  server_status.value = {
    status: "Disconnected",
    no_jobs: 0,
    no_connections: 0,
  };
});

// disconnect
socket.on("disconnecting", function () {
  server_status.value = {
    status: "Disconnected",
    no_jobs: 0,
    no_connections: 0,
  };
});

// if no internet connection
socket.on("connect_error", function () {
  server_status.value = {
    status: "Disconnected",
    no_jobs: 0,
    no_connections: 0,
  };
});

socket.on("server_status", function (data) {
  for (let key in server_status.value) {
    if (key in data) {
      server_status.value[key] = data[key];
    }
  }
});

let startTime;
let stopwatchInterval;
let timer = ref(0.0);

function startStopwatch() {
  startTime = Date.now();
  stopwatchInterval = setInterval(updateStopwatch, 1000);
}

function updateStopwatch() {
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
  const formattedTime = formatTime(elapsedTime);
  timer.value = formattedTime
    .split(":")
    .reduce((acc, time) => acc * 60 + +time);
  console.log(formattedTime);
}

function stopStopwatch() {
  clearInterval(stopwatchInterval);
  const currentTime = Date.now();
  const elapsedTime = currentTime - startTime;
  const formattedTime = formatTime(elapsedTime);
  return formattedTime;
}

function formatTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  const formattedSeconds = seconds.toString().padStart(2, "0");
  const formattedMinutes = minutes.toString().padStart(2, "0");
  const formattedHours = hours.toString().padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

socket.on("user_info", function (data) {
  console.log(data);
  user_info.value = data;
});

socket.on("message", function (data) {
  console.log(data);
});

function check_add_job_status(job_id, job_status) {
  if (job_status == undefined) {
    return;
  }

  for (let key in default_job_status) {
    if (key in job_status) {
      if (key == "updates") {
        for (let update of job_status[key]) {
          if (!jobs.value[job_id].job_status[key].includes(update)) {
            jobs.value[job_id].job_status[key].push(update);
          }
        }
      } else {
        jobs.value[job_id].job_status[key] = job_status[key];
      }
    }
  }
}

socket.on("job_status", function (data) {
  console.log("########", data);
  check_add_job_status(data.job_id, data.job_status);
});

function check_add_job_result(job_id, job_result) {
  if (job_result == undefined) {
    return;
  }
  if (!jobs.value[job_id].job_result) {
    jobs.value[job_id].job_result = {};
  }
  for (let key in job_template.job_result) {
    if (key in job_result) {
      jobs.value[job_id].job_result[key] = job_result[key];
    }
  }
}

socket.on("job_result", function (data) {
  console.log("########", data);
  check_add_job_result(data.job_id, data.job_result);
  console.log(jobs.value[data.job_id]);
});

function check_add_job_values(job_id, job_values) {
  if (job_values == undefined) {
    return;
  }
  for (let key in currentValues.value) {
    if (key in job_values) {
      jobs.value[job_id].job_values[key] = job_values[key];
    }
  }
}

socket.on("job_values", function (data) {
  console.log("########", data);
  check_add_job_values(data.job_id, data.job_values);
});

socket.on("job", function (data) {
  console.log(data);
  check_add_job_status(data.job_id, data.job_status);
  check_add_job_result(data.job_id, data.job_result);
  check_add_job_values(data.job_id, data.job_values);
});

let processing = ref(false);

watch(jobs, (newVal, oldVal) => {
  console.log("jobs changed", newVal);
  console.log("jobs changed", oldVal);
});

var isInputFocused = ref(false);
function handleInputFocus() {
  isInputFocused.value = true;
}

function handleInputBlur() {
  isInputFocused.value = false;
}

var job_panel_expanded = ref(false);
function expand_job_panel() {
  console.log("expand job panel");
  if (job_panel_expanded.value) {
    job_panel_expanded.value = false;

    document.getElementById("job_panel").style.transform = "translateX(0)";
    document.getElementById("job_panel").style.width = "20vw";
    // document.getElementsByClassName("job_panel_tag")[0].style.left = "20vw";
    document.getElementsByClassName("job_panel_cont")[0].style.opacity = "1";
  } else {
    job_panel_expanded.value = true;

    document.getElementById("job_panel").style.transform = "translateX(-19vw)";
    document.getElementById("job_panel").style.width = "0vw";
    // document.getElementsByClassName("job_panel_tag")[0].style.left = "20";

    document.getElementsByClassName("job_panel_cont")[0].style.opacity = "0";
  }
}

function connect_server(swicth = true) {
  if (swicth) {
    socket.connect();
  } else {
    socket.disconnect();
  }
}

function new_chat(text = "") {
  console.log("new chat");
  if (text != "") {
    messageInput.value = text;
  }
  job_screen_in_focus.value = false;
  remove_act();

  document.getElementById("input_box_container").style.transform =
    "translateY(0%)";
  document.getElementById("message_input").focus();
}

var job_screen_in_focus = ref(false);
var cur_job_in_focus = ref({
  job_id: 0,
  job_name: "",
  job_status: "",
  job_values: "",
  job_result: "",
});

function remove_act() {
  let tab = document.getElementById("job_tabs");
  for (let i = 0; i < tab.children.length; i++) {
    tab.children[i].classList.remove("tab_act");
  }
}

function refresh_visual() {
  shirnk_visual_mode.value = !shirnk_visual_mode.value;

  setTimeout(() => {
    shirnk_visual_mode.value = !shirnk_visual_mode.value;
  }, 50);
}

function view_job(job_id) {
  job_screen_in_focus.value = true;

  cur_job_in_focus.value = jobs.value[job_id];

  let tab = document.getElementById("job_tabs");

  remove_act();
  if (tab.children[job_id]) {
    tab.children[job_id].classList.add("tab_act");
  }
  unfoc();

  // refresh_visual();
  tab.scrollTo(0, 0);
  refresh_visual();
}

function delete_job(job_id) {
  console.log("delete job", job_id);
  jobs.value.splice(job_id, 1);
  if (jobs.value.length > 0) {
    view_job(jobs.value.length - 1);
  } else {
    job_screen_in_focus.value = false;
  }
}

function inputcheck() {
  if (messageInput.value == "") {
    return "1.2vw";
  } else {
    return texarea_height.value + "vw";
  }
}

function download_job(job_id) {
  console.log("download job", job_id);
  var jobData = JSON.stringify(jobs.value[job_id], null, 2);
  var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(jobData);
  var downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "job_" + job_id + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
}

let texarea_height = ref(0);

let result_json_mode = ref(true);
let shrink_result_mode = ref(false);
let shrink_console_mode = ref(false);
let shirnk_visual_mode = ref(true);

function shrink_result() {
  shrink_result_mode.value = !shrink_result_mode.value;

  if (shrink_result_mode.value) {
    document.getElementById("result_json").style.display = "none";
  } else {
    document.getElementById("result_json").style.display = "block";
  }
}

function adjustTextareaHeight(event) {
  let a = document.getElementById("input_box");
  let b = document.getElementById("message_input");
  let height = (b.value.length / 75) * 1.2;
  let auto = false;
  if (height < 1.2) {
    height = 1.2;
  }
  if (height > 10) {
    height = 10;
    auto = true;
  }

  if (auto) {
    b.style.height = "10vw";
    b.style.overflowY = "auto";
  } else {
    b.style.height = height + "vw";
  }

  a.style.height = height + "vw";
  texarea_height.value = height;
}
</script>

<template>
  <!-- 

    Exmaple input recieved : 

    job_status : 
    {
  "progress": 1,
  "updates": [
    "Processing...",
    "Inspecting text...",
    "Cleaning text...",
    "Analyzing text...",
    "Checking for profanity...",
    "Calculating text scores...",
    "Analyzing sentiment...",
    "Calculating final score...",
    "Initial Analysis Completed",
    "Zero_Shot_Check (Negative)",
    "Model Evaluation started..",
    "Evaluating models parallely in 2 threads..",
    "Evaluating model 1...",
    "Evaluating model 2...",
    "Model 1 completed..",
    "Model 2 completed..",
    "Model evaluation completed..",
    "Model Evaluation completed..",
    "Wrapping up...",
    "Processed successfully",
    "Completed",
    "The text is AI generated, with an 'AI-Written' Probability Score : (0.93)"
  ],
  "status": "Completed"
}


job_result : 
{
  "clean_text": "this line performs the same functionality as the original two lines it searches for the model name in the dataset models string representation and assigns it to modelname if found otherwise defaults to unknown",
  "urls_score": 0,
  "emoji_score": 0,
  "specialChar_score": 0.20588235294117646,
  "profanity_check": false,
  "profanity_prob": 0.027414175301452005,
  "profanity_score": 0.030155592831597206,
  "text_score": 0.013725490196078431,
  "textblob_score": {
    "polarity": 0.09166666666666667,
    "subjectivity": 0.4916666666666667
  },
  "vader_score": { "compound": 0.3182, "neu": 0.935, "pos": 0.065, "neg": 0 },
  "sentiment_score": 0.09166666666666667,
  "sentiment_label": "Neutral",
  "one_shot_score": 0.12182225949826388,
  "model_score": {
    "models": [
      {
        "model": "Model (1: DebertaModel)",
        "details": "DAIGTModel(\n (model): DebertaModel(\n (embeddings): DebertaEmbeddings(\n (word_embeddings): Embedding(50265, 1024, padding_idx=0)\n (LayerNorm): DebertaLayerNorm()\n (dropout): StableDropout()\n )\n (encoder): DebertaEncoder(\n (layer): ModuleList(\n (0-23): 24 x DebertaLayer(\n (attention): DebertaAttention(\n (self): DisentangledSelfAttention(\n (in_proj): Linear(in_features=1024, out_features=3072, bias=False)\n (pos_dropout): StableDropout()\n (pos_proj): Linear(in_features=1024, out_features=1024, bias=False)\n (pos_q_proj): Linear(in_features=1024, out_features=1024, bias=True)\n (dropout): StableDropout()\n )\n (output): DebertaSelfOutput(\n (dense): Linear(in_features=1024, out_features=1024, bias=True)\n (LayerNorm): DebertaLayerNorm()\n (dropout): StableDropout()\n )\n )\n (intermediate): DebertaIntermediate(\n (dense): Linear(in_features=1024, out_features=4096, bias=True)\n (intermediate_act_fn): GELUActivation()\n )\n (output): DebertaOutput(\n (dense): Linear(in_features=4096, out_features=1024, bias=True)\n (LayerNorm): DebertaLayerNorm()\n (dropout): StableDropout()\n )\n )\n )\n (rel_embeddings): Embedding(1024, 1024)\n )\n )\n (classifier): Linear(in_features=1024, out_features=1, bias=True)\n)",
        "execution_type": "Parallel",
        "score": 0.891338050365448,
        "time": 1.5258047580718994,
        "device": "GPU"
      },
      {
        "model": "Model (2: DebertaV2Model)",
        "details": "DAIGTModel(\n (model): DebertaV2Model(\n (embeddings): DebertaV2Embeddings(\n (word_embeddings): Embedding(128100, 1024, padding_idx=0)\n (LayerNorm): LayerNorm((1024,), eps=1e-07, elementwise_affine=True)\n (dropout): StableDropout()\n )\n (encoder): DebertaV2Encoder(\n (layer): ModuleList(\n (0-23): 24 x DebertaV2Layer(\n (attention): DebertaV2Attention(\n (self): DisentangledSelfAttention(\n (query_proj): Linear(in_features=1024, out_features=1024, bias=True)\n (key_proj): Linear(in_features=1024, out_features=1024, bias=True)\n (value_proj): Linear(in_features=1024, out_features=1024, bias=True)\n (pos_dropout): StableDropout()\n (dropout): StableDropout()\n )\n (output): DebertaV2SelfOutput(\n (dense): Linear(in_features=1024, out_features=1024, bias=True)\n (LayerNorm): LayerNorm((1024,), eps=1e-07, elementwise_affine=True)\n (dropout): StableDropout()\n )\n )\n (intermediate): DebertaV2Intermediate(\n (dense): Linear(in_features=1024, out_features=4096, bias=True)\n (intermediate_act_fn): GELUActivation()\n )\n (output): DebertaV2Output(\n (dense): Linear(in_features=4096, out_features=1024, bias=True)\n (LayerNorm): LayerNorm((1024,), eps=1e-07, elementwise_affine=True)\n (dropout): StableDropout()\n )\n )\n )\n (rel_embeddings): Embedding(512, 1024)\n (LayerNorm): LayerNorm((1024,), eps=1e-07, elementwise_affine=True)\n )\n )\n (classifier): Linear(in_features=1024, out_features=1, bias=True)\n)",
        "execution_type": "Parallel",
        "score": 0.9695759415626526,
        "time": 7.341728210449219,
        "device": "CPU"
      }
    ],
    "model_avg": 0.9304569959640503,
    "execution_time": 7.354729413986206
  },
  "score": 0.9304569959640503,
  "device": "Mix",
  "parallel": 2,
  "max_length": 768,
  "max_memory": 0
}

  job_values : // for now the below values are not changing and aer dummy 
  {
  "text": "This line performs the same functionality as the original two lines: it searches for the model name in the dataset model's string representation and assigns it to model_name if found, otherwise defaults to 'Unknown'.",
  "zero_shot": false,
  "text_check": true,
  "url_ratio_check": true,
  "emoji_ratio_check": true,
  "specialChar_ratio_check": true,
  "model_check": true,
  "random_seed": 0,
  "models": -1,
  "parallel": -1
}


server_status : 
{
  status: "Unknown", // Unknown, Connected, Disconnected, Free, Busy, Connecting
  no_jobs: 0, // Number of Jobs in queue
  no_connections: 0, // Number of connections
}

user_info :
{
  user_id: 0, // User ID
  user_no: 0, // User Number
  jobs: [], // User's Jobs
}

  
   -->

  <div class="main">
    <div class="main_panel" id="main_panel">
      <div
        v-if="job_screen_in_focus"
        class="job_main_screen"
        id="job_main_screen"
      >
        <div class="job_main_screen_title">
          <!-- <div class="job_main_screen_title_id">
            Job ID : {{ cur_job_in_focus.job_id }}
          </div>
          <div class="job_main_screen_title_name">
            Job Name : {{ cur_job_in_focus.job_name }}
          </div> -->
          <br />
          <br />
          <div class="ai_status">
            <div class="ai_status_title" title="Job Number and Name">
              Job {{ cur_job_in_focus.job_id }} :
              {{ cur_job_in_focus.job_name }}
            </div>
            <div class="ai_status_prog" title="Progress Percentage">
              <div>
                {{ cur_job_in_focus.job_status.status }}
              </div>
              [{{ cur_job_in_focus.job_status.progress * 100 }}%]
            </div>
          </div>
          <br />

          <br />
          <!-- <div class="job_main_screen_title_status">
            Job Values : {{ cur_job_in_focus.job_values }}
          </div> -->

          <div class="ai_input_text ai_input_text_new" title="Input Text">
            <div class="ai_input_text_title">Input Text</div>
            <div class="ai_input_text_cont ai_input_text_cont_new">
              {{ cur_job_in_focus.job_values.text }}
            </div>
          </div>
          <br />
          <div class="ai_status_op" title="Live Updates">
            <div class="ai_status_title" id="console_live">
              <div class="ai_status_title">Console</div>
              <font-awesome-icon
                class="accord_but"
                :icon="['fas', 'angle-up']"
                title="Shrink Console"
                v-if="shrink_console_mode"
                @click="shrink_console_mode = !shrink_console_mode"
              />
              <font-awesome-icon
                class="accord_but"
                v-else
                title="Expand Console"
                @click="shrink_console_mode = !shrink_console_mode"
                :icon="['fas', 'angle-down']"
              />
              <div class="ai_status_prog" title="Job Status">
                <div style="display: flex; align-items: center">
                  (
                  <div
                    class="job_tab_opt"
                    :title="cur_job_in_focus.job_status.status"
                  >
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: yellow"
                      v-if="cur_job_in_focus.job_status.status == 'Pending'"
                      :icon="['fas', 'circle']"
                    />
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: blue"
                      v-else-if="
                        cur_job_in_focus.job_status.status == 'Processing'
                      "
                      :icon="['fas', 'circle']"
                    />
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: green"
                      v-else-if="
                        cur_job_in_focus.job_status.status == 'Completed'
                      "
                      :icon="['fas', 'circle']"
                    />
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: red"
                      v-else-if="cur_job_in_focus.job_status.status == 'Failed'"
                      :icon="['fas', 'circle']"
                    />
                  </div>
                  )
                </div>
              </div>
            </div>
            <br />
            <div
              class="ai_input_text ai_input_text_new"
              v-if="!shrink_console_mode"
            >
              <div
                class="ai_input_text_cont ai_input_text_cont_new text_cont_terminal"
              >
                <div
                  class="ai_input_text_cont ai_input_text_cont_new text_cont_terminal"
                >
                  <div
                    v-for="(update, i) in cur_job_in_focus.job_status.updates"
                    :key="i"
                  >
                    <div class="update_line">
                      <div class="update_line_no">{{ i + 1 }}</div>
                      <div class="update_line_text">{{ update }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <br />

          <!-- <div class="job_main_screen_title_status">
            Job Status : {{ cur_job_in_focus.job_status }}
          </div> -->

          <div
            class="ai_status_title"
            v-if="
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status !== 'Pending'
            "
          >
            <div
              class="ai_status_title hid_ti"
              @click="result_json_mode = !result_json_mode"
              title="Result JSON | Click to toggle between JSON and Formatted"
            >
              Result
            </div>
            <font-awesome-icon
              class="accord_but"
              :icon="['fas', 'angle-up']"
              @click="shrink_result()"
              title="Shrink Result"
              v-if="shrink_result_mode"
            />
            <font-awesome-icon
              class="accord_but"
              @click="shrink_result()"
              title="Expand Result"
              v-else
              :icon="['fas', 'angle-down']"
            />
            <div class="ai_status_prog" title="Time in seconds">
              {{ timer }}s
            </div>
          </div>
          <br />
          <div
            class="ai_input_text ai_input_text_new"
            id="result_json"
            title="Result"
            v-if="
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status !== 'Pending'
            "
          >
            <div
              class="ai_input_text_cont ai_input_text_cont_new text_cont_terminal"
            >
              <div
                class="ai_input_text_cont ai_input_text_cont_new text_cont_terminal"
              >
                <div
                  v-for="(value, key) in cur_job_in_focus.job_result"
                  :key="key"
                  v-if="result_json_mode"
                >
                  <div v-if="typeof value === 'object'">
                    <div
                      v-for="(sub_value, sub_key) in value"
                      :key="sub_key"
                      class="update_line upline"
                    >
                      <div v-if="typeof sub_value === 'object'">
                        <div
                          v-for="(sub_sub_value, sub_sub_key) in sub_value"
                          :key="sub_sub_key"
                          class="update_line upline"
                        >
                          <div v-if="typeof sub_sub_value === 'object'">
                            <div
                              v-for="(
                                sub_sub_sub_value, sub_sub_sub_key
                              ) in sub_sub_value"
                              :key="sub_sub_sub_key"
                              class="update_line upline"
                            >
                              <div class="update_line_no no_2">{{ key }}</div>
                              <div class="update_line_text">
                                {{ sub_sub_sub_key }}
                              </div>
                              <div class="update_line_text">
                                {{ sub_sub_sub_value }}
                              </div>
                            </div>
                          </div>
                          <div v-else>
                            <div class="update_line upline">
                              <div class="update_line_no no_2">{{ key }}</div>
                              <div class="update_line_text">
                                {{ sub_sub_key }}
                              </div>
                              <div class="update_line_text">
                                {{ sub_sub_value }}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div v-else>
                        <div class="update_line upline">
                          <div class="update_line_no no_2">{{ key }}</div>
                          <div class="update_line_text">{{ sub_key }}</div>
                          <div class="update_line_text">{{ sub_value }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else>
                    <div class="update_line upline">
                      <div class="update_line_no no_2">{{ key }}</div>
                      <div class="update_line_text">{{ value }}</div>
                    </div>
                  </div>
                </div>
                <div v-else class="json_text">
                  <pre>{{
                    JSON.stringify(cur_job_in_focus.job_result, null, 2)
                  }}</pre>
                </div>
              </div>
            </div>
          </div>

          <br />
          <div
            class="ai_status_title"
            v-if="
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
          >
            <div
              class="ai_status_title hid_ti"
              title="Result JSON | Click to toggle between JSON and Formatted"
            >
              Visualization
            </div>
            <font-awesome-icon
              class="accord_but"
              :icon="['fas', 'angle-up']"
              @click="shirnk_visual_mode = !shirnk_visual_mode"
              title="Shrink Result"
              v-if="shirnk_visual_mode"
            />
            <font-awesome-icon
              class="accord_but"
              @click="shirnk_visual_mode = !shirnk_visual_mode"
              title="Expand Result"
              v-else
              :icon="['fas', 'angle-down']"
            />
            <div class="ai_status_prog" title="Time in seconds"></div>
            <font-awesome-icon
              style="cursor: pointer"
              :icon="['fas', 'file-export']"
              title="Export Visualization"
              @click="download_job(cur_job_in_focus.job_id)"
            />
          </div>
          <br />

          <div
            class="ai_input_text ai_input_text_new graph_1"
            title="Result"
            v-if="
              shirnk_visual_mode &&
              cur_job_in_focus.job_result &&
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
          >
            <!-- <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.score !== undefined
              "
              :ChartValue="cur_job_in_focus.job_result.score"
              :ChartName="'Model Score'"
            /> -->
            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.urls_score !== undefined &&
                cur_job_in_focus.job_result.urls_score !== null
              "
              :ChartValue="cur_job_in_focus.job_result.urls_score"
              :ChartName="
                'URL Score : ' +
                cur_job_in_focus.job_result.urls_score.toFixed(2)
              "
            />

            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.emoji_score !== undefined &&
                cur_job_in_focus.job_result.emoji_score !== null
              "
              :ChartValue="cur_job_in_focus.job_result.emoji_score"
              :ChartName="
                'Emoji Score : ' +
                cur_job_in_focus.job_result.emoji_score.toFixed(2)
              "
            />

            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.specialChar_score !== undefined &&
                cur_job_in_focus.job_result.specialChar_score !== null
              "
              :ChartValue="cur_job_in_focus.job_result.specialChar_score"
              :ChartName="
                'Special Char Score : ' +
                cur_job_in_focus.job_result.specialChar_score.toFixed(2)
              "
            />

            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.text_score !== undefined &&
                cur_job_in_focus.job_result.text_score !== null
              "
              :ChartValue="cur_job_in_focus.job_result.text_score"
              :ChartName="
                'Text Score : ' +
                cur_job_in_focus.job_result.text_score.toFixed(2)
              "
            />
            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.profanity_score !== undefined &&
                cur_job_in_focus.job_result.profanity_score !== null
              "
              :ChartValue="cur_job_in_focus.job_result.profanity_score"
              :ChartName="
                'Profanity Score : ' +
                cur_job_in_focus.job_result.profanity_score.toFixed(2)
              "
            />
          </div>

          <br />

          <div
            class="ai_input_text ai_input_text_new graph_1"
            title="Result"
            v-if="
              shirnk_visual_mode &&
              cur_job_in_focus.job_result &&
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
          >
            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.textblob_score &&
                cur_job_in_focus.job_result.textblob_score.polarity !==
                  undefined
              "
              :ChartValue="cur_job_in_focus.job_result.textblob_score.polarity"
              :ChartName="
                'Polarity : ' +
                cur_job_in_focus.job_result.textblob_score.polarity.toFixed(2)
              "
            />
            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.textblob_score &&
                cur_job_in_focus.job_result.textblob_score.subjectivity !==
                  undefined
              "
              :ChartValue="
                cur_job_in_focus.job_result.textblob_score.subjectivity
              "
              :ChartName="
                'Subjectivity : ' +
                cur_job_in_focus.job_result.textblob_score.subjectivity.toFixed(
                  2
                )
              "
            />

            <circle-chart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.vader_score &&
                cur_job_in_focus.job_result.vader_score.compound !== undefined
              "
              :ChartValue="cur_job_in_focus.job_result.vader_score.compound"
              :ChartName="
                'Compound Score : ' +
                cur_job_in_focus.job_result.vader_score.compound.toFixed(2)
              "
            />

            <polarChart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.vader_score
              "
              :ChartData="{
                Positive: cur_job_in_focus.job_result.vader_score.pos,
                Negative: cur_job_in_focus.job_result.vader_score.neg,
                Neutral: cur_job_in_focus.job_result.vader_score.neu,
              }"
              :ChartName="
                'Sentiment : ' + cur_job_in_focus.job_result.sentiment_label
                  ? cur_job_in_focus.job_result.sentiment_label
                  : 'Neutral'
              "
            />
          </div>

          <br />

          <div
            class="ai_input_text ai_input_text_new graph_1"
            title="Result"
            v-if="
              shirnk_visual_mode &&
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
          >
            <doubleBarChart
              v-if="
                cur_job_in_focus.job_result &&
                cur_job_in_focus.job_result.model_score &&
                cur_job_in_focus.job_result.model_score.models
              "
              :model_bar="cur_job_in_focus.job_result.model_score.models"
            />

            <div v-else>Model Evaluation Skipped, *One Shot</div>
          </div>

          <br />
          <div
            class="ai_status_title"
            v-if="
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
          >
            <div class="ai_status_title" title="Final Conclusion and Summary">
              Conclusion
            </div>
          </div>

          <br />
          <div
            class="ai_input_text ai_input_text_new graph_1 recon"
            v-if="
              cur_job_in_focus.job_result &&
              cur_job_in_focus.job_result.score !== undefined &&
              cur_job_in_focus.job_result.score !== null &&
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
            :style="{
              'background-color':
                cur_job_in_focus.job_result.score > 0.7 ? 'red' : 'green',
            }"
          >
            <div
              v-if="
                cur_job_in_focus.job_result.score >= 0.7 &&
                cur_job_in_focus.job_result.score !== null
              "
            >
              The text is AI generated, with an 'AI-Written' Probability Score :
              {{ cur_job_in_focus.job_result.score }}
            </div>
            <div
              v-else-if="
                cur_job_in_focus.job_result.score <= 0.27 &&
                cur_job_in_focus.job_result.score !== null
              "
            >
              The text is Human written, with 'AI-Written' Probability Score :
              {{ cur_job_in_focus.job_result.score }}
            </div>
            <div
              v-else-if="
                cur_job_in_focus.job_result.score <= 0.55 &&
                cur_job_in_focus.job_result.score !== null
              "
            >
              The text is most likely Human written, with 'AI-Written'
              Probability Score :
              {{ cur_job_in_focus.job_result.score }}
            </div>
            <div v-else-if="cur_job_in_focus.job_result.score !== null">
              The text is likely Human written, with 'AI-Written' Probability
              Score :
              {{ cur_job_in_focus.job_result.score }}
            </div>
          </div>

          <div
            v-else-if="
              cur_job_in_focus.job_result &&
              cur_job_in_focus.job_result.one_shot_score !== undefined &&
              cur_job_in_focus.job_result.one_shot_score !== null &&
              cur_job_in_focus.job_status !== undefined &&
              cur_job_in_focus.job_status.status == 'Completed'
            "
            class="ai_input_text ai_input_text_new graph_1 recon"
            :style="{
              'background-color':
                cur_job_in_focus.job_result.one_shot_score > 0.5
                  ? 'green'
                  : 'red',
            }"
          >
            <div
              v-if="
                cur_job_in_focus.job_result.one_shot_score <= 0.3 &&
                cur_job_in_focus.job_result.one_shot_score !== null
              "
            >
              The text is AI generated, with an 'AI-Written' Probability Score :
              {{ (1 - cur_job_in_focus.job_result.one_shot_score).toFixed(2) }}
            </div>
            <div
              v-else-if="
                cur_job_in_focus.job_result.one_shot_score >= 0.83 &&
                cur_job_in_focus.job_result.one_shot_score !== null
              "
            >
              The text is Human written, with 'AI-Written' Probability Score :
              {{ (1 - cur_job_in_focus.job_result.one_shot_score).toFixed(2) }}
            </div>
            <div
              v-else-if="
                cur_job_in_focus.job_result.one_shot_score >= 0.45 &&
                cur_job_in_focus.job_result.one_shot_score !== null
              "
            >
              The text is most likely Human written, with 'AI-Written'
              Probability Score :
              {{ (1 - cur_job_in_focus.job_result.one_shot_score).toFixed(2) }}
            </div>
            <div
              v-else-if="cur_job_in_focus.job_result.one_shot_score !== null"
            >
              The text is likely Human written, with 'AI-Written' Probability
              Score :
              {{ (1 - cur_job_in_focus.job_result.one_shot_score).toFixed(2) }}
            </div>
          </div>

          <br />
          <br />
        </div>

        <br />
        <br /><br /><br />
      </div>
      <div v-else class="default_screen">
        <h1 class="main_landing_title">
          <div>Snitch GPT</div>
          <div class="main_landing_sub">
            An AI 🤖 generated text analysis tool
          </div>
        </h1>
        <div class="main_landing_suggestions">
          <div
            class="land_sug"
            @click="
              new_chat(
                'Explain Air Quality Index (AQI) to someone who has no idea about it'
              )
            "
          >
            <div class="land_sug_title">Explain Air Quality Index (AQI)</div>
            <div class="land_sug_sub">to someone who has no idea about it</div>
          </div>
          <div
            class="land_sug"
            @click="
              new_chat(
                'Greetings in different languages and their meanings in English'
              )
            "
          >
            <div class="land_sug_title">Greetings in different languages</div>
            <div class="land_sug_sub">and their meanings in English</div>
          </div>
          <div
            class="land_sug"
            @click="
              new_chat('Explain Low-Pass Filter in terms of audio processing')
            "
          >
            <div class="land_sug_title">Explain Low-Pass Filter</div>
            <div class="land_sug_sub">in terms of audio processing</div>
          </div>
          <div
            class="land_sug"
            @click="new_chat('Timeless books and their authors from 1800s')"
          >
            <div class="land_sug_title">Timeless books and their authors</div>
            <div class="land_sug_sub">Get to know about them</div>
          </div>
        </div>
      </div>
      <div class="input_box_container" id="input_box_container">
        <form
          @submit.prevent="
            sendMessage();
            unfoc();
          "
          class="input_box"
          id="input_box"
          :class="{ 'input_box--focused': isInputFocused }"
          :style="{
            height: inputcheck(),
          }"
        >
          <textarea
            v-model="messageInput"
            autocomplete="off"
            autofocus="true"
            id="message_input"
            placeholder="Type your message here"
            title="Type your message here"
            @focus="handleInputFocus"
            @blur="handleInputBlur"
            @keydown.enter.prevent="
              sendMessage();
              inputcheck();
              unfoc();
            "
            @keydown.shift.enter="messageInput += '\n'"
            @input="adjustTextareaHeight"
            :style="{
              height: inputcheck(),
            }"
            class="autoresize"
          ></textarea>

          <button v-if="messageInput" type="submit" title="Send Message">
            <font-awesome-icon :icon="['fas', 'arrow-up']" />
          </button>

          <button
            v-if="messageInput"
            @click="clearInput()"
            type="button"
            title="Clear Input"
          >
            <font-awesome-icon :icon="['fas', 'xmark']" />
          </button>

          <button
            v-if="!messageInput && jobs.length > 0"
            @click="reloadPrevious()"
            type="button"
            title="Reload Previous Input"
          >
            <font-awesome-icon :icon="['fas', 'rotate-left']" />
          </button>

          <button
            v-if="!messageInput && jobs.length == 0"
            type="submit"
            disabled
            title="Type a message to send"
          >
            <font-awesome-icon :icon="['fas', 'arrow-up']" />
          </button>

          <button v-if="processing" @click="stopConnection()" type="button">
            Stop
          </button>
        </form>
        <div class="copy_rights_text">
          Results are not always accurate. Snitch GPT By Jesvi Jonathan.
        </div>
      </div>

      <!-- <div id="status_indicator">Server Status: {{ server_status }}</div>
    <br />
    <div id="messages">User Info: {{ user_info }}</div>

    <div>
      <h2>Current</h2>
      {{ messageInput }}
      <p>Values: {{ currentValues }}</p>
    </div>

    <div>
      <h2>Jobs</h2>
      <ul>
        <li v-for="job in jobs" :key="job.job_id">
          <p>Job ID: {{ job.job_id }}</p>
          <p>Job Name: {{ job.job_name }}</p>
          <p>Job Status: {{ job.job_status }}</p>
          <p>Job Values: {{ job.job_values }}</p>
          <p>Job Result: {{ job.job_result }}</p>
        </li>
      </ul>
    </div> -->
    </div>
    <div class="job_panel" id="job_panel">
      <div
        class="job_panel_tag"
        @click="expand_job_panel()"
        title="Expand/Collapse Job Panel"
      >
        <div class="bar_tag">
          <font-awesome-icon
            v-if="!job_panel_expanded"
            :icon="['fas', 'chevron-left']"
          />
          <font-awesome-icon v-else :icon="['fas', 'chevron-right']" />
        </div>
      </div>

      <div class="job_panel_cont">
        <div class="job_panel_top_bar">
          <div class="server_tag">
            <div class="server_stat_detail">
              <div class="server_stat">
                <font-awesome-icon
                  v-if="server_status.status == 'Connected'"
                  :icon="['fas', 'circle']"
                  style="color: green"
                  title="Status - Connected"
                />
                <font-awesome-icon
                  v-else-if="server_status.status == 'Disconnected'"
                  :icon="['fas', 'circle']"
                  style="color: red"
                  title="Status - Disconnected"
                />
                <font-awesome-icon
                  v-else-if="server_status.status == 'Connecting'"
                  :icon="['fas', 'circle']"
                  style="color: blue"
                  title="Status - Connecting"
                />
                <font-awesome-icon
                  v-else-if="server_status.status == 'Free'"
                  :icon="['fas', 'circle']"
                  style="color: green"
                  title="Status - Free"
                />
                <font-awesome-icon
                  v-else-if="server_status.status == 'Busy'"
                  :icon="['fas', 'circle']"
                  style="color: orange"
                  title="Status - Busy"
                />
                <font-awesome-icon
                  v-else
                  :icon="['fas', 'circle']"
                  style="color: yellow"
                  title="Status - Unknown"
                />
                {{ server_status.status }}
              </div>
              <div style="margin-left: 0.5vw">
                {{ server_status.no_jobs }} Queue,
                {{ server_status.no_connections }}
                Connections
              </div>
            </div>
            <div class="connect_button">
              <button
                v-if="server_status.status == 'Disconnected'"
                @click="connect_server(true)"
              >
                Connect
              </button>
              <button v-else-if="server_status.status == 'Connecting'" disabled>
                Connect
              </button>
              <button
                v-else-if="server_status.status == 'Connected'"
                @click="connect_server(false)"
              >
                Disconnect
              </button>

              <button v-else @click="connect_server(false)">Disconnect</button>
              <button
                @click="
                  connect_server(false);
                  connect_server(true);
                "
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        <div class="job_panel_jobs">
          <!-- <div class="job_tab">
            <div>
              //job_id
              //job_name 
            </div>
            <div class="job_tab_options">
              <div class="job_tab_opt">
                <font-awesome-icon :icon="['fas', 'ellipsis-v']" />
              </div>
              <div class="job_tab_opt">
                <font-awesome-icon :icon="['fas', 'download']" />
              </div>
              <div class="job_tab_opt">
                <font-awesome-icon :icon="['fas', 'trash-alt']" />
              </div>
            </div>
          </div> -->

          <div class="line"></div>
          <button
            class="job_new job_tab"
            @click="new_chat()"
            title="Create a new job"
          >
            New Task<font-awesome-icon :icon="['fas', 'plus']" />
          </button>
          <div class="line"></div>

          <div class="job_panel_jobs_scroll">
            <div class="job_panel_jobs_scroll_inner" id="job_tabs">
              <button
                class="job_tab tab_act"
                v-for="job in jobs"
                :key="job.job_id"
                :class="{ job_panel: job_panel_expanded }"
                @click="view_job(job.job_id)"
                title="View Job Details"
              >
                <div class="job_tab_title">
                  <div>{{ job.job_id }}</div>
                  :
                  <div class="job_text_cont">
                    <div class="job_tab_title_text">
                      {{ job.job_name }} {{ job.job_values.text }}
                    </div>
                  </div>
                </div>
                <div class="job_tab_options">
                  <div class="job_tab_opt" :title="job.job_status.status">
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: lightgoldenrodyellow"
                      v-if="job.job_status.status == 'Pending'"
                      :icon="['fas', 'clock']"
                    />
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: lightblue"
                      v-else-if="job.job_status.status == 'Processing'"
                      :icon="['fas', 'spinner']"
                      class="spin_rot"
                    />
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: green"
                      v-else-if="job.job_status.status == 'Completed'"
                      :icon="['far', 'circle-check']"
                    />
                    <font-awesome-icon
                      style="font-size: 0.7vw; color: red"
                      v-else-if="job.job_status.status == 'Failed'"
                      :icon="['fas', 'circle-exclamation']"
                    />
                  </div>
                  <div
                    class="job_tab_opt"
                    @click.stop="download_job(job.job_id)"
                    title="Download JSON"
                  >
                    <font-awesome-icon :icon="['fas', 'download']" />
                  </div>
                  <div
                    class="job_tab_opt"
                    @click.stop="delete_job(job.job_id)"
                    title="Delete"
                  >
                    <font-awesome-icon :icon="['fas', 'trash-alt']" />
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
        <div
          class="job_panel_bottom_bar"
          title="Profile Info | Also change theme"
          @click="switchTheme()"
        >
          <div class="profile_uno"></div>
          <div class="profile_uid">
            <div title="User ID">
              {{ user_info.user_id }}
            </div>
            <div
              class="profile_uid_sub"
              title="User Number | Total User Jobs Executed"
            >
              User No : {{ user_info.user_no }} ({{ jobs.length }} Jobs)
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.res_grp {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0vw;
  align-content: center;
  flex-wrap: nowrap;
  width: 100%;
}
.res_short {
  width: fit-content !important;
}
.res_short:hover {
  border-left: 0.2vw solid rgba(255, 255, 255, 0) !important;
}

.res_short .ai_input_text_title {
  text-align: center !important;
  width: 7vw;
  text-overflow: ellipsis;
  overflow: hidden;
  height: 1.4vw !important;
}
.res_short .var_cont {
  min-width: 4vw !important;
  text-align: center;
  padding: 1vw !important;
  background: #2b2b2b;
  min-width: 5vw !important;
  max-width: 5vw !important;
  width: 5vw !important;
  height: 1vw !important;
  overflow: hidden;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-overflow: ellipsis;
}
.var_cont {
  overflow: hidden;
  background: rgb(0, 0, 0);
  padding: 1vw 0vw 1vw 1vw !important;
  max-width: unset !important;
  height: max-content;
  overflow-wrap: anywhere;
  margin: 0vw 3vw 0vw 0vw;
  width: -webkit-fill-available;
}
.result_var {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1vw;
  width: 100%;
  border-radius: 0.5vw;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  transition: 0.2s ease;
  border-left: 0.2vw solid rgba(255, 255, 255, 0);
  margin-left: 1vw;
}
.update_line_no {
  font-size: 0.8vw;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 100;
  font-stretch: ultra-condensed;
  width: 1vw;
}
/*     width: 100%;
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; */
.update_line {
  display: flex;
  flex-direction: row;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  font-weight: 300;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5vw;
}
.update_line:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
}
.text_cont_terminal {
  width: -webkit-fill-available;
  background-color: rgba(255, 255, 255, 0.1);
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
}
.ai_status_title {
  font-size: 1.2vw;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.ai_status_output {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.5vw;
  width: 100%;
  padding: 1vw;
  border-radius: 0.5vw;
  background-color: rgba(255, 255, 255, 0.1);
  border-left: 0.3vw solid white;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
}
.ai_status {
  font-size: 1.2vw;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: space-around;
}
.ai_status_op {
  font-size: 1.2vw;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  flex-direction: column;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: space-around;
}

.ai_status_prog {
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 900;
  display: flex;
  flex-direction: row !important;
  align-items: center;
  justify-content: space-between;
  gap: 0.5vw;
}

.job_main_screen {
  width: 70%;
}
.ai_input_text_cont {
  overflow: hidden;
  /* text-overflow: ellipsis; */
  min-width: 41vw;
  background: rgb(0, 0, 0);
  background: rgb(25 25 25);
  padding: 1vw;
  /* max-width: 41.2vw; */
  height: max-content;
  width: -webkit-fill-available;
  overflow-wrap: anywhere;
  border-radius: 0.3vw;
}
.ai_input_text_title {
  font-size: 1.2vw;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
  font-stretch: ultra-condensed;
}
.ai_input_text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1vw;
  width: 100%;
  padding: 1vw;
  border-radius: 0.5vw;
  background-color: rgba(255, 255, 255, 0.1);
  background-color: rgba(67, 67, 67, 0.1);
  border-left: 0.2vw solid rgba(55, 55, 55, 0.5);
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  transition: 0.2s ease;
}
.ai_input_text:hover {
  border-left: 0.2vw solid rgba(255, 255, 255, 0.5);
}

.tab_act {
  /* background: rgba(255, 255, 255, 0.836) !important; */
  border-left: 0.3vw solid white;

  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  background-color: rgba(68, 68, 68, 0.3) !important;

  border-left: 0.2vw solid rgba(255, 255, 255, 0.5);
  border: none;
}

.job_panel_jobs_scroll {
  height: 56vh;
  overflow-y: scroll;
  overflow-x: hidden;
  width: 100%;
}
.job_panel_jobs_scroll_inner {
  overflow-x: auto;
  height: max-content;
  width: 100%;
  padding: 0.5vw;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  justify-content: flex-start;
  gap: 1vw;
}
.land_sug_sub {
  font-size: 0.8vw;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 100;
  font-stretch: ultra-condensed;
}
.job_panel_jobs_scroll::-webkit-scrollbar {
  width: 0.3vw;
}
.job_panel_jobs_scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.5vw;
}
.job_panel_jobs_scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
.job_panel_jobs_scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 0.5vw;
}
.job_panel_jobs_scroll::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.4);
}

.land_sug_title {
  font-size: 1.1vw;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}
.land_sug {
  width: 28vw;
  text-align: center;
  background-color: rgba(40, 40, 40, 0.4);
  height: 6vw;
  border-radius: 0.5vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5vw;
  cursor: pointer;
}
.land_sug:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.main_landing_suggestions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5vw;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;
}
.default_screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5vw;
  height: 100%;
  width: 100%;
  border-radius: 0.5vw;
  padding: 2vw;
  font-size: 1.5vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  transition: 0.2s ease;
  align-content: stretch;
  flex-wrap: nowrap;
  transition: 0.2s ease;
}
.line {
  width: 90%;
  height: 0.05vw;
  background: rgba(255, 255, 255, 0.1);
}
.job_tab_title_text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 8vw;
  min-width: 8vw;
}
.job_tab_title {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5vw;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: flex-start;
  margin: 0vw 0vw;
  width: 9vw;
  padding-left: 1.5vw;
}
.job_tab_options {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5vw;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 300;
  font-stretch: ultra-condensed;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-around;
  margin: 0vw 1vw 0vw 0.5vw;
}
.job_tab_options .job_tab_opt {
  cursor: pointer;
  transition: 0.3s;
  padding: 0.4vw;
}
.job_tab_options .job_tab_opt:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 1);
  border-radius: 0.5vw;
}
.job_tab {
  height: 3vw;
  width: 90%;
  /* background: rgb(48 48 48); */
  border-radius: 0.3vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
  gap: 0.5vw;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  transition: 0.2s ease;
  align-content: stretch;
  flex-wrap: nowrap;
  cursor: pointer;
  transition: 0.1s ease;
  /* border-bottom: 0.01vw solid grey; */
  border-radius: 0vw;
  border: none;
  background: rgba(255, 255, 255, 0);
}

.job_tab:hover .job_tab_title .job_tab_title_text {
  color: white;
  animation: marquee 10s linear infinite;
  text-overflow: initial;

  white-space: nowrap;
  overflow: initial;
  max-width: initial;
  z-index: 0;
}
@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-100%);
  }
}
.job_text_cont {
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  flex-wrap: nowrap;
  margin: 0vw 0vw;
  max-width: 7vw;
  overflow: clip;
  text-align: left;
}
.connect_button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5vw;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-around;
}
.server_stat_detail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1vw;
}
.server_stat {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5vw;
  font-size: 0.9vw;
  width: 100%;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
}
.server_tag {
  display: flex;
  align-items: center;
  flex-direction: row;
  gap: 0.5vw;
  width: 100%;
  font-size: 0.9vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  flex-wrap: nowrap;
  align-content: center;
  justify-content: space-around;
  margin: 0vw 1vw;
  z-index: 10;
}
.connect_button button {
  background: rgba(68, 68, 68, 0.3);
  border: none;
  cursor: pointer;
  border-radius: 0.2vw;
  font-size: 0.7vw;
  color: rgb(255, 255, 255);
  transition: 0.3s;
  margin-left: 0.6vw;
  padding: 0.5vw 0.5vw;
  width: 6vw;
  transition: 0.1s ease;
}

.connect_button button:hover {
  background: rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 1);
}
.connect_button button:disabled {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.2);
  cursor: not-allowed;
}
.job_panel_jobs {
  height: 80%;
  width: 100%;
  background: rgba(255, 255, 255, 0);
  margin: 1vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  gap: 1vw;
}
.job_panel_bottom_bar {
  height: 10%;
  width: 100%;
  background: rgba(255, 255, 255, 0);
  margin: 0vw 2vw 1vw 2vw;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  gap: 1vw;
  flex-wrap: nowrap;
  padding: 1vw 0vw;
  width: 16vw;
  font-size: 0.8vw;

  border-top: 0.05vw solid rgba(255, 255, 255, 0.1);
}
.job_panel_top_bar {
  height: 10%;
  width: 100%;
  margin: 1vw;
  margin-top: 2vw;
  background: rgba(255, 255, 255, 0);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 0.5vw;
}
.job_panel_cont {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 0.5vw;
  flex-wrap: nowrap;
  transition: 0.4s ease;
}
.job_panel {
  transition: 0.3s ease;
}
.job_panel_tag {
  top: 50%;
  cursor: pointer;
  position: absolute;
  left: 20vw;
  transition: 0.4s ease;
  z-index: 10;
}
.bar_tag {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0);
  cursor: pointer;
  font-size: 1.2vw;
  color: rgba(255, 255, 255, 0.2);
  transition: 0.3s;
  margin-left: 0.6vw;
  padding: 0.5vw 0.2vw;
  border-radius: 0.1vw;
}
.bar_tag:hover {
  background: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 1);
  border-radius: 0.5vw;
  padding: 0.5vw 0.5vw;
}
body {
  margin: 0;
  padding: 0;
  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
  font-weight: 300;
  font-weight: 100;
  font-size: 1vw;
  color: white;
  background: #1e1e1e;
  overflow: hidden;
}
*::-webkit-scrollbar {
  width: 0.3vw;
}
*::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.5vw;
}
*::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
*::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 0.5vw;
}
/* slim scroll bar */

.main_landing_sub {
  font-size: 0.8vw;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  margin-top: 0.5vw;
  font-weight: 100;
}
.main_landing_title {
  font-size: 2.5vw;
  color: white;
  text-align: center;
  font-family: "Franklin Gothic Medium", "Arial Narrow", Arial, sans-serif;
  font-weight: 300;
  margin-top: -2vw;
  margin-bottom: 2vw;
}
.main {
  display: flex;
  flex-direction: row-reverse;
  justify-content: space-between;
  align-items: center;
  gap: 1vw;
  padding: 0vw;
  height: 100vh;
  width: 100vw;
  background: #1e1e1e;
  color: white;
  font-family: "Poppins", sans-serif;
  font-weight: 100;
  font-stretch: ultra-condensed;
  font-size: 1.2vw;
  align-content: center;
  flex-wrap: nowrap;
}
.main_panel {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  margin: 0vw 0vw 0vw 9vw;
  padding: 0vw 9vw 0vw 0vw;
  align-items: center;
  overflow-y: scroll;
  overflow-x: hidden;
}

.main_panel::-webkit-scrollbar {
  width: 0.3vw;
}
.main_panel::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.5vw;
}
.main_panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
.main_panel::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 0.5vw;
}

.job_panel {
  width: 19vw;
  height: 100vh;
  background: #2b2b2b;
  /* background: black; */
}
.input_box_container {
  bottom: 0.5vw;
  position: absolute;
  transition: 0.2s ease;
}
.input_box {
  display: flex;
  justify-content: center;
  align-items: center;

  width: 100%;
  padding: 1vw 0.6vw;
  position: relative;
  bottom: 3.5%;
  left: 50%;
  transform: translateX(-50%);
  align-content: center;
  flex-direction: row;
  flex-wrap: nowrap;
  border: none;
  font-size: 1.2vw;
  border-radius: 0.8vw;
  height: 1.2vw;
  gap: 1vw;
  width: 45vw;
  border: 0.01vw solid rgba(255, 255, 255, 0.1);
  transition: 0.3s ease;
  background: rgba(63, 63, 63, 0.5);
  backdrop-filter: blur(1vw);
}
.input_box button {
  padding: 0.1vw 0.1vw;
  width: 1.9vw;
  height: 1.9vw;
  background: rgba(255, 255, 255, 0.1);

  color: white;
  border: none;
  cursor: pointer;
  border-radius: 0.4vw;
  /* border: 0.01vw solid rgba(255, 255, 255, 0.3); */
  font-size: 0.9vw;
}
.input_box button:hover {
  background: rgba(255, 255, 255, 1);
  color: #000;
}
.input_box button:disabled {
  background: rgba(83, 83, 83, 0.2);
  color: rgba(255, 255, 255, 0.3);
  cursor: not-allowed;
}

#message_input {
  padding: 0.5vw 1vw;
  font-size: 0.9vw;
  background: rgba(55, 55, 55, 0.1);
  border: none;
  outline: none;
  color: rgb(255, 255, 255);
  border-radius: 0.6vw;
  font-weight: 100;
  font-stretch: ultra-condensed;
  width: 40vw;
  min-height: 1.2vw;
  max-height: 10vw;
  resize: none;
  overflow-y: hidden;
  height: 1.2vw;
}

#message_input::-webkit-scrollbar {
  width: 0.3vw;
}
#message_input::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.5vw;
}
#message_input::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
#message_input::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 0.5vw;
}
#message_input::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.4);
}

.message_input_scroll_reveal {
  overflow-y: scroll;
}
.input_box--focused {
  border: 0.01vw solid rgba(255, 255, 255, 0.3);
}
.copy_rights_text {
  font-size: 0.7vw;
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.5vw;
}

.profile_uno {
  font-size: 1vw;
  color: rgb(0, 0, 0);
  text-align: center;
  font-weight: 800;
  background: rgba(107, 107, 107, 0.8);
  border-radius: 50%;
  width: 3vw;
  height: 3vw;
  display: flex;
  align-items: center;
  margin-left: 0.3vw;
  justify-content: center;
  background-image: url("https://yt3.googleusercontent.com/ICQxAQyXKtNO30L9TmDaFbO7jvb2P3mEms5n_GF0MUQEHb0jd0pOkW3rD_-scUD3t3xVhNEm=s900-c-k-c0x00ffffff-no-rj");
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: rgba(255, 255, 255, 0.1);
  background-blend-mode: overlay;
  background-clip: border-box;
  border: 0.1vw solid rgba(0, 0, 0, 0.5);
  cursor: pointer;
}
.profile_uid {
  width: 10vw;
  font-size: 0.9vw;
  text-align: left;
  font-stretch: wider;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  color: rgba(255, 255, 255, 1);
  text-align: center;
  font-weight: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.2vw;
  flex-wrap: nowrap;
  white-space: nowrap;
  overflow: hidden;
  cursor: pointer;
  padding: 0.5vw 0.5vw;
  transition: 0.3s ease;
  padding: 0.9vw 0.5vw;
}
.profile_uid:hover {
  background: rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border-radius: 0.2vw;
  padding: 0.9vw 0.5vw;
}
.profile_uid_sub {
  font-size: 0.7vw;
  color: rgba(255, 255, 255, 0.7);
  text-align: left;
  font-weight: 500;
}
.job_new {
  max-width: 19vw;
  font-weight: 700;
  transition: 0.2s;
  font-size: 1vw;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;

  background-color: rgba(68, 68, 68, 0.3) !important;

  border: none;

  color: rgba(255, 255, 255, 1);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1vw;
  border: none;
}
.job_new:hover {
  font-size: 1vw;
  transition: 0.1s;
  background-color: rgba(0, 0, 0, 0.1) !important;
  color: rgb(0, 0, 0);
  cursor: pointer;
}

.job_tab:hover {
  background: rgba(0, 0, 0, 0.15);
  color: rgba(255, 255, 255, 1);
}
.ai_modle {
  display: flex;
  row-gap: 2vw;
  column-gap: 5vw;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  align-items: center;
  width: 100%;
  width: 41vw;
  justify-content: space-evenly;
}
.mode_num {
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 900;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  text-align: center;
}
.mod_cont {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 0.5vw;
  width: 100%;
  border-radius: 0.5vw;
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  transition: 0.2s ease;
  border-left: 0.2vw solid rgba(255, 255, 255, 0);
  min-width: 1vw !important;
}
.ai_model_con {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1vw;
}
.model_title {
  width: 100%;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.model_title:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
}
.new_res_grp {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  gap: 1vw;
  align-content: center;
  flex-wrap: wrap;
  width: 100%;
}
.al_grid {
  width: 16vw;
  gap: 0.8vw;
  display: flex;
  flex-direction: column;
}

.fin_grid {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1vw;
  width: 100%;
  align-content: center;
  flex-wrap: nowrap;
  transition: 0.4s ease;
  padding: 0.5vw;
  border-radius: 0.5vw;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(1vw);
  border-left: 0.3vw solid white;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  font-size: 1vw;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 300;
  font-stretch: ultra-condensed;
  transition: 0.2s ease;
  border-left: 0.2vw solid rgba(255, 255, 255, 0.5);
  margin: 0vw 0vw;
  padding-left: 1.5vw;
}
.bold {
  font-weight: 500;
}
.no_2 {
  width: unset;
}
.upline {
  text-wrap: nowrap;
  margin-top: 0.3vw;
}
.json_text {
  font-size: 0.8vw;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 100;
  font-stretch: ultra-condensed;
  width: 1vw;
  margin-top: 0.3vw;
  overflow-x: scroll;
  width: 100%;
}
.json_text::-webkit-scrollbar {
  width: 0.1vw;
  height: 0.5vw;
}
.json_text::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.5vw;
}
.json_text::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.8);
}
.json_text::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0);
  border-radius: 0.5vw;
}
.json_text::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.4);
}
.hid_ti {
  cursor: pointer;
}
.hid_ti:hover {
  text-decoration: underline;
}
.accord_but {
  margin: 0vw 1vw;
  cursor: pointer;
  transition: 0.3s;
  padding: 0.5vw 0vw;
  width: 6vw;
  background: rgba(68, 68, 68, 0.1);
  border: none;
  color: rgba(255, 255, 255, 1);
  border-radius: 0.2vw;
}
.accord_but:hover {
  background: rgba(0, 0, 0, 0.1);
  color: rgba(255, 255, 255, 1);
}
.spin_rot {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
.graph_1 {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1vw;
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
  font-size: 1vw;
  font-weight: 300;
  font-stretch: ultra-condensed;
}

.con_text {
  font-size: 1vw;
  color: rgba(255, 255, 255, 1);
  font-weight: 700;
  width: 100%;
  margin: 0vw 0vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recon {
  font-size: 1vw;
  color: rgba(255, 255, 255, 1);
  font-weight: 500;
  width: 100%;
  margin: 0vw 0vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
