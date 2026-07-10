const n=`<template>
  <transition name="modal">
    <div v-if="icon">
      <d-modal
        :name="icon.name"
        data-container-width="700px"
        @close-dialog="$emit('close')"
      >
        <div class="flex gap-6 p-2">
          <div class="flex flex-col items-center gap-4 shrink-0 w-[200px]">
            <div
              class="w-[120px] h-[120px] flex items-center justify-center rounded-2xl bg-neutral-50 text-neutral-700"
            >
              <dev-icons-safe
                :is="icon.component"
                :icon-props="{
                  size: 80,
                  ...getIconProps(icon),
                }"
              />
            </div>

            <div
              v-if="icon.variants.length > 0"
              class="flex flex-wrap justify-center gap-1.5"
            >
              <button
                v-for="v in icon.variants"
                :key="v"
                class="text-xs px-2.5 py-1 rounded-lg transition-colors"
                :class="
                  getActiveVariant(icon) === v
                    ? 'bg-primary-100 text-primary-700 font-medium'
                    : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-100'
                "
                @click="$emit('setVariant', icon.name, v)"
              >
                {{ v }}
              </button>
            </div>

            <div class="text-center space-y-1">
              <div class="text-xs text-neutral-400">Component tag</div>
              <code
                class="text-xs text-neutral-600 bg-neutral-50 px-2 py-1 rounded block"
              >
                &lt;icon-{{ toKebabCase(icon.name) }} /&gt;
              </code>
            </div>

            <m-btn
              group="outlined"
              class="!text-sm !gap-2"
              @click="$emit('copyTag', icon)"
            >
              <icon-copy :size="16" />
              Copy
            </m-btn>

            <div class="flex flex-wrap gap-1 justify-center">
              <span
                v-for="cat in icon.categories"
                :key="cat"
                class="text-[10px] px-2 py-0.5 bg-neutral-50 text-neutral-500 rounded-md"
              >
                {{ cat }}
              </span>
            </div>
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-neutral-700 mb-3">
              Usage
              <span class="text-neutral-400 font-normal">
                ({{ usage.count }} times)
              </span>
            </div>

            <div
              v-if="usageLoading"
              class="text-sm text-neutral-400 py-4 text-center"
            >
              Scanning...
            </div>

            <div
              v-else-if="usage.files.length === 0"
              class="text-sm text-neutral-400 py-4 text-center"
            >
              Not used in the project
            </div>

            <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
              <div v-for="file in usage.files" :key="file.path" class="text-sm">
                <div class="text-neutral-500 text-xs mb-0.5 truncate">
                  {{ file.path }}
                </div>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="line in file.lines"
                    :key="line"
                    class="text-xs px-2 py-0.5 rounded bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors cursor-pointer select-none"
                    @click.stop="copyToClipboard(file.path, line)"
                    @dblclick.stop="openInVscode(file.path, line)"
                  >
                    Line {{ line }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </d-modal>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { notify } from "@kyvg/vue3-notification";
import type { Component } from "vue";

// Types
interface IconUsageFile {
  path: string;
  lines: number[];
}

interface IconUsageEntry {
  count: number;
  files: IconUsageFile[];
}

interface IconEntry {
  name: string;
  component: Component;
  variants: string[];
  categories: string[];
  subdirectory: string | null;
  isAnimated: boolean;
}

// Props
const props = defineProps<{
  icon: IconEntry | null;
  usageLoading: boolean;
  usageData: Record<string, IconUsageEntry>;
  activeVariantsMap: Record<string, string>;
}>();

// Emits
defineEmits<{
  close: [];
  copyTag: [icon: IconEntry];
  setVariant: [iconName: string, variant: string];
}>();

// Constants
declare const __PROJECT_ROOT__: string;
const projectRoot = __PROJECT_ROOT__;

// Hooks
const usage = computed<IconUsageEntry>(() => {
  if (!props.icon) return { count: 0, files: [] };
  return props.usageData[props.icon.name] || { count: 0, files: [] };
});

// Methods
function getActiveVariant(icon: IconEntry): string | undefined {
  return props.activeVariantsMap[icon.name] || icon.variants[0];
}

function getIconProps(icon: IconEntry): Record<string, unknown> {
  const iconProps: Record<string, unknown> = {};
  if (icon.variants.length > 0) {
    iconProps.variant = getActiveVariant(icon);
  }
  return iconProps;
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

function getVscodeUrl(filePath: string, line: number): string {
  return \`vscode://file\${projectRoot}/\${filePath}:\${line}\`;
}

function openInVscode(path: string, line: number) {
  window.open(getVscodeUrl(path, line), "_self");
}

async function copyToClipboard(text: string, line: number) {
  try {
    await navigator.clipboard.writeText(\`\${text}:\${line}\`);
    notify({ title: "Copied to clipboard!", type: "success" });
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = \`\${text}:\${line}\`;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}
<\/script>
`;export{n as default};
