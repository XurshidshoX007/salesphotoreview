const e=`<template>
  <div v-if="allAudioFiles.length" class="mt-4">
    <div class="text-black font-medium border-b px-4 py-3">
      {{ t("audit.report_audit.audio_reports") }}
    </div>
    <div class="px-4 pt-4">
      <div
        v-for="file in allAudioFiles"
        :key="file.id"
        class="border-b last-border-b-0 py-2 last-pb-0"
      >
        <div
          v-if="audioErrors[file.id]"
          class="p-3 bg-red-50 rounded-lg text-red-600 text-sm border border-red-200"
        >
          <div class="flex items-center gap-2">
            <IconPlay />
            <span>{{ audioErrors[file.id] }}</span>
          </div>
          <a
            :href="file.path"
            target="_blank"
            class="text-blue-600 hover:text-blue-800 underline text-xs mt-1 inline-block"
          >
            {{ t("audit.report_audit.download_directly") }}
          </a>
        </div>
        <flex-col v-else class="gap-2">
          <flex-row class="items-center gap-3.5">
            <button
              @click="playPause(file.id, file.path)"
              class="w-10 h-10 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors shadow-sm border border-gray-200"
              :disabled="isLoading[file.id]"
            >
              <div
                v-if="isLoading[file.id]"
                class="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"
              ></div>
              <div
                v-else-if="isPlaying[file.id]"
                class="flex items-center gap-1"
              >
                <IconPause />
              </div>
              <IconPlay v-else />
            </button>
            <div class="flex-1">
              <div
                :id="\`waveform-\${file.id}\`"
                class="h-10"
                style="min-height: 48px"
              ></div>
            </div>
          </flex-row>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>{{ getFormattedDate(file.created_date) }}</span>
            <span>{{ duration[file.id] || "0:00" }}</span>
          </div>
        </flex-col>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import WaveSurfer from "wavesurfer.js";
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { getHexByTWColor } from "~/utils/helpers";
import { getFormattedDate } from "~/utils/formatters";

const { t } = useI18n();

const visitDetailStore = useAuditReportDetailStore("main");

const wavesurfers = ref<Record<string, WaveSurfer>>({});
const isPlaying = ref<Record<string, boolean>>({});
const isLoading = ref<Record<string, boolean>>({});
const duration = ref<Record<string, string>>({});
const currentTime = ref<Record<string, string>>({});
const audioErrors = ref<Record<string, string>>({});

const allAudioFiles = computed(() => {
  const typedFiles = visitDetailStore.mainData?.typed_files || [];
  const audioCategories = typedFiles.filter(
    (file) =>
      file.visit_file_type.name.toLowerCase().includes("audio") ||
      file.visit_file_type.name.toLowerCase().includes("voice") ||
      file.visit_file_type.name.toLowerCase().includes("sound") ||
      file.visit_file_type.name.toLowerCase().includes("аудио") ||
      file.files.some((f) =>
        /\\.(mp3|wav|ogg|m4a|aac|webm|mp4|flac)$/i.test(f.path)
      )
  );
  return audioCategories.flatMap((category) => category.files);
});

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return \`\${mins}:\${secs.toString().padStart(2, "0")}\`;
};

const createWaveSurfer = async (fileId: string, audioUrl: string) => {
  if (wavesurfers.value[fileId]) {
    wavesurfers.value[fileId].destroy();
    delete wavesurfers.value[fileId];
  }
  await nextTick();
  const container = document.getElementById(\`waveform-\${fileId}\`);
  if (!container) return;
  try {
    audioErrors.value[fileId] = "";
    isLoading.value[fileId] = true;
    const wavesurfer = WaveSurfer.create({
      container: container,
      waveColor: getHexByTWColor("bg-neutral-300"),
      progressColor: getHexByTWColor("bg-primary-600"),
      cursorColor: "#059669",
      barWidth: 2,
      barRadius: 99999,
      barGap: 2,
      height: 40,
      barHeight: 39,
      normalize: true,
      backend: "MediaElement",
      mediaControls: false,
      interact: true,
    });
    wavesurfer.on("ready", () => {
      isLoading.value[fileId] = false;
      duration.value[fileId] = formatTime(wavesurfer.getDuration());
      currentTime.value[fileId] = "0:00";
    });
    wavesurfer.on("audioprocess", () => {
      currentTime.value[fileId] = formatTime(wavesurfer.getCurrentTime());
    });
    wavesurfer.on("play", () => {
      isPlaying.value[fileId] = true;
    });
    wavesurfer.on("pause", () => {
      isPlaying.value[fileId] = false;
    });
    wavesurfer.on("finish", () => {
      isPlaying.value[fileId] = false;
      wavesurfer.seekTo(0);
      currentTime.value[fileId] = "0:00";
    });
    wavesurfer.on("error", (error) => {
      console.error(\`WaveSurfer error for \${fileId}:\`, error);
      isLoading.value[fileId] = false;
      audioErrors.value[fileId] = "Failed to load audio waveform";
    });
    try {
      await wavesurfer.load(audioUrl);
      wavesurfers.value[fileId] = wavesurfer;
    } catch (error) {
      console.warn(\`Failed to load \${fileId}:\`, error);
      audioErrors.value[fileId] = t("audit.report_audit.audio_load_error");
      isLoading.value[fileId] = false;
    }
  } catch (error) {
    console.error(\`Error creating WaveSurfer for \${fileId}:\`, error);
    isLoading.value[fileId] = false;
    audioErrors.value[fileId] = "Failed to initialize audio player";
  }
};

const playPause = async (fileId: string, audioUrl: string) => {
  if (audioErrors.value[fileId]) return;
  if (!wavesurfers.value[fileId]) {
    await createWaveSurfer(fileId, audioUrl);
    if (!wavesurfers.value[fileId] || audioErrors.value[fileId]) return;
  }
  const wavesurfer = wavesurfers.value[fileId];
  if (!wavesurfer) return;
  try {
    if (wavesurfer.isPlaying()) {
      wavesurfer.pause();
    } else {
      Object.entries(wavesurfers.value).forEach(([id, ws]) => {
        if (id !== fileId && ws?.isPlaying()) {
          ws.pause();
        }
      });
      await wavesurfer.play();
    }
  } catch (error) {
    console.error(\`Error playing/pausing audio \${fileId}:\`, error);
    audioErrors.value[fileId] = "Playback failed";
  }
};

onMounted(() => {
  allAudioFiles.value.forEach((file) => {
    isPlaying.value[file.id] = false;
    isLoading.value[file.id] = false;
    audioErrors.value[file.id] = "";
    currentTime.value[file.id] = "0:00";
    duration.value[file.id] = "0:00";
  });
});

onUnmounted(() => {
  Object.values(wavesurfers.value).forEach((wavesurfer) => {
    if (wavesurfer) {
      wavesurfer.destroy();
    }
  });
  wavesurfers.value = {};
});

watch(
  allAudioFiles,
  (newFiles) => {
    newFiles.forEach((file) => {
      if (!wavesurfers.value[file.id]) {
        createWaveSurfer(file.id, file.path);
      }
    });
  },
  { immediate: true }
);
<\/script>

<style scoped>
[id^="waveform-"] {
  border-radius: 0.5rem;
  overflow: hidden;
}
.animate-spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
`;export{e as default};
