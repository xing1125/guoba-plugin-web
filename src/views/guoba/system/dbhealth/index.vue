<template>
  <PageWrapper title="">
    <div class="g-page dh-page">
      <!-- 页头 -->
      <section class="db-hero dh-hero">
        <div class="dh-hero__main">
          <div class="dh-hero__eyebrow">DATABASE HEALTH</div>
          <div class="dh-hero__title">数据健康</div>
          <div class="dh-hero__desc">本地库体检 · 热备快照 · 完整性校验（SQLite 在线备份，无需停机）</div>
        </div>
        <div class="dh-hero__side">
          <span class="dh-meta">Redis 键 {{ health?.redisKeys ?? '-' }}</span>
          <Button size="small" :loading="loading" @click="reload">刷新</Button>
          <Button size="small" type="primary" :loading="backing" @click="doBackup">立即备份</Button>
        </div>
      </section>

      <!-- 库状态卡 -->
      <section class="dh-grid">
        <div v-for="d in health?.dbs || []" :key="d.key" class="dh-card">
          <div class="dh-card__head">
            <span class="dh-card__title">{{ d.label }}</span>
            <span class="dh-badge" :class="d.exists && d.integrity === 'ok' ? 'is-ok' : 'is-bad'">
              {{ !d.exists ? '不存在' : d.integrity === 'ok' ? '完整' : '异常' }}
            </span>
          </div>
          <div class="dh-card__row"><span>文件大小</span><b>{{ fmtSize(d.size) }}</b></div>
          <div class="dh-card__row"><span>WAL</span><b>{{ fmtSize(d.wal?.size || 0) }}</b></div>
          <div class="dh-card__row"><span>表数量</span><b>{{ d.tables?.length ?? '-' }}</b></div>
          <div class="dh-card__row"><span>总行数</span><b>{{ totalRows(d) }}</b></div>
          <div class="dh-card__row"><span>修改时间</span><b>{{ shortTime(d.mtime) }}</b></div>
          <div class="dh-card__tables">
            <span v-for="t in d.tables || []" :key="t.name" class="dh-chip">{{ t.name }} · {{ t.rows }}</span>
          </div>
        </div>

        <div class="dh-card">
          <div class="dh-card__head">
            <span class="dh-card__title">备份概况</span>
          </div>
          <div class="dh-card__row"><span>备份份数</span><b>{{ health?.backupCount ?? '-' }}</b></div>
          <div class="dh-card__row"><span>最后备份</span><b>{{ shortTime(health?.lastBackupAt) || '从未' }}</b></div>
          <div class="dh-card__row"><span>备份目录</span><b class="dh-mono">{{ health?.backupDir || '-' }}</b></div>
          <div class="dh-card__ops">
            <Button size="small" :loading="checkpointing" @click="doCheckpoint">WAL 收缩</Button>
            <Button size="small" :loading="pruning" @click="doPrune">清理旧备份（留10）</Button>
          </div>
        </div>
      </section>

      <!-- 备份列表 -->
      <section class="dh-list">
        <div class="dh-list__head">
          <span class="dh-list__title">备份快照</span>
          <span class="dh-list__tip">目录快照 · 含 manifest（大小 / SHA256 / integrity_check）</span>
        </div>
        <div v-for="b in backups" :key="b.ts" class="dh-item">
          <div class="dh-item__main">
            <span class="dh-item__ts">{{ b.ts }}</span>
            <span v-for="f in b.files" :key="f.name" class="dh-chip">
              {{ f.name }} · {{ fmtSize(f.size) }}<template v-if="f.integrity"> · {{ f.integrity === 'ok' ? '✓' : '✗' }}</template>
            </span>
            <span v-if="!b.complete" class="dh-chip is-warn">无 manifest</span>
          </div>
          <div class="dh-item__side">
            <span class="dh-meta">{{ fmtSize(b.total) }}</span>
            <Button size="small" danger :loading="restoring === b.ts" @click="askRestore(b)">恢复</Button>
          </div>
        </div>
        <p v-if="!backups.length" class="dh-empty">还没有备份，点右上角「立即备份」创建第一份</p>
      </section>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { onMounted, ref } from 'vue';
  import { Button, Modal, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import {
    dbApi,
    type BackupItem,
    type DbHealth,
    type DbHealthItem,
  } from './api';

  defineOptions({ name: 'DbHealth' });

  const health = ref<DbHealth | null>(null);
  const backups = ref<BackupItem[]>([]);
  const loading = ref(false);
  const backing = ref(false);
  const checkpointing = ref(false);
  const pruning = ref(false);
  const restoring = ref('');

  function fmtSize(n?: number) {
    if (n == null) return '-';
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  function totalRows(d: DbHealthItem) {
    return (d.tables || []).reduce((s, t) => s + (t.rows || 0), 0);
  }

  function shortTime(at?: string | null) {
    if (!at) return '';
    return at.slice(0, 16).replace('T', ' ');
  }

  async function reload() {
    loading.value = true;
    try {
      const [h, b] = await Promise.all([dbApi.getHealth(), dbApi.getBackups(20)]);
      health.value = h;
      backups.value = b;
    } catch (e: any) {
      message.error(e?.message || '读取数据健康信息失败');
    } finally {
      loading.value = false;
    }
  }

  async function doBackup() {
    backing.value = true;
    try {
      await dbApi.createBackup();
      message.success('备份完成');
      await reload();
    } catch (e: any) {
      message.error(e?.message || '备份失败');
    } finally {
      backing.value = false;
    }
  }

  async function doCheckpoint() {
    checkpointing.value = true;
    try {
      const r: any = await dbApi.checkpoint();
      message.success(`WAL 收缩完成：${fmtSize(r?.before)} → ${fmtSize(r?.after)}`);
      await reload();
    } catch (e: any) {
      message.error(e?.message || '收缩失败');
    } finally {
      checkpointing.value = false;
    }
  }

  async function doPrune() {
    pruning.value = true;
    try {
      const r: any = await dbApi.prune(10);
      message.success(`已清理 ${r?.removed?.length ?? 0} 份旧备份`);
      await reload();
    } catch (e: any) {
      message.error(e?.message || '清理失败');
    } finally {
      pruning.value = false;
    }
  }

  function askRestore(b: BackupItem) {
    Modal.confirm({
      title: '确认恢复这份备份？',
      content: `将把 ${b.ts} 的数据库覆盖回当前文件。Bot 正在写入时可能转为暂存（*.restore-pending），需要停机后手动替换。建议恢复后重启 Bot。`,
      okText: '确认恢复',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        restoring.value = b.ts;
        try {
          const r: any = await dbApi.restore(b.ts, true);
          const direct = (r?.results || []).filter((x: any) => x.mode === 'direct').length;
          const pending = (r?.results || []).filter((x: any) => x.mode === 'pending').length;
          message.success(`恢复完成：直接覆盖 ${direct} 个，暂存 ${pending} 个（建议重启 Bot）`);
          await reload();
        } catch (e: any) {
          message.error(e?.message || '恢复失败');
        } finally {
          restoring.value = '';
        }
      },
    });
  }

  onMounted(reload);
</script>

<style lang="less" scoped>
  .dh-page {
    display: flex;
    flex-direction: column;
  }

  .dh-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 18px 20px;
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    background: var(--g-card-bg);
    flex-shrink: 0;

    &__eyebrow {
      font-size: 11px;
      letter-spacing: 0.28em;
      color: var(--g-violet);
      font-weight: 600;
    }
    &__title {
      font-size: 22px;
      font-weight: 700;
      color: var(--g-text);
      margin-top: 2px;
    }
    &__desc {
      font-size: 12px;
      color: var(--g-text-mute);
      margin-top: 4px;
    }
    &__side {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .dh-meta {
    font-size: 12px;
    color: var(--g-text-mute);
  }

  .dh-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .dh-card {
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    background: var(--g-card-bg);
    padding: 14px 16px;

    &__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    &__title {
      font-size: 15px;
      font-weight: 700;
      color: var(--g-text);
    }
    &__row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--g-text-mute);
      padding: 3px 0;

      b {
        color: var(--g-text);
        font-weight: 600;
        font-family: var(--g-mono, monospace);
      }
    }
    &__tables {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 8px;
    }
    &__ops {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
  }

  .dh-badge {
    font-size: 11px;
    padding: 2px 9px;
    border-radius: 999px;

    &.is-ok {
      color: #1f9d55;
      background: rgba(31, 157, 85, 0.12);
    }
    &.is-bad {
      color: #d9534f;
      background: rgba(217, 83, 79, 0.12);
    }
  }

  .dh-chip {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 8px;
    background: rgba(127, 127, 160, 0.1);
    color: var(--g-text-mute);

    &.is-warn {
      color: #b8860b;
      background: rgba(184, 134, 11, 0.12);
    }
  }

  .dh-mono {
    font-family: var(--g-mono, monospace);
    word-break: break-all;
  }

  .dh-list {
    margin-top: 14px;
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    background: var(--g-card-bg);
    padding: 14px 16px;

    &__head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
    &__title {
      font-size: 15px;
      font-weight: 700;
      color: var(--g-text);
    }
    &__tip {
      font-size: 12px;
      color: var(--g-text-mute);
    }
  }

  .dh-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 10px 0;
    border-bottom: 1px dashed var(--g-card-border);

    &:last-of-type {
      border-bottom: none;
    }

    &__main {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      min-width: 0;
    }
    &__ts {
      font-size: 13px;
      font-weight: 700;
      color: var(--g-text);
      font-family: var(--g-mono, monospace);
    }
    &__side {
      display: flex;
      align-items: center;
      gap: 10px;
    }
  }

  .dh-empty {
    text-align: center;
    font-size: 12px;
    color: var(--g-text-mute);
    padding: 18px 8px;
  }
</style>
