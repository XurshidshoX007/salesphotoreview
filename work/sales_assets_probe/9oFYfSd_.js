const n=`<template>
  <div>
    <menu-btn-2 size-free without-padding>
      <template #btn>
        <button>
          <img src="~assets/ellipse.png" alt="" class="h-10.25 w-10.25" />
        </button>
      </template>
      <template #content>
        <div class="profile-content">
          <div class="content-header">
            <div class="name truncate" :title="userFullName">
              {{ userFullName }}
            </div>
            <div class="login">
              {{ profile?.login }}
            </div>
          </div>
          <div class="content-body">
            <nuxt-link to="/account" class="section">
              <icon-user :size="20" class="text-[#525866]" />
              <div class="text">{{ t("account.profile") }}</div>
            </nuxt-link>
            <div @click="toggleClearCache" class="section">
              <icon-clear-cache />
              <div class="text">{{ t("account.clear_cache") }}</div>
            </div>
            <div class="section">
              <header-language-dropdown />
            </div>
          </div>

          <div @click="handleLogOut" class="section-logout">
            <icon-loading
              v-if="isLogOutLoading"
              :loading="isLogOutLoading"
              color="#d10505"
              :width="4"
              :height="4"
            />
            <icon-log-out v-if="!isLogOutLoading" />
            <div class="text">{{ t("account.log_out") }}</div>
          </div>
        </div>
      </template>
    </menu-btn-2>
  </div>
</template>

<script setup lang="ts">
import type { ProfileModel } from "~/interfaces/api/header/profile-model";
import { useI18n } from "vue-i18n";
import { logOut } from "#imports";

// emits
const emit = defineEmits<{
  (e: "clearCache"): void;
}>();

// store
const authStore = useAuthStore();

// composables
const { t } = useI18n();

// state
const isLogOutLoading = ref(false);

//props

const props = defineProps<{
  profile: ProfileModel;
}>();

// method

const toggleClearCache = () => {
  emit("clearCache");
};

const handleLogOut = async () => {
  try {
    isLogOutLoading.value = true;

    await authStore.logOut();
    logOut();
  } finally {
    isLogOutLoading.value = false;
  }
};

const userFullName = computed(() => {
  return \`\${props.profile?.first_name || ""} \${
    props.profile?.middle_name || ""
  } \${props.profile?.last_name || ""}\`;
});
<\/script>

<style scoped lang="scss">
.profile-content {
  box-shadow: 0 16px 32px -12px theme("colors.neutral.alpha.10");
  border: 1px solid theme("colors.neutral.200");
  border-radius: 10px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: white;

  .content-header {
    display: flex;
    flex-direction: column;
    align-items: start;
    border-bottom: 1px solid theme("colors.neutral.200");
    padding: 8px;
    gap: 4px;

    .name {
      font-family: "Inter", sans-serif;
      font-weight: 500;
      font-size: 14px;
      line-height: 20px;
      overflow-wrap: anywhere;
      color: theme("colors.neutral.950");
      min-width: 200px;
      max-width: 240px;
    }

    .login {
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 12px;
      line-height: 16px;
      color: theme("colors.neutral.600");
    }
  }
  .content-body {
    padding-bottom: 4px;
    border-bottom: 1px solid theme("colors.neutral.200");

    .section {
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      border-radius: 8px;
      cursor: pointer;
      user-select: none;

      .text {
        font-family: "Inter", sans-serif;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        color: theme("colors.neutral.950");
      }
    }

    .section:hover {
      background: theme("colors.neutral.50");
    }
  }

  .section-logout {
    padding: 8px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    width: 100%;
    cursor: pointer;
    user-select: none;

    .text {
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 20px;
      color: #d10505;
    }
  }

  .section-logout:hover {
    background: theme("colors.neutral.50");
  }
}
</style>
`;export{n as default};
