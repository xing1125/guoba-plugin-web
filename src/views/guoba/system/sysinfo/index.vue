<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头横幅 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">SYSTEM MONITOR</div>
          <div class="db-hero__title">系统信息</div>
          <div class="db-hero__desc">
            服务器软硬件状态一屏掌握：OS / 内核 / CPU / 内存 / 磁盘 / GPU / 电池
            <span v-if="info?.collectedAt" class="db-hero__time">· 采集于 {{ shortTime(info.collectedAt) }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSegmented
            :model-value="autoSec"
            :options="[
              { value: 0, label: '手动' },
              { value: 15, label: '15s' },
              { value: 60, label: '60s' },
            ]"
            label="自动刷新间隔"
            @update:model-value="setAuto($event as number)"
          />
          <Button size="small" :loading="loading" @click="load">刷新</Button>
          <Button size="small" @click="openMobileLink">
            <Icon :icon="$gm('qrcode')" :size="13" style="margin-right: 4px" />
            移动端访问
          </Button>
        </div>
      </section>

      <!-- ============================ 概览 + 处理器 ============================ -->
      <section class="si-grid">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('info')" :size="13" /></i>
              概览
            </div>
            <span class="gm-panel__extra">{{ info?.host?.hostname || '…' }}</span>
          </div>
          <div class="si-rows">
            <div class="si-row"><span class="si-row__label">OS</span><span class="si-row__value">{{ osText }}</span></div>
            <div class="si-row"><span class="si-row__label">主机</span><span class="si-row__value">{{ hostText }}</span></div>
            <div class="si-row"><span class="si-row__label">内核</span><span class="si-row__value">{{ info?.kernel || '—' }} <small class="si-dim">({{ info?.os?.arch }})</small></span></div>
            <div class="si-row"><span class="si-row__label">系统运行</span><span class="si-row__value">{{ fmtUptime(info?.uptimeSec) }}</span></div>
            <div class="si-row"><span class="si-row__label">云崽运行</span><span class="si-row__value">{{ fmtUptime(info?.botUptimeSec) }}</span></div>
            <div class="si-row"><span class="si-row__label">运行时</span><span class="si-row__value">Node.js {{ info?.runtime?.node || '—' }} · RSS {{ fmtMB(info?.runtime?.rss) }}</span></div>
            <div class="si-row"><span class="si-row__label">本机 IP</span><span class="si-row__value">{{ info?.net?.ip || '—' }}</span></div>
            <div class="si-row"><span class="si-row__label">电池</span><span class="si-row__value">{{ batteryText }}</span></div>
            <div class="si-row"><span class="si-row__label">语言 / 时区</span><span class="si-row__value">{{ info?.runtime?.locale || '—' }} · {{ info?.runtime?.timezone || '—' }}</span></div>
          </div>
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('cpu')" :size="13" /></i>
              处理器
            </div>
            <span class="gm-panel__extra">{{ cpu?.cores || '—' }} 核</span>
          </div>
          <div class="si-cpu">
            <div class="si-cpu__big" :class="pctClass(cpu?.usage)">
              {{ cpu?.usage ?? '—' }}<small>%</small>
            </div>
            <div class="si-cpu__model">{{ cpu?.model || '—' }}</div>
            <div class="si-core-grid">
              <div v-for="(u, i) in cpu?.perCore || []" :key="i" class="si-core">
                <div class="si-bar si-bar--mini">
                  <span class="si-bar__fill" :class="pctClass(u)" :style="{ width: `${u}%` }" />
                </div>
                <span class="si-core__n">#{{ i }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ============================ 内存 / 显卡 ============================ -->
      <section class="si-grid si-grid--2">
        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('memory')" :size="13" /></i>
              内存与交换分区
            </div>
            <span class="gm-panel__extra">实时</span>
          </div>
          <div class="si-meters">
            <div class="si-meter">
              <div class="si-meter__head">
                <span class="si-meter__name">物理内存</span>
                <span class="si-meter__val" :class="pctClass(mem?.usedPct)">{{ mem?.usedPct ?? '—' }}%</span>
              </div>
              <div class="si-bar">
                <span class="si-bar__fill" :class="pctClass(mem?.usedPct)" :style="{ width: `${mem?.usedPct || 0}%` }" />
              </div>
              <div class="si-meter__foot">{{ fmtGB(mem?.used) }} / {{ fmtGB(mem?.total) }}</div>
            </div>
            <template v-if="swap">
              <div class="si-meter">
                <div class="si-meter__head">
                  <span class="si-meter__name">交换分区（页面文件）</span>
                  <span class="si-meter__val" :class="pctClass(swap.usedPct)">{{ swap.usedPct }}%</span>
                </div>
                <div class="si-bar">
                  <span class="si-bar__fill" :class="pctClass(swap.usedPct)" :style="{ width: `${swap.usedPct}%` }" />
                </div>
                <div class="si-meter__foot">{{ fmtGB(swap.used) }} / {{ fmtGB(swap.total) }}</div>
              </div>
            </template>
          </div>
        </div>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('monitor')" :size="13" /></i>
              显卡
            </div>
            <span class="gm-panel__extra">{{ gpus.length || 0 }} 块</span>
          </div>
          <div v-if="!gpus.length" class="si-dim si-pad">未检测到显卡信息</div>
          <div v-for="(g, i) in gpus" :key="i" class="si-meter si-meter--gpu">
            <div class="si-meter__head">
              <span class="si-meter__name">{{ g.name }}</span>
              <span class="si-chips">
                <span v-if="g.temp != null" class="si-chip">{{ g.temp }}°C</span>
                <span v-if="g.utilPct != null" class="si-chip">占用 {{ g.utilPct }}%</span>
                <span class="si-chip si-chip--dim">{{ g.source }}</span>
              </span>
            </div>
            <div v-if="g.vramTotal > 0" class="si-bar">
              <span
                class="si-bar__fill"
                :class="pctClass(vramPct(g))"
                :style="{ width: `${vramPct(g)}%` }"
              />
            </div>
            <div v-if="g.vramTotal > 0" class="si-meter__foot">
              显存 {{ fmtGB(g.vramUsed) }} / {{ fmtGB(g.vramTotal) }}（{{ vramPct(g) }}%）
            </div>
          </div>
        </div>
      </section>

      <!-- ============================ 磁盘 ============================ -->
      <section class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('harddisk')" :size="13" /></i>
            磁盘
          </div>
          <span class="gm-panel__extra">{{ disks.length }} 个分区</span>
        </div>
        <div v-if="!disks.length" class="si-dim si-pad">未检测到磁盘信息</div>
        <div class="si-disks">
          <div v-for="d in disks" :key="d.id" class="si-meter">
            <div class="si-meter__head">
              <span class="si-meter__name">
                {{ d.id }}
                <small v-if="d.label" class="si-dim">{{ d.label }}</small>
                <small class="si-dim">{{ d.fs }}</small>
              </span>
              <span class="si-meter__val" :class="pctClass(d.usedPct)">{{ d.usedPct }}%</span>
            </div>
            <div class="si-bar">
              <span class="si-bar__fill" :class="pctClass(d.usedPct)" :style="{ width: `${d.usedPct}%` }" />
            </div>
            <div class="si-meter__foot">已用 {{ fmtGB(d.used) }} / 共 {{ fmtGB(d.total) }} · 剩余 {{ fmtGB(d.free) }}</div>
          </div>
        </div>
      </section>

      <!-- ============================ 移动端访问 ============================ -->
      <GModal :visible="mobile.visible" title="移动端访问" subtitle="手机扫码或复制链接，局域网内直接查看数据" :width="440" @close="mobile.visible = false">
        <div class="si-mobile">
          <template v-if="mobile.links.length">
            <div class="si-mobile__qr">
              <QrCode :value="mobile.links[0]" :width="200" />
            </div>
            <div class="si-mobile__hint">
              用手机浏览器 / 相机扫码打开（需与本机同一局域网）。链接含一次性登录码，<b>3 分钟内有效</b>
              ；登录后本机 24 小时免登。
            </div>
            <div class="si-mobile__list">
              <button v-for="(u, i) in mobile.links" :key="i" class="si-mobile__link" type="button" @click="copyLink(u)">
                <span class="si-mobile__url">{{ u }}</span>
                <Icon :icon="$gm('copy')" :size="13" />
              </button>
            </div>
          </template>
          <div v-else-if="mobile.loading" class="si-mobile__empty">正在生成访问链接…</div>
          <div v-else class="si-mobile__empty">
            未获取到可用的局域网地址
            <div class="si-mobile__empty-sub">请确认设备与 bot 主机在同一网络，或检查荧后台「服务地址」配置</div>
          </div>
        </div>
        <template #footer>
          <Button @click="openMobileLink">重新生成</Button>
          <Button v-if="mobile.links.length" type="primary" @click="copyLink(mobile.links[0])">复制链接</Button>
        </template>
      </GModal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
  import { Button, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { QrCode } from '/@/components/Qrcode';
  import GModal from '../_shared/dialog/GModal.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import { defHttp } from '/@/utils/http/axios';

  interface GpuInfo {
    name: string;
    utilPct: number | null;
    vramUsed: number;
    vramTotal: number;
    temp: number | null;
    source: string;
  }
  interface DiskInfo {
    id: string;
    label: string;
    fs: string;
    total: number;
    free: number;
    used: number;
    usedPct: number;
  }
  interface SysInfo {
    collectedAt: string;
    os: { type: string; release: string; arch: string; caption: string; version: string; build: string };
    host: { hostname: string; model: string; maker: string };
    kernel: string;
    uptimeSec: number;
    botUptimeSec: number;
    cpu: { model: string; cores: number; speedMHz: number; usage: number; perCore: number[] };
    memory: { total: number; free: number; used: number; usedPct: number };
    swap: { total: number; used: number; free: number; usedPct: number } | null;
    gpus: GpuInfo[];
    disks: DiskInfo[];
    net: { ip: string };
    battery: { pct: number; ac: boolean } | null;
    runtime: { node: string; rss: number; locale: string; timezone: string };
  }

  const info = ref<SysInfo | null>(null);
  const loading = ref(false);
  const autoSec = ref(15);
  let timer: ReturnType<typeof setInterval> | null = null;

  async function load() {
    loading.value = true;
    try {
      info.value = await defHttp.get<SysInfo>({ url: '/admin/sysinfo/info' });
    } finally {
      loading.value = false;
    }
  }

  function setAuto(sec: number) {
    autoSec.value = sec;
    resetTimer();
  }
  function resetTimer() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (autoSec.value > 0) {
      timer = setInterval(load, autoSec.value * 1000);
    }
  }
  onMounted(() => {
    load();
    resetTimer();
  });
  onUnmounted(() => {
    if (timer) clearInterval(timer);
  });

  /* ------------------------------ 派生数据 ------------------------------ */

  const cpu = computed(() => info.value?.cpu);
  const mem = computed(() => info.value?.memory);
  const swap = computed(() => info.value?.swap);
  const gpus = computed(() => info.value?.gpus || []);
  const disks = computed(() => info.value?.disks || []);

  const osText = computed(() => {
    const o = info.value?.os;
    if (!o) return '—';
    if (o.caption) {
      return `${o.caption.replace(/^Microsoft\s+/, '')}（build ${o.build || o.version}）`;
    }
    return `${o.type} ${o.release}`;
  });
  const hostText = computed(() => {
    const h = info.value?.host;
    if (!h) return '—';
    return h.model ? `${h.hostname} · ${h.model}` : h.hostname;
  });
  const batteryText = computed(() => {
    const b = info.value?.battery;
    if (!b) return '—（未检测到电池）';
    return `${b.pct}%（${b.ac ? '已接电源' : '放电中'}）`;
  });

  /* ------------------------------ 工具函数 ------------------------------ */

  const GB = 1024 ** 3;
  function fmtGB(bytes?: number) {
    if (bytes == null || !Number.isFinite(bytes)) return '—';
    return `${(bytes / GB).toFixed(1)} GB`;
  }
  function fmtMB(bytes?: number) {
    if (bytes == null || !Number.isFinite(bytes)) return '—';
    return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  }
  function fmtUptime(sec?: number) {
    if (sec == null || !Number.isFinite(sec) || sec < 0) return '—';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (d > 0) return `${d} 天 ${h} 小时 ${m} 分`;
    if (h > 0) return `${h} 小时 ${m} 分`;
    return `${m} 分`;
  }
  function pctClass(p?: number | null) {
    if (p == null || !Number.isFinite(p)) return '';
    if (p >= 85) return 'is-bad';
    if (p >= 70) return 'is-warn';
    return 'is-ok';
  }
  function vramPct(g: GpuInfo) {
    if (!g.vramTotal) return 0;
    return Math.max(0, Math.min(100, Math.round((g.vramUsed / g.vramTotal) * 100)));
  }
  function shortTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString('zh-CN', { hour12: false });
    } catch {
      return iso;
    }
  }

  /* ------------------------------ 移动端访问 ------------------------------ */

  const mobile = reactive<{ visible: boolean; loading: boolean; links: string[] }>({
    visible: false,
    loading: false,
    links: [],
  });

  async function openMobileLink() {
    mobile.visible = true;
    mobile.loading = true;
    try {
      const res = await defHttp.post<{ links: string[]; expiresIn: number }>({
        url: '/admin/auth/quick-link',
      });
      mobile.links = res?.links || [];
      if (!mobile.links.length) {
        message.warning('未获取到局域网地址');
      }
    } catch (e: any) {
      message.error(e?.message || '生成访问链接失败');
      mobile.links = [];
    } finally {
      mobile.loading = false;
    }
  }

  async function copyLink(u: string) {
    try {
      await navigator.clipboard.writeText(u);
      message.success('已复制，手机浏览器粘贴打开即可');
    } catch {
      // http 非安全上下文 clipboard 不可用 → 降级
      const ta = document.createElement('textarea');
      ta.value = u;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      if (ok) message.success('已复制');
      else message.warning('复制失败，请手动选择链接文本');
    }
  }
</script>

<style lang="less" scoped>
  /* ------------------------------ 布局 ------------------------------ */
  .si-grid {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 14px;
    margin-bottom: 14px;

    &.si-grid--2 {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    @media (max-width: 960px) {
      grid-template-columns: minmax(0, 1fr) !important;
    }
  }

  /* ------------------------------ 概览行（screenfetch 风） ------------------------------ */
  .si-rows {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 4px 0;
  }
  .si-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 5px 10px;
    border-radius: 8px;

    &:nth-child(odd) {
      background: var(--g-hover);
    }

    &__label {
      flex: 0 0 92px;
      font-weight: 600;
      font-size: 13px;
      color: var(--g-blue);
    }
    &__value {
      flex: 1;
      min-width: 0;
      font-size: 13px;
      word-break: break-all;
    }
  }
  .si-dim {
    opacity: 0.55;
    font-weight: 400;
  }
  .si-pad {
    padding: 10px 12px;
    font-size: 13px;
  }

  /* ------------------------------ 处理器 ------------------------------ */
  .si-cpu {
    padding: 6px 12px 12px;

    &__big {
      font-size: 44px;
      font-weight: 700;
      line-height: 1.1;

      small {
        font-size: 18px;
        font-weight: 500;
        margin-left: 2px;
        opacity: 0.7;
      }

      &.is-ok { color: var(--g-green); }
      &.is-warn { color: var(--g-amber); }
      &.is-bad { color: var(--g-red); }
    }
    &__model {
      margin: 4px 0 12px;
      font-size: 12px;
      opacity: 0.65;
      word-break: break-all;
    }
  }
  .si-core-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px 14px;
  }
  .si-core {
    display: flex;
    align-items: center;
    gap: 6px;

    .si-bar--mini {
      flex: 1;
      height: 6px;
    }
    &__n {
      flex: 0 0 24px;
      font-size: 11px;
      opacity: 0.5;
      text-align: right;
    }
  }

  /* ------------------------------ 用量条 ------------------------------ */
  .si-bar {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: var(--g-hover);
    overflow: hidden;

    &__fill {
      display: block;
      height: 100%;
      border-radius: 4px;
      transition: width 0.4s ease;

      &.is-ok { background: var(--g-green); }
      &.is-warn { background: var(--g-amber); }
      &.is-bad { background: var(--g-red); }
    }
  }

  /* ------------------------------ 内存 / 显卡 / 磁盘 ------------------------------ */
  .si-meters {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 8px 12px 12px;
  }
  .si-meter {
    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 6px;
    }
    &__name {
      font-size: 13px;
      font-weight: 600;

      small {
        margin-left: 6px;
        font-weight: 400;
      }
    }
    &__val {
      font-size: 13px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;

      &.is-ok { color: var(--g-green); }
      &.is-warn { color: var(--g-amber); }
      &.is-bad { color: var(--g-red); }
    }
    &__foot {
      margin-top: 4px;
      font-size: 12px;
      opacity: 0.6;
      font-variant-numeric: tabular-nums;
    }
  }
  .si-meter--gpu + .si-meter--gpu {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed var(--g-card-border);
  }
  .si-chips {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
  }
  .si-chip {
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 11px;
    background: var(--g-hover);

    &--dim {
      opacity: 0.5;
    }
  }
  .si-disks {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 24px;
    padding: 8px 12px 14px;

    @media (max-width: 960px) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  /* ------------------------------ 移动端访问弹窗 ------------------------------ */
  .si-mobile {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;

    &__qr {
      padding: 12px;
      background: #fff;
      border-radius: 12px;
    }
    &__hint {
      font-size: 12px;
      line-height: 1.6;
      color: var(--g-text-mute, #6b7280);
      text-align: center;
    }
    &__list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    &__link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      width: 100%;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--g-blue, #2563eb);
      text-align: left;
      cursor: pointer;
      background: var(--g-hover, rgba(127, 127, 127, 0.08));
      border: 1px solid var(--g-card-border, transparent);
      border-radius: 8px;

      &:hover {
        border-color: var(--g-blue, #2563eb);
      }
    }
    &__url {
      overflow: hidden;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &__empty {
      padding: 30px 0;
      font-size: 13px;
      text-align: center;
      color: var(--g-text-mute, #6b7280);

      &-sub {
        margin-top: 6px;
        font-size: 12px;
        opacity: 0.7;
      }
    }
  }
</style>
