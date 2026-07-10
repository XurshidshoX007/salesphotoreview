const n=`<template>
  <div v-if="favoriteItems?.length > 0">
    <menu-btn2
      v-if="headerMenuType === 1"
      size-free
      without-padding
      @onChangeIsActive="isOpenCashDropdown = $event"
    >
      <template #btn>
        <div>
          <div
            class="cash-box"
            :class="(isOpenCashDropdown && 'cash-box-active') || 'cash-box'"
          >
            <IconBookmark />
            <div class="text-div">
              {{ t("labels.featured_pages") }}
            </div>
            <IconArrowBottom
              :class="[
                (isOpenCashDropdown && 'rotate-180 transition-all') ||
                  'rotate-0 transition-all',
              ]"
            />
          </div>
        </div>
      </template>
      <template #content>
        <div class="content-cash">
          <div class="child-content">
            <div class="cash-section">
              <div class="section-body">
                <nuxt-link
                  v-for="item in favoriteItems"
                  :key="item.id"
                  :to="withTenant(item.url)"
                  :class="
                    (isPathActive(item.url) && 'child-item-a') || 'child-item'
                  "
                >
                  <div class="child-item-name">{{ item.name }}</div>
                  <div class="child-item-icon">
                    <IconArrowRighti />
                  </div>
                </nuxt-link>
              </div>
            </div>
          </div>
        </div>
      </template>
    </menu-btn2>
    <div v-else class="slider-container">
      <div class="favorite-slider-content">
        <div class="avatar-group">
          <div
            v-for="item in visibleItems"
            :key="item.id"
            class="avatar"
            v-tooltip="{
              text: item.name,
            }"
            :class="isAllItemShow && 'split-avatar'"
            :style="\`background-color: \${item.color || '#e1e4ea'}; color: \${getContrastingTextColor(item.color)}\`"
          >
            {{ item?.name?.slice(0, 1).toUpperCase() }}
          </div>
          <div
            v-if="showAvatarCounts"
            class="avatar"
            style="background-color: #f5f6f8"
            @click="openShowAvatar"
          >
            +
            {{ favoriteItems.length - 4 }}
          </div>
        </div>
      </div>
      <div
        v-if="isAllItemShow"
        class="close-show-avatar"
        @click="closeShowAvatar"
      >
        <icon-arrow-left-double />
      </div>
    </div>
  </div>
  <div class="text-div fs-16" v-else>
    {{ t("labels.no_favorite_pages") }}
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { FavoritePageModel } from "~/interfaces/api/account/favorite-page-model";
import { FavouritePagesEventKeys } from "~/variable/event-key-constants";
import { useEventBus } from "~/composables/EventBus/eventBus";
import { useTenantPath } from "~/composables/useTenantPath";
import { storeToRefs } from "pinia";

// store
const favoriteStore = useFavoritePageSettings("true");
const { headerMenuType } = storeToRefs(favoriteStore);

// state
const { t } = useI18n();
const { withTenant, isPathActive } = useTenantPath();
const isOpenCashDropdown = ref(false);
const eventBus = useEventBus();
const isAllItemShow = ref(false);

// hooks
const favoriteItems = computed<Partial<FavoritePageModel>[]>(
  () => favoriteStore.accessibleHeaderMenuItems,
);

// methods
const openShowAvatar = () => {
  isAllItemShow.value = true;
};

const closeShowAvatar = () => {
  isAllItemShow.value = false;
};

function getContrastingTextColor(hexColor?: string): string {
  if (!hexColor) return "#000";

  hexColor = hexColor.replace("#", "");

  if (hexColor.length === 3) {
    hexColor = hexColor
      .split("")
      .map((c) => c + c)
      .join("");
  }

  const r = parseInt(hexColor.substr(0, 2), 16);
  const g = parseInt(hexColor.substr(2, 2), 16);
  const b = parseInt(hexColor.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "#000000" : "#FFFFFF";
}

// hooks
eventBus.on(
  FavouritePagesEventKeys.FAV_PAGE_ITEMS_UPDATE,
  async () => await favoriteStore.getHeaderMenuItems(),
);

const visibleItems = computed(() => {
  if (isAllItemShow.value) return favoriteItems.value;
  return favoriteItems.value.slice(0, 4);
});

const showAvatarCounts = computed(() => {
  return !isAllItemShow.value && favoriteItems.value.length - 4 > 0;
});

onMounted(async () => {
  await favoriteStore.getHeaderMenuItems();
});
<\/script>

<style scoped lang="scss">
.cash-box {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid theme("colors.neutral.200");

  .text-div {
    font-family: "Inter", sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    color: theme("colors.neutral.600");
    user-select: none;
  }
}

.cash-box:hover {
  svg {
    path {
      fill: theme("colors.neutral.600");
    }
  }

  .text-div {
    color: theme("colors.neutral.600");
  }
  background: theme("colors.neutral.50");
  border-color: theme("colors.neutral.50");
}

.cash-box-active {
  svg {
    path {
      fill: #299b9b;
    }
  }

  .text-div {
    color: #299b9b;
  }

  border-color: #299b9b;
}

.content-cash {
  .child-content {
    display: flex;
    align-items: start;
    box-shadow: 0 16px 32px -12px theme("colors.neutral.alpha.10");
    border: 1px solid theme("colors.neutral.200");
    border-radius: 8px;
    padding: 8px 4px;
    gap: 16px;
    z-index: 200 !important;
    background: white;

    .cash-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      min-width: 260px;
      gap: 4px;
      max-height: 500px;
      padding: 0 4px;
      overflow-y: auto;

      .section-name {
        font-family: "Inter", sans-serif;
        font-weight: 500;
        font-size: 14px;
        line-height: 20px;
        color: theme("colors.neutral.950");
        padding: 8px 8px 12px;
        text-wrap: nowrap;
        border-bottom: 1px solid theme("colors.neutral.200");
      }

      .section-body {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .child-item,
        .child-item-a {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 8px;
          cursor: pointer;
          border-radius: 8px;

          .child-item-name {
            font-family: "Inter", sans-serif;
            font-weight: 400;
            font-size: 14px;
            line-height: 20px;
            color: theme("colors.neutral.950");
          }

          .child-item-icon {
            width: 20px;
            height: 20px;
          }
        }

        .child-item:hover {
          background: theme("colors.neutral.50");
        }

        .child-item-a {
          background: theme("colors.neutral.50");
        }
      }
    }

    ::-webkit-scrollbar {
      width: 6px;
      border-radius: 28px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      height: 8px;
      background: #fafdfd;
      border-radius: 28px;
      margin: 8px 0;
    }

    ::-webkit-scrollbar-thumb {
      background: #299b9b;
      border-radius: 28px;
      height: 8px;
    }
  }
}
.slider-container {
  display: flex;
  align-items: center;
  gap: 4px;
  .favorite-slider-content {
    cursor: grab;

    &.active {
      cursor: grabbing;
    }

    &::-webkit-scrollbar {
      display: none;
    }
    max-width: 500px;
    scrollbar-width: none;
    -ms-overflow-style: none;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;

    .avatar-group {
      display: flex;
      cursor: pointer;
      height: 40px;
      gap: 4px;
      padding: 4px;
      align-items: center;
      flex-shrink: 0;
      min-width: max-content;

      .avatar {
        overflow: hidden;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Inter", sans-serif;
        font-weight: 500;
        font-size: 12px;
        color: theme("colors.neutral.600");
        border: 2px solid white;
        margin-left: -14px;
        cursor: pointer;
        user-select: auto;

        &:hover {
          z-index: 1;
          box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.4);
          border-color: transparent;
        }

        &:first-child {
          margin-left: 0;
        }
      }

      .split-avatar {
        margin-left: 0;
      }
    }
  }

  .close-show-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: theme("colors.neutral.50");
    cursor: pointer;
  }

  .close-show-avatar:hover {
    background: theme("colors.neutral.200");
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);
  }
}

@media screen and (max-width: 768px) {
  .header-container {
    .header-content {
      .content-cash {
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
</style>
`;export{n as default};
