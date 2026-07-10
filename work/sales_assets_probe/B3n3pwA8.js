const e=`<template>
  <div class="header-container">
    <div class="header-content">
      <div class="mobile-menu-btn" @click="openMobileMenu">
        <IconMenuMobile />
      </div>
      <nuxt-link
        v-if="hasAccess2Gps"
        class="gps-btn"
        :class="route.path?.includes('gps') && 'gps-btn-active'"
        to="/gps"
      >
        <icon-gps />
        GPS
      </nuxt-link>
      <div class="favorite-page-section">
        <header-favorite-dropdown :favorite-items="favoriteItems" />
      </div>
    </div>

    <div class="right-section">
      <header-profile-dropdown
        :profile="profile"
        @clear-cache="closeClearCache"
      />
    </div>

    <div class="mobile-menu">
      <div class="relative">
        <Sidebar
          for-mobile
          :is-menu-open="true"
          :classes="{
            root: 'absolute h-screen w-[360px] max-[350px]:w-[320px]',
          }"
        />
        <div @click="openMobileMenu" class="close">
          <icon-close-menu />
        </div>
      </div>
    </div>
    <div class="mobile-menu-background"></div>
  </div>
  <transition name="modal">
    <div v-if="isClearCache">
      <ConfirmationDialog
        :text="t('labels.do_you_clear_cache')"
        @closeDialog="closeClearCache"
        @onSave="clearCache"
      />
    </div>
  </transition>
</template>

<script setup lang="ts">
import { clearLibConstants, clearCheckedItems } from "~/utils/local-storage";
import { useI18n } from "vue-i18n";
import { useGpsAccess } from "~/composables/access/gps/gps-access";
import type { FavoritePageModel } from "~/interfaces/api/account/favorite-page-model";
import type { ProfileModel } from "~/interfaces/api/header/profile-model";
import { useLocalization } from "~/composables/useLocalization";

// stores
const headerStore = useHeaderStore();

// states
const { t } = useI18n();
const { hasAccess2Gps } = useGpsAccess();
const { loadCultures } = useLocalization();
const isClearCache = ref<boolean>(false);
const route = useRoute();
const activeUrl = ref(null);
const profile = ref<ProfileModel>();
const favoriteItems = ref<FavoritePageModel[]>();
const mobileMenuIsActive = ref<boolean>(false);

// hooks

onMounted(async () => {
  if (useCookie("token").value) {
    profile.value = await headerStore.getUserProfile();
    activeUrl.value = window.location.pathname;
    await loadCultures();
  }
});

// methods
const closeClearCache = () => {
  isClearCache.value = !isClearCache.value;
};

const clearCache = () => {
  clearLibConstants();
  clearCheckedItems();
  window.location.reload();
};

const openMobileMenu = () => {
  const menu = document.querySelector(".mobile-menu");
  const mobileBackground = document.querySelector(".mobile-menu-background");
  if (!mobileMenuIsActive.value && true) {
    menu.style.left = "0";
    menu.style.transition = "0.3s";
    mobileBackground.style.display = "block";
    localStorage.setItem("sidebar", "true");
  } else {
    mobileBackground.style.display = "none";
    menu.style.left = "calc(-300px - 100%)";
    menu.style.transition = "0.3s";
  }
  mobileMenuIsActive.value = !mobileMenuIsActive.value;
};

// hooks

watch(
  () => route?.fullPath,
  (newPath) => {
    const menu = document.querySelector(".mobile-menu");
    const mobileBackground = document.querySelector(".mobile-menu-background");
    if (mobileBackground) {
      mobileBackground.style.display = "none";
    }
    if (menu) {
      menu.style.left = "calc(-300px - 100%)";
      menu.style.transition = "0.3s";
    }
  },
);
<\/script>

<style lang="scss">
.header-container {
  height: 61px;
  padding: 10px 20px;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 88;
  box-shadow: 0 16px 32px -12px theme("colors.neutral.alpha.10");
  position: relative;

  .header-content {
    display: flex;
    align-items: center;
    gap: 0 12px;

    .mobile-menu-btn {
      display: none;
    }

    .gps-btn {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0 8px;
      padding: 10px;
      border-radius: 10px;
      border: 1px solid theme("colors.neutral.200");
      font-family: "Inter", sans-serif;
      font-weight: 400;
      font-size: 14px;
      line-height: 18px;
      color: theme("colors.neutral.600");
      user-select: none;
      box-sizing: content-box;
    }

    .gps-btn:hover {
      svg {
        path {
          fill: theme("colors.neutral.600");
        }
      }

      color: theme("colors.neutral.600");
      background: theme("colors.neutral.50");
      border-color: theme("colors.neutral.50");
    }

    .gps-btn-active {
      svg {
        path {
          fill: #299b9b;
        }
      }

      color: #299b9b;
      border-color: #299b9b;
    }
  }

  .right-section {
    display: flex;
    gap: 16px;
    position: relative;
    align-items: center;
  }

  .mobile-menu-background {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background-color: transparent;
    z-index: 11;
  }

  .mobile-menu {
    display: none;
    position: absolute;
    top: 0;
    left: calc(-300px - 100%);
    width: 100%;
    height: 100vh;

    .close {
      position: absolute;
      left: 300px;
      top: 20px;
      padding: 8px;
      background-color: white;
      border-radius: 50%;
      z-index: 1122 !important;
    }
  }
}

@media only screen and (max-width: 992px) {
  .header-container {
    box-shadow: none;

    .mobile-menu {
      display: block;
    }

    .mobile-menu-background {
      background-color: rgba(0, 0, 0, 0.3);
    }

    .header-content {
      .favorite-page-section {
        display: none;
      }

      .mobile-menu-btn {
        display: block;
      }
    }

    .right-section {
      .desktop-language {
        display: none;
      }

      .mobile-language {
        display: block;
        padding: 9px 12px;

        .language {
          background: transparent;
          border: none;
          justify-content: start;
          padding-left: 4px;
          gap: 12px;
          height: fit-content;
        }
      }
    }
  }
}

@media screen and (max-width: 768px) {
  .header-container {
    .header-content {
      .content-cash {
        ::-webkit-scrollbar {
          width: 6px;
          border-radius: 28px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          height: 8px;
          background: theme("colors.neutral.0");
          border-radius: 28px;
        }

        ::-webkit-scrollbar-thumb {
          background: #299b9b;
          border-radius: 28px;
          height: 8px;
        }

        .child-content {
          width: fit-content;
          flex-wrap: wrap;
          max-height: 400px;
          overflow-y: auto;
        }
      }
    }
  }
}

@media screen and (max-width: 350px) {
  .header-container {
    .mobile-menu {
      .close {
        left: 260px;
      }
    }
  }
}
</style>
`;export{e as default};
