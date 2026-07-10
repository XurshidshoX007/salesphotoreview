const n=`<script lang="ts">
import { type Component, defineComponent, h, ref } from "vue";

export default defineComponent({
  props: {
    is: { type: Object, required: true },
    iconProps: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const hasError = ref(false);
    onErrorCaptured(() => {
      hasError.value = true;
      return false;
    });
    return () =>
      hasError.value
        ? h("span", { class: "text-[10px] text-red-400" }, "err")
        : h(props.is as Component, props.iconProps);
  },
});
<\/script>
`;export{n as default};
