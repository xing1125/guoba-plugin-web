<template>
  <div class="db-lock">
    <div class="db-lock__aurora"></div>

    <!-- 顶部：点击解锁 -->
    <button v-show="showDate" class="db-lock__hint" type="button" @click="handleShowForm(false)">
      <LockOutlined />
      <span>{{ t('sys.lock.unlock') }}</span>
    </button>

    <!-- 时钟 -->
    <div v-show="showDate" class="db-lock__clock">
      <div class="db-lock__tile">
        <span class="db-lock__num">{{ hour }}</span>
        <span class="db-lock__mer">{{ meridiem }}</span>
      </div>
      <span class="db-lock__colon">:</span>
      <div class="db-lock__tile">
        <span class="db-lock__num">{{ minute }}</span>
      </div>
    </div>

    <div v-show="showDate" class="db-lock__date">{{ year }}/{{ month }}/{{ day }} {{ week }}</div>

    <!-- 解锁面板 -->
    <transition name="fade-slide">
      <div v-show="!showDate" class="db-lock__panel">
        <div class="db-lock__card">
          <div class="db-lock__identity">
            <img :src="userinfo.avatar || headerImg" class="db-lock__avatar" alt="" />
            <p class="db-lock__name">{{ userinfo.realName }}</p>
            <p class="db-lock__tip">会话已锁定，输入密码继续</p>
          </div>

          <InputPassword
            v-model:value="password"
            :placeholder="t('sys.lock.placeholder')"
            size="large"
            class="db-lock__input"
            @pressEnter="unLock()"
          />
          <span v-if="errMsg" class="db-lock__err">{{ t('sys.lock.alert') }}</span>

          <a-button type="primary" size="large" block :loading="loading" class="db-lock__submit" @click="unLock()">
            {{ t('sys.lock.entry') }}
          </a-button>

          <div class="db-lock__foot">
            <a-button type="link" size="small" :disabled="loading" @click="handleShowForm(true)">
              {{ t('common.back') }}
            </a-button>
            <a-button type="link" size="small" :disabled="loading" @click="goLogin">
              {{ t('sys.lock.backToLogin') }}
            </a-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
<script lang="ts" setup>
  import { ref, computed } from 'vue';
  import { Input } from 'ant-design-vue';
  import { useUserStore } from '/@/store/modules/user';
  import { useLockStore } from '/@/store/modules/lock';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useNow } from './useNow';
  import { LockOutlined } from '@ant-design/icons-vue';
  import headerImg from '/@/assets/images/header.jpg';

  const InputPassword = Input.Password;

  const password = ref('');
  const loading = ref(false);
  const errMsg = ref(false);
  const showDate = ref(true);

  const lockStore = useLockStore();
  const userStore = useUserStore();

  const { hour, month, minute, meridiem, year, day, week } = useNow(true);

  const { t } = useI18n();

  const userinfo = computed(() => {
    return userStore.getUserInfo || {};
  });

  /**
   * @description: unLock
   */
  async function unLock() {
    if (!password.value) {
      return;
    }
    let pwd = password.value;
    try {
      loading.value = true;
      const res = await lockStore.unLock(pwd);
      errMsg.value = !res;
    } finally {
      loading.value = false;
    }
  }

  function goLogin() {
    userStore.logout(true);
    lockStore.resetLockInfo();
  }

  function handleShowForm(show = false) {
    showDate.value = show;
  }
</script>
<style lang="less" scoped>
  .db-lock {
    position: fixed;
    inset: 0;
    z-index: @lock-page-z-index;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    background: #07091b;
  }

  /* 深色极光底料：锁屏固定深色，不随主题切换 */
  .db-lock__aurora {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(760px 520px at 18% 10%, rgb(46 63 143 / 62%), transparent 70%),
      radial-gradient(680px 480px at 86% 24%, rgb(91 74 158 / 44%), transparent 70%),
      radial-gradient(620px 460px at 60% 98%, rgb(211 188 141 / 14%), transparent 72%);
  }

  .db-lock__hint {
    position: absolute;
    top: 26px;
    left: 50%;
    z-index: 3;
    display: inline-flex;
    gap: 8px;
    align-items: center;
    padding: 8px 16px;
    font-size: 12.5px;
    color: rgb(230 235 255 / 78%);
    cursor: pointer;
    background: rgb(255 255 255 / 7%);
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 999px;
    transition: all 0.18s ease;
    transform: translateX(-50%);

    &:hover {
      color: #e6ebff;
      background: rgb(255 255 255 / 13%);
      border-color: rgb(98 168 234 / 46%);
    }
  }

  /* ---------------- 时钟 ---------------- */
  .db-lock__clock {
    position: relative;
    z-index: 2;
    display: flex;
    gap: 18px;
    align-items: center;
    justify-content: center;
  }

  .db-lock__tile {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 210px;
    height: 210px;
    background: linear-gradient(160deg, rgb(255 255 255 / 9%), rgb(255 255 255 / 3%));
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 26px;
    box-shadow:
      0 24px 60px -30px rgb(0 0 0 / 80%),
      inset 0 1px 0 rgb(255 255 255 / 10%);
    backdrop-filter: blur(14px);
  }

  .db-lock__num {
    /* Consolas 的 0 带斜杠，"00:00" 会看成 ØØ，改用系统 UI 字体 + 等宽数字 */
    font-family: 'Segoe UI', 'PingFang SC', system-ui, sans-serif;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum';
    font-size: 116px;
    font-weight: 600;
    line-height: 1;
    color: #f2f5ff;
    letter-spacing: -3px;
    text-shadow: 0 0 42px rgb(98 168 234 / 42%);
  }

  .db-lock__mer {
    position: absolute;
    top: 16px;
    left: 18px;
    font-size: 13px;
    font-weight: 600;
    color: rgb(98 168 234 / 88%);
    letter-spacing: 1.4px;
  }

  .db-lock__colon {
    font-size: 84px;
    font-weight: 300;
    line-height: 1;
    color: rgb(230 235 255 / 40%);
    transform: translateY(-6px);
  }

  .db-lock__date {
    position: relative;
    z-index: 2;
    margin-top: 26px;
    font-size: 14px;
    color: rgb(230 235 255 / 62%);
    letter-spacing: 2.4px;
  }

  /* ---------------- 解锁面板 ---------------- */
  .db-lock__panel {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(7 9 27 / 52%);
    backdrop-filter: blur(10px);
  }

  .db-lock__card {
    width: 340px;
    padding: 30px 28px 22px;
    background: rgb(28 27 61 / 92%);
    border: 1px solid rgb(255 255 255 / 14%);
    border-radius: 18px;
    box-shadow: 0 28px 70px -26px rgb(0 0 0 / 86%);
  }

  .db-lock__identity {
    margin-bottom: 20px;
    text-align: center;
  }

  .db-lock__avatar {
    width: 66px;
    height: 66px;
    margin: 0 auto;
    object-fit: cover;
    border: 2px solid rgb(255 255 255 / 16%);
    border-radius: 50%;
  }

  .db-lock__name {
    margin: 12px 0 0;
    font-size: 15px;
    font-weight: 600;
    color: #e6ebff;
  }

  .db-lock__tip {
    margin: 6px 0 0;
    font-size: 11.5px;
    color: rgb(170 180 223 / 78%);
  }

  .db-lock__input {
    :deep(.ant-input) {
      background: rgb(255 255 255 / 7%);
      border-color: rgb(255 255 255 / 16%);
      color: #e6ebff;
    }

    :deep(.ant-input:focus),
    :deep(.ant-input-focused) {
      border-color: #62a8ea;
      box-shadow: 0 0 0 2px rgb(98 168 234 / 18%);
    }
  }

  .db-lock__err {
    display: inline-block;
    margin-top: 8px;
    font-size: 12px;
    color: #ff7875;
  }

  .db-lock__submit {
    height: 42px;
    margin-top: 16px;
    font-size: 13.5px;
    font-weight: 600;
    letter-spacing: 0.6px;
    border-radius: 10px;
  }

  .db-lock__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }

  @media (max-width: 620px) {
    .db-lock__tile {
      min-width: 132px;
      height: 132px;
      border-radius: 20px;
    }

    .db-lock__num {
      font-size: 68px;
      letter-spacing: -2px;
    }

    .db-lock__colon {
      font-size: 48px;
    }

    .db-lock__card {
      width: calc(100vw - 48px);
      padding: 24px 20px 18px;
    }
  }
</style>
