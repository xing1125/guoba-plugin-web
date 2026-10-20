<template>
  <div class="glf">
    <!-- 登录方式切换：账号密码（默认） / 验证码 -->
    <div class="glf__modes">
      <span
        class="glf__mode"
        :class="{ 'is-active': mode === 'password' }"
        @click="mode = 'password'"
      >账号密码</span>
      <span
        class="glf__mode"
        :class="{ 'is-active': mode === 'code' }"
        @click="mode = 'code'"
      >验证码登录</span>
    </div>

    <!-- 账号密码登录 -->
    <template v-if="mode === 'password'">
      <div class="glf__field">
        <GInput
          v-model="username"
          size="lg"
          placeholder="用户名"
          :disabled="loading"
          @press-enter="handleLogin"
        >
          <template #prefix>
            <svg class="glf__ico" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
              <circle cx="8" cy="5.6" r="2.6" />
              <path d="M2.7 13.6c0-2.5 2.4-4.2 5.3-4.2s5.3 1.7 5.3 4.2" stroke-linecap="round" />
            </svg>
          </template>
        </GInput>
      </div>
      <div class="glf__field">
        <GInput
          v-model="password"
          type="password"
          size="lg"
          placeholder="密码"
          :disabled="loading"
          @press-enter="handleLogin"
        >
          <template #prefix>
            <svg class="glf__ico" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
              <rect x="2.6" y="6.6" width="10.8" height="7" rx="1.8" />
              <path d="M5.3 6.6V4.9a2.7 2.7 0 015.4 0v1.7" stroke-linecap="round" />
            </svg>
          </template>
        </GInput>
      </div>
      <a-button block type="primary" size="large" :loading="loading" @click="handleLogin">登 录</a-button>
      <p class="glf__tip">默认超管账号 admin / admin，首次登录后请及时修改密码</p>
    </template>

    <!-- 验证码登录 -->
    <template v-else>
      <!-- 三步引导：替代原来的空状态提示 -->
      <ol class="glf__steps">
        <li class="glf__step">
          <span class="glf__no">1</span>
          <div class="glf__step-body">
            向机器人发送 <code class="glf__code">#锅巴登录</code>
          </div>
        </li>
        <li class="glf__step">
          <span class="glf__no">2</span>
          <div class="glf__step-body">在 Bot 控制台查看收到的验证码</div>
        </li>
        <li class="glf__step">
          <span class="glf__no">3</span>
          <div class="glf__step-body">填入下方输入框并登录</div>
        </li>
      </ol>

      <div class="glf__field">
        <GInput v-model="code" size="lg" placeholder="请输入验证码" :disabled="loading" @press-enter="handleLogin">
          <template #prefix>
            <svg class="glf__ico" viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.4">
              <rect x="2.4" y="4" width="11.2" height="8.6" rx="2" />
              <path d="M2.8 5.4L8 9.1l5.2-3.7" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </template>
        </GInput>
        <a-button class="glf__codebtn" size="large" :disabled="isCodeButtonDisabled" @click="handleCodeLogin">
          {{ isCodeButtonDisabled ? `${countdown} 秒` : '获取验证码' }}
        </a-button>
      </div>

      <a-button block type="primary" size="large" :loading="loading" @click="handleLogin">登 录</a-button>
      <p class="glf__tip">验证码 5 分钟内有效；登录凭证只保存在本机浏览器</p>
    </template>
  </div>
</template>

<script lang="ts" setup>
  import { onMounted, onUnmounted, ref } from 'vue';
  import { sleep } from '/@/utils/common';
  import { useUserStore } from '/@/store/modules/user';
  import { useMessage } from '/@/hooks/web/useMessage';
  import GInput from '/@/views/guoba/system/_shared/form/GInput.vue';

  const CODE_TIMEOUT = 300;
  const userStore = useUserStore();
  const { createMessage: $message } = useMessage();

  const loading = ref(false);
  const mode = ref<'password' | 'code'>('password');
  const username = ref('');
  const password = ref('');
  const code = ref('');
  const countdown = ref(0);
  const isCodeButtonDisabled = ref(false);

  function initCountdown() {
    const savedTimestamp = localStorage.getItem('codeTimestamp');
    if (savedTimestamp) {
      const timePassed = Math.floor((Date.now() - Number(savedTimestamp)) / 1000);
      const remainingTime = CODE_TIMEOUT - timePassed;
      if (remainingTime > 0) {
        startCountdown(remainingTime);
      }
    }
  }

  function startCountdown(duration: number) {
    isCodeButtonDisabled.value = true;
    countdown.value = duration;
    const intervalId = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(intervalId);
        countdown.value = 0;
        isCodeButtonDisabled.value = false;
        localStorage.removeItem('codeTimestamp');
      }
    }, 1000);
  }

  async function handleCodeLogin() {
    try {
      loading.value = true;
      await userStore.loginCodeRequest();
      $message.success('验证码发送成功，请在控制台查收');
      localStorage.setItem('codeTimestamp', Date.now().toString());
      startCountdown(CODE_TIMEOUT);
    } catch (e) {
      $message.error('获取验证码失败');
    } finally {
      loading.value = false;
    }
  }

  async function handleLogin() {
    try {
      loading.value = true;
      if (mode.value === 'password') {
        if (!username.value || !password.value) {
          $message.error('请输入用户名和密码');
          return;
        }
        await userStore.login({ username: username.value, password: password.value, mode: 'none' });
        $message.success('登录成功');
        await sleep(500);
        window.location.reload();
      } else {
        if (!code.value) {
          $message.error('请输入验证码');
          return;
        }
        const res = await userStore.loginCodeCheck(code.value);
        if (res?.token) {
          userStore.setToken(res.token);
          $message.success('登录成功');
          localStorage.removeItem('codeTimestamp');
          await sleep(500);
          window.location.reload();
        } else {
          $message.error('登录失败');
        }
      }
    } catch (e: any) {
      $message.error(e?.message || '登录失败');
    } finally {
      loading.value = false;
    }
  }

  onMounted(() => {
    initCountdown();
  });

  onUnmounted(() => {
    if (isCodeButtonDisabled.value) {
      localStorage.setItem('codeTimestamp', (Date.now() - (CODE_TIMEOUT - countdown.value) * 1000).toString());
    }
  });
</script>

<style scoped lang="less">
  /* 登录方式切换 */
  .glf__modes {
    display: flex;
    gap: 4px;
    padding: 4px;
    margin-bottom: 16px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-field-border);
    border-radius: 12px;
  }

  .glf__mode {
    flex: 1;
    padding: 8px 0;
    font-size: 13px;
    color: var(--g-text-sub);
    text-align: center;
    cursor: pointer;
    border-radius: 9px;
    transition: all 0.18s ease;
    user-select: none;
  }

  .glf__mode.is-active {
    color: var(--g-blue);
    font-weight: 600;
    background: var(--g-card-bg);
    box-shadow: 0 1px 4px rgb(0 0 0 / 10%);
  }

  /* 三步引导 */
  .glf__steps {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 0;
    margin: 0 0 18px;
    list-style: none;
  }

  .glf__step {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--g-text-sub);
  }

  .glf__no {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-top: 1px;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--g-blue);
    background: rgb(98 168 234 / 15%);
    border-radius: 6px;
  }

  .glf__step-body {
    min-width: 0;
  }

  .glf__code {
    padding: 1px 5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
    color: var(--g-text);
    background: var(--g-chip-bg);
    border-radius: 4px;
  }

  /* 验证码输入 + 获取按钮 */
  .glf__field {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
  }

  /* 自研输入框在登录卡里放大一档（42 高 / 11 圆角 / 13.5 字号），与右侧按钮齐平。
   * 选择器都带 .gc-lg 双类：guoba-controls.less 的规则挂在 :root:root 下（0,3,0），
   * 只写单个 .gc-input 会同权重打架，双类稳定压过。 */
  .glf__field :deep(.gc-lg.gc-input) {
    flex: 1;
    min-width: 0;
    height: 42px;
    padding: 0 12px;
    border-radius: 11px;
  }

  .glf__field :deep(.gc-lg .gc-input__inner) {
    font-size: 13.5px;
  }

  .glf__field :deep(.gc-lg .gc-input__inner::placeholder) {
    font-size: 13px;
  }

  .glf__field :deep(.gc-lg .gc-input__prefix) {
    margin-right: 9px;
    color: var(--g-text-mute);
  }

  /* 前后缀图标在聚焦时跟着主色走，弱化但不呆板 */
  .glf__field :deep(.gc-lg.is-focused .gc-input__prefix) {
    color: var(--g-blue);
  }

  .glf__field :deep(.gc-lg .gc-input__eye),
  .glf__field :deep(.gc-lg .gc-input__clear) {
    width: 18px;
    height: 18px;
  }

  .glf__ico {
    display: block;
  }

  .glf__codebtn {
    flex: none;
    height: 42px;
    font-size: 13px;
    border-radius: 11px;
    min-width: 104px;
  }

  .glf__field :deep(.ant-btn) {
    flex: none;
  }

  .glf__tip {
    margin: 12px 0 0;
    font-size: 11.5px;
    line-height: 1.6;
    color: var(--g-text-mute);
    text-align: center;
  }
</style>
