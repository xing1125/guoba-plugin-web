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
        <a-input
          v-model:value="username"
          size="large"
          placeholder="用户名"
          :disabled="loading"
          allow-clear
          @pressEnter="handleLogin"
        />
      </div>
      <div class="glf__field">
        <a-input-password
          v-model:value="password"
          size="large"
          placeholder="密码"
          :disabled="loading"
          @pressEnter="handleLogin"
        />
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
        <a-input
          v-model:value="code"
          size="large"
          placeholder="请输入验证码"
          :disabled="loading"
          allow-clear
          @pressEnter="handleLogin"
        />
        <a-button size="large" :disabled="isCodeButtonDisabled" @click="handleCodeLogin">
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
    gap: 6px;
    padding: 3px;
    margin-bottom: 18px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 9px;
  }

  .glf__mode {
    flex: 1;
    padding: 6px 0;
    font-size: 12.5px;
    color: var(--g-text-sub);
    text-align: center;
    cursor: pointer;
    border-radius: 7px;
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

  .glf__field :deep(.ant-input) {
    flex: 1;
    min-width: 0;
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
