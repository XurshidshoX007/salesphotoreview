const n=`<template>
  <div
    v-tooltip="computedTooltip"
    :class="[mainClass]"
    :style="btnBgStyle"
    @mouseover="handleMouseOver"
    @mouseleave="handleMouseLeave"
    @mousedown="handleMouseDown"
    @click.stop="onClickBtn"
  >
    <component :is="iconComponent" :size="props.iconSize" :color="iconColor" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { defineAsyncComponent } from "vue";
import { hexToRgba } from "~/utils/helpers";

type IconKey = keyof typeof dynamicIcons;
type CommonProps = {
  icon?: IconKey;
  tooltip?:
    | {
        text: string;
        disabled?: boolean;
        position?: string;
      }
    | string;
  iconColor?: string;
  iconSize?: string | number;
  disabled?: boolean;
  nonClickable?: boolean;
  withoutTooltip?: boolean;
  withoutBorder?: boolean;
  size?: "md" | "sm" | "xsm" | "2xsm";
  activeBg?: string;
  activeText?: string;
  bgColor?: string;
  dashedBorder?: boolean;
  hoverBg?: string;
};

type ColorTypeProps = {
  type: "color";
  color: string;
  iconFileName: string;
};

type RequiredTypeProps = {
  type: "primary" | "outlined" | "default";
  iconFileName: string;
  color?: string;
};

type OtherTypeProps = {
  type?:
    | "danger"
    | "danger-fill"
    | "edit"
    | "info"
    | "configuration"
    | "checked"
    | "pin";
  color?: string;
  iconFileName?: string;
};

type Props = CommonProps &
  (ColorTypeProps | RequiredTypeProps | OtherTypeProps);

// props
const props = withDefaults(defineProps<Props>(), {
  size: "sm",
  type: "default",
  disabled: false,
  withoutBorder: false,
});

// emit
const emit = defineEmits(["click"]);

const { t } = useI18n();
const hovering = ref(false);
const isActive = ref(false);

const typeToIconMap: Record<string, string> = {
  edit: "Edit",
  checked: "Check",
  configuration: "SettingsAlt",
  danger: "Trash",
  "danger-fill": "Trash",
  pin: "pinIcon",
  info: "InfoCircle",
};

const dynamicIcons: Record<string, string> = {
  refresh: "RefreshSVG",
  "currency-convert": "currencyConvert",
  plus: "Plus",
  check: "Check",
  pin: "pinIcon",
  configuration: "SettingsAlt",
  "user-block": "UserBlock",
  info: "InfoCircle",
  wallet: "PriceIcon",
  password: "lock/index",
  "not-active": "NotActive",
  move: "Move",
  insert: "Insert",
  cancel: "X",
  copy: "Copy",
  link: "Link",
  access: "Access",
  route: "Route",
  next: "rightPagination",
  prev: "leftPagination",
  list: "List",
  minus: "Minus",
};

const isBorder = computed(() => {
  return props.disabled ||
    props.activeBg ||
    (!props.hoverBg && hovering.value) ||
    isActive.value
    ? false
    : true;
});

const mainClass = computed(() => {
  let classes = "cursor-pointer flex items-center justify-center";

  switch (props.size) {
    case "md":
      classes += " !h-10 !w-10 rounded-lg";
      break;
    case "sm":
      classes += " !h-9 !w-9 rounded-lg";
      break;
    case "xsm":
      classes += " !h-8 !w-8 rounded-lg";
      break;
    case "2xsm":
      classes += " !h-7 !w-7 rounded-lg";
      break;
    default:
      break;
  }

  return classes;
});

const btnBgStyle = computed(() => {
  let background = "";
  let border = "none";
  let borderColor = "";
  let cursor = props.disabled ? "not-allowed" : "";

  const setBorder = (color: string) => {
    if (isBorder.value && !props.withoutBorder) {
      border = props.dashedBorder ? "1px dashed" : "1px solid";
      borderColor = color;
    }
  };

  const stylesMap: Record<string, () => void> = {
    danger: () => {
      const color = getHexByTWColor("bg-red-500");
      const disabled = getHexByTWColor("bg-red-300");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, color, disabled, true);
      setBorder(border);
    },
    "danger-fill": () => {
      const normal = getHexByTWColor("bg-red-500");
      const hover = getHexByTWColor("bg-red-600");
      const activeBg = getHexByTWColor("bg-red-700");
      const disabled = getHexByTWColor("bg-red-300");
      background = getBg(normal, hover, activeBg, disabled);
    },
    default: () => {
      const color = getHexByTWColor("bg-neutral-100");
      const active = getHexByTWColor("bg-teal-600");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, active, color);
      setBorder(border);
    },
    outlined: () => {
      const color = getHexByTWColor("bg-teal-600");
      const disabled = getHexByTWColor("bg-neutral-50");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, color, disabled, true);
      setBorder(border);
    },
    primary: () => {
      const normal = getHexByTWColor("bg-teal-600");
      const hover = getHexByTWColor("bg-teal-700");
      const activeBg = getHexByTWColor("bg-teal-800");
      const disabled = getHexByTWColor("bg-teal-400");
      background = getBg(normal, hover, activeBg, disabled);
    },
    edit: () => {
      const color = getHexByTWColor("bg-amber-500");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, hexToRgba(color, 1.1), color, true);
      setBorder(border);
    },
    checked: () => {
      const color = "#23C00A";
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, hexToRgba(color, 1.1), color, true);
      setBorder(border);
    },
    configuration: () => {
      const color = getHexByTWColor("bg-slate-500");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, hexToRgba(color, 1.1), color, true);
      setBorder(border);
    },
    info: () => {
      const color = getHexByTWColor("bg-blue-500");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, hexToRgba(color, 1.1), color, true);
      setBorder(border);
    },
    pin: () => {
      const color = getHexByTWColor("bg-purple-500");
      const border = getHexByTWColor("bg-neutral-200");
      background = getBg("", color, hexToRgba(color, 1.1), color, true);
      setBorder(border);
    },
    color: () => {
      const color = props.color || "";
      const border = getHexByTWColor("bg-neutral-200");
      const disabled = getHexByTWColor("bg-neutral-50");
      background = getBg("", color, hexToRgba(color, 1.1), disabled, true);
      setBorder(border);
    },
  };

  const applyStyle = stylesMap[props.type];
  if (applyStyle) applyStyle();

  return {
    background,
    border,
    borderColor,
    cursor,
  };
});

const iconColor = computed(() => {
  const { type, disabled, activeBg, color, activeText } = props;
  const hover = hovering.value;
  const activeColor = activeText || getHexByTWColor("text-white");

  const defaultColors: Record<string, string> = {
    danger: getHexByTWColor("text-red-500"),
    outlined: getHexByTWColor("text-primary-600"),
    edit: getHexByTWColor("text-amber-500"),
    checked: "#23C00A",
    configuration: getHexByTWColor("text-slate-500"),
    info: getHexByTWColor("text-blue-500"),
    pin: getHexByTWColor("text-purple-500"),
  };

  if (type === "danger-fill" || type === "primary") {
    return getHexByTWColor("text-white");
  }

  if (disabled) return getHexByTWColor("text-neutral-300");

  if (activeBg || isActive.value) return activeColor;

  if (type === "default")
    return hover
      ? getHexByTWColor("text-neutral-950")
      : getHexByTWColor("text-neutral-600");

  if (type === "color") return color;

  return defaultColors[type] || "";
});

const computedTooltip = computed(() => {
  if (props.withoutTooltip) return undefined;

  const defaultTexts: Record<string, string> = {
    danger: t("delete"),
    "danger-fill": t("delete"),
    edit: t("edit"),
    configuration: t("users.configurations"),
  };

  let text =
    typeof props.tooltip === "string"
      ? props.tooltip || defaultTexts[props.type]
      : props.tooltip?.text || defaultTexts[props.type];

  if (!text) return undefined;

  return {
    text,
    disabled: typeof props.tooltip === "object" && !!props.tooltip.disabled,
    placement:
      typeof props.tooltip === "object"
        ? (props.tooltip.position ?? "top")
        : "top",
  };
});

const getIconPath = computed(
  () => props.iconFileName || typeToIconMap[props.type] || "",
);

const icons = import.meta.glob("@/components/icon/**/*.vue");

const iconComponent = computed(() => {
  const dynamicIconName = props.icon ? dynamicIcons[props.icon] : null;
  const iconName = dynamicIconName || getIconPath.value;

  const path = \`/components/icon/\${iconName}.vue\`;

  const importer = icons[path];

  if (!importer) {
    console.warn(\`Icon not found: \${path}\`);
    return null;
  }

  return defineAsyncComponent(importer as any);
});

// methods
const getBg = (
  normal: string,
  hover: string,
  activeBg: string,
  disabled: string,
  useRgba = false,
) => {
  if (props.disabled) return disabled;
  if (props.activeBg || isActive.value) return props.activeBg || activeBg;
  if (hovering.value)
    return props.hoverBg || (useRgba ? hexToRgba(hover, 0.1) : hover);
  if (props.bgColor) return props.bgColor;
  return normal;
};

const handleMouseOver = () => {
  if (!props.nonClickable) {
    hovering.value = true;
  }
};

const handleMouseLeave = () => {
  if (!props.nonClickable) {
    hovering.value = false;
  }
};

const handleMouseDown = () => {
  if (!props.nonClickable) {
    if (hasWindowTextSelection()) return;
    isActive.value = true;
  }
};

const handleMouseUp = () => {
  if (!props.nonClickable) {
    isActive.value = false;
  }
};

const hasWindowTextSelection = () => {
  const selection = window.getSelection();
  return selection && selection.toString().length > 0;
};

const onClickBtn = () => {
  if (!props.disabled && !props.nonClickable) {
    emit("click");
  }
};

onMounted(() => {
  window.addEventListener("mouseup", handleMouseUp);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", handleMouseUp);
});
<\/script>
`;export{n as default};
