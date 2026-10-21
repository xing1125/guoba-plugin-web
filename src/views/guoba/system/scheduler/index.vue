<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">SCHEDULER</div>
          <div class="db-hero__title">定时任务</div>
          <div class="db-hero__desc">
            到点后以 Bot 身份把指令发进群 / 私聊 · 模拟真实消息链路，老插件零改造
            <span v-if="data.lastTickAt" class="db-hero__time">· 上次调度 {{ fmtTimeShort(data.lastTickAt) }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <Button type="primary" @click="openCreate">
            <Icon :icon="$gm('plus')" :size="13" style="margin-right: 4px" />
            新建任务
          </Button>
          <Button :loading="loading" @click="reload">
            <Icon :icon="$gm('refresh')" :size="13" style="margin-right: 4px" />
            刷新
          </Button>
        </div>
      </section>

      <!-- ============================ 指标卡 ============================ -->
      <section class="db-kpi">
        <template v-if="booting">
          <div v-for="i in 4" :key="i" class="gm-skeleton" style="height: 108px" />
        </template>
        <template v-else>
          <div v-for="c in cards" :key="c.key" class="db-kpi__card">
            <div class="db-kpi__icon" :style="{ background: `linear-gradient(135deg, ${c.color}, ${c.color2})` }">
              <Icon :icon="c.icon" :size="19" />
            </div>
            <div class="db-kpi__body">
              <div class="db-kpi__label">{{ c.label }}</div>
              <div class="db-kpi__value">
                {{ c.value }}<small v-if="c.unit">{{ c.unit }}</small>
              </div>
              <div class="db-kpi__foot">{{ c.foot }}</div>
            </div>
          </div>
        </template>
      </section>

      <!-- ============================ 任务列表 ============================ -->
      <div class="g-card">
        <div class="gm-panel__head">
          <div class="gm-panel__title">
            <i><Icon :icon="$gm('clock')" :size="13" /></i>
            任务列表
            <span class="gm-panel__extra" style="margin-left: 8px">共 {{ data.tasks.length }} 个</span>
          </div>
        </div>

        <GEmpty
          v-if="!booting && !data.tasks.length"
          title="还没有定时任务"
          desc="比如「每天早上 8 点在群里发一条 #签到」——点右上角新建一个"
          height="260px"
        >
          <Button type="primary" size="small" @click="openCreate">新建第一个任务</Button>
        </GEmpty>

        <Table
          v-else
          row-key="id"
          size="middle"
          :columns="columns as any"
          :data-source="data.tasks"
          :loading="loading && !data.tasks.length"
          :pagination="false"
          :scroll="{ x: 980 }"
        >
          <template #bodyCell="{ column, record }">
            <!-- 任务名 -->
            <template v-if="column.key === 'name'">
              <div class="sk-cell">
                <span class="sk-cell__name">
                  {{ record.name }}
                  <Tag v-if="!record.enabled" color="default" class="sk-tag-off">已停用</Tag>
                </span>
                <span class="sk-cell__sub">{{ record.cronDesc || '表达式有问题' }}</span>
              </div>
            </template>
            <!-- 计划 -->
            <template v-else-if="column.key === 'plan'">
              <div class="sk-cell">
                <span class="sk-cell__mono" :class="{ 'is-error': record.cronError }">
                  {{ record.cronError ? record.cronError : record.cron }}
                </span>
                <span v-if="record.cronError" class="sk-cell__sub is-error">表达式不合法，任务不会执行</span>
                <span v-else class="sk-cell__sub">
                  下次 {{ record.nextRunAt ? fmtDateTime(record.nextRunAt) : '60 天内不会触发' }}
                </span>
              </div>
            </template>
            <!-- 目标 -->
            <template v-else-if="column.key === 'target'">
              <div class="sk-cell">
                <span class="sk-cell__name">
                  <Tag :color="record.kind === 'group' ? 'blue' : 'purple'" class="sk-tag">
                    {{ record.kind === 'group' ? '群' : '私聊' }}
                  </Tag>
                  {{ record.target_name || record.target_id }}
                </span>
                <span class="sk-cell__sub">{{ record.target_id }}</span>
              </div>
            </template>
            <!-- 指令 -->
            <template v-else-if="column.key === 'cmd'">
              <span class="sk-cmd" :title="record.cmd">{{ record.cmd }}</span>
            </template>
            <!-- 最近执行 -->
            <template v-else-if="column.key === 'last'">
              <div class="sk-cell">
                <span class="sk-cell__name">
                  <i v-if="record.last_status" class="sk-dot" :class="record.last_status === 'ok' ? 'is-ok' : 'is-fail'" />
                  {{ record.last_status === 'ok' ? '成功' : record.last_status === 'fail' ? '失败' : '—' }}
                  <span v-if="record.last_run_at" class="sk-cell__time">{{ fmtTimeShort(record.last_run_at) }}</span>
                </span>
                <span v-if="record.last_msg" class="sk-cell__sub sk-ellipsis" :title="record.last_msg">
                  {{ record.last_msg }}
                </span>
              </div>
            </template>
            <!-- 操作 -->
            <template v-else-if="column.key === 'action'">
              <div class="sk-ops">
                <Button size="small" type="primary" ghost :loading="runningId === record.id" @click="runNow(record)">
                  立即执行
                </Button>
                <Button size="small" @click="openEdit(record)">编辑</Button>
                <Button size="small" @click="toggleTask(record)">
                  {{ record.enabled ? '停用' : '启用' }}
                </Button>
                <Button size="small" danger @click="askDelete(record)">删除</Button>
              </div>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- ============================ 新建 / 编辑 ============================ -->
    <GModal
      v-model:visible="editor.open"
      :title="editor.id ? '编辑任务' : '新建任务'"
      :subtitle="editor.id ? `任务 #${editor.id}` : '到点后自动执行一次指令'"
      eyebrow="SCHEDULER TASK"
      size="md"
      footer-hint="保存后即刻生效，无需重启"
    >
      <div class="sk-form">
        <div class="sk-field">
          <label class="sk-field__label">任务名称</label>
          <GInput v-model="editor.name" size="md" width="100%" placeholder="例如：每天早上群签到提醒" :maxlength="40" />
        </div>

        <div class="sk-field">
          <label class="sk-field__label">触发计划（cron · 分 时 日 月 周）</label>
          <div class="sk-cron">
            <GInput v-model="editor.cron" size="md" width="200px" placeholder="0 8 * * *" class="sk-cron__input" />
            <GSelect
              :model-value="editor.cronPreset"
              :options="cronPresets"
              size="md"
              width="150px"
              placeholder="常用模板"
              :clearable="true"
              @change="applyPreset"
            />
          </div>
          <div v-if="editor.cronDesc" class="sk-field__hint">{{ editor.cronDesc }}</div>
          <div v-if="editor.cronError" class="sk-field__hint is-error">{{ editor.cronError }}</div>
          <div v-if="editor.previewNext.length" class="sk-next">
            <span class="sk-next__label">接下来触发</span>
            <span v-for="(t, i) in editor.previewNext" :key="i" class="sk-next__item">{{ fmtDateTime(t) }}</span>
          </div>
        </div>

        <div class="sk-field">
          <label class="sk-field__label">执行目标</label>
          <GSegmented
            v-model="editor.kind"
            :options="[
              { value: 'group', label: '群聊' },
              { value: 'private', label: '私聊' },
            ]"
            size="sm"
            label="执行目标类型"
          />
          <div class="sk-target">
            <GSelect
              v-if="editor.kind === 'group'"
              :model-value="editor.targetId"
              :options="groupOptions"
              size="md"
              width="100%"
              searchable
              placeholder="选择群"
              :clearable="false"
              @change="(v: any) => pickGroup(v)"
            />
            <GInput
              v-else
              v-model="editor.targetId"
              size="md"
              width="100%"
              placeholder="好友 QQ 号"
            />
          </div>
          <div v-if="editor.targetName" class="sk-field__hint">{{ editor.targetName }}</div>
        </div>

        <div class="sk-field">
          <label class="sk-field__label">要执行的指令</label>
          <GInput v-model="editor.cmd" size="md" width="100%" placeholder="#签到" :maxlength="500" />
          <div class="sk-field__hint">和你在聊天里发一样的写法，以 # 开头；危险指令（重启 / 更新类）也能排期，但请想清楚再填</div>
        </div>

        <div class="sk-switches">
          <label class="sk-switch">
            <GSwitch v-model="editor.deliver" size="sm" />
            <span>把指令的回复发到群里<small>关掉就是「静默执行」，只记录结果</small></span>
          </label>
          <label class="sk-switch">
            <GSwitch v-model="editor.enabled" size="sm" />
            <span>启用任务<small>停用后保留配置，不再触发</small></span>
          </label>
        </div>
      </div>

      <template #footer>
        <Button @click="editor.open = false">取消</Button>
        <Button type="primary" :loading="editor.saving" @click="saveTask">保存</Button>
      </template>
    </GModal>

    <!-- 删除确认 -->
    <GConfirmModal
      v-model:visible="deleter.open"
      title="删除定时任务"
      :content="deleter.task ? `「${deleter.task.name}」将被删除，历史执行统计一并清空，不可恢复。` : ''"
      danger
      ok-text="删除"
      :loading="deleter.doing"
      @ok="doDelete"
    />
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref, watch } from 'vue';
  import { Button, Table, Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import { gm } from '/@/design/gmIcons';
  import { fmtDateTime, fmtTimeShort } from '/@/utils/localTime';
  import { kpiPalette } from '../_shared/stats';
  import GEmpty from '../_shared/GEmpty.vue';
  import GInput from '../_shared/form/GInput.vue';
  import GSelect from '../_shared/form/GSelect.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GSwitch from '../_shared/form/GSwitch.vue';
  import GModal from '../_shared/dialog/GModal.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import { cronApi, type CronList, type CronTask } from './api';

  defineOptions({ name: 'Scheduler' });

  /**
   * 定时任务中心
   *
   * 表格只做展示与操作，表达式的正确性交给后端校验（保存时拒绝 + 行内标红）。
   */

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const booting = ref(true);
  const loading = ref(false);
  const runningId = ref(0);

  const data = reactive<CronList>({ tasks: [], running: 0, lastTickAt: null, enabledCount: 0, failCount: 0 });
  const groups = ref<{ id: string; name: string }[]>([]);

  const columns = [
    { title: '任务', key: 'name', width: 200 },
    { title: '计划', key: 'plan', width: 200 },
    { title: '目标', key: 'target', width: 190 },
    { title: '指令', key: 'cmd', ellipsis: true },
    { title: '最近执行', key: 'last', width: 190 },
    { title: '操作', key: 'action', width: 250, align: 'center' as const },
  ];

  const cards = computed(() => {
    const p = kpiPalette(isDark.value);
    return [
      {
        key: 'total',
        label: '任务总数',
        icon: gm('clock'),
        value: data.tasks.length || '—',
        unit: data.tasks.length ? '个' : '',
        foot: `启用 ${data.enabledCount} / 停用 ${data.tasks.length - data.enabledCount}`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'enabled',
        label: '启用中',
        icon: gm('success'),
        value: data.enabledCount || '—',
        unit: data.enabledCount ? '个' : '',
        foot: data.running ? `${data.running} 个正在执行` : '调度器每 20 秒巡检一次',
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'fail',
        label: '最近失败',
        icon: gm('warning'),
        value: data.failCount || '—',
        unit: data.failCount ? '个' : '',
        foot: data.failCount ? '点开「最近执行」看原因' : '暂无失败记录',
        color: data.failCount ? p.rose[0] : p.cyan[0],
        color2: data.failCount ? p.rose[1] : p.cyan[1],
      },
      {
        key: 'tick',
        label: '上次调度',
        icon: gm('pulse'),
        value: data.lastTickAt ? fmtTimeShort(data.lastTickAt) : '—',
        unit: '',
        foot: '巡检到点的任务并逐个执行',
        color: p.violet[0],
        color2: p.violet[1],
      },
    ];
  });

  /* ------------------------------ 数据加载 ------------------------------ */

  async function reload() {
    loading.value = true;
    try {
      const res = await cronApi.getTasks();
      Object.assign(data, res);
    } finally {
      loading.value = false;
    }
  }

  async function loadTargets() {
    try {
      const res = await cronApi.getTargets();
      groups.value = (res.groups || []).map((g) => ({ id: g.id, name: g.name || g.id }));
    } catch {
      groups.value = [];
    }
  }

  onMounted(async () => {
    try {
      await Promise.all([reload(), loadTargets()]);
    } finally {
      booting.value = false;
    }
  });

  /* ------------------------------ 表单 ------------------------------ */

  const cronPresets = [
    { label: '每天 08:00', value: '0 8 * * *' },
    { label: '每天 00:05', value: '5 0 * * *' },
    { label: '每小时整点', value: '0 * * * *' },
    { label: '每 30 分钟', value: '*/30 * * * *' },
    { label: '工作日 09:00', value: '0 9 * * 1-5' },
    { label: '每周一 10:00', value: '0 10 * * 1' },
  ];

  const editor = reactive({
    open: false,
    saving: false,
    id: 0,
    name: '',
    cron: '',
    cronPreset: '',
    cronDesc: '',
    cronError: '',
    previewNext: [] as string[],
    kind: 'group' as 'group' | 'private',
    targetId: '',
    targetName: '',
    cmd: '',
    deliver: true,
    enabled: true,
  });

  const groupOptions = computed(() => {
    const list = groups.value.map((g) => ({ label: g.name ? `${g.name}（${g.id}）` : g.id, value: g.id }));
    // 编辑旧任务时，目标可能不在当前群列表里（已退群等），补一项避免显示成裸 ID
    if (editor.kind === 'group' && editor.targetId && !list.some((o) => o.value === editor.targetId)) {
      list.unshift({ label: `${editor.targetName || editor.targetId}（当前配置）`, value: editor.targetId });
    }
    return list;
  });

  function pickGroup(v: any) {
    editor.targetId = v == null ? '' : String(v);
    const hit = groups.value.find((g) => g.id === editor.targetId);
    editor.targetName = hit?.name || '';
  }

  function openCreate() {
    Object.assign(editor, {
      open: true,
      id: 0,
      name: '',
      cron: '0 8 * * *',
      cronPreset: '0 8 * * *',
      cronDesc: '',
      cronError: '',
      previewNext: [],
      kind: 'group',
      targetId: '',
      targetName: '',
      cmd: '',
      deliver: true,
      enabled: true,
    });
    refreshCron();
  }

  function openEdit(t: CronTask) {
    Object.assign(editor, {
      open: true,
      id: t.id,
      name: t.name,
      cron: t.cron,
      cronPreset: cronPresets.some((p) => p.value === t.cron) ? t.cron : '',
      cronDesc: t.cronDesc || '',
      cronError: t.cronError || '',
      previewNext: t.nextRunAt ? [t.nextRunAt] : [],
      kind: t.kind,
      targetId: t.target_id,
      targetName: t.target_name || '',
      cmd: t.cmd,
      deliver: !!t.deliver,
      enabled: !!t.enabled,
    });
    refreshCron();
  }

  function applyPreset(v: any) {
    if (!v) return;
    editor.cron = String(v);
    refreshCron();
  }

  let cronTimer: ReturnType<typeof setTimeout> | null = null;

  /** cron 变了就问后端要描述与未来触发时间（300ms 防抖） */
  function refreshCron() {
    if (cronTimer) clearTimeout(cronTimer);
    cronTimer = setTimeout(async () => {
      const expr = editor.cron.trim();
      if (!expr) {
        editor.cronDesc = '';
        editor.cronError = '';
        editor.previewNext = [];
        return;
      }
      try {
        const res = await cronApi.preview(expr);
        editor.cronDesc = res.desc;
        editor.cronError = '';
        editor.previewNext = res.next || [];
      } catch (e: any) {
        editor.cronDesc = '';
        editor.cronError = String(e?.message || e || '表达式不合法').replace(/^.*错误信息?:?/, '');
        editor.previewNext = [];
      }
    }, 300);
  }

  async function saveTask() {
    if (!editor.name.trim()) return void message.warning('先给任务起个名字');
    if (!editor.cmd.trim()) return void message.warning('要执行的指令不能为空');
    if (!editor.targetId.trim()) return void message.warning(editor.kind === 'group' ? '请选择群' : '请填写 QQ 号');
    editor.saving = true;
    try {
      await cronApi.save({
        id: editor.id || undefined,
        name: editor.name.trim(),
        cron: editor.cron.trim(),
        kind: editor.kind,
        targetId: editor.targetId.trim(),
        targetName: editor.targetName,
        cmd: editor.cmd.trim(),
        deliver: editor.deliver,
        enabled: editor.enabled,
        confirm: true,
      });
      message.success(editor.id ? '任务已更新' : '任务已创建');
      editor.open = false;
      await reload();
    } catch {
      // 请求层会弹统一错误提示，这里不再重复
    } finally {
      editor.saving = false;
    }
  }

  /* ------------------------------ 行操作 ------------------------------ */

  async function toggleTask(t: CronTask) {
    try {
      await cronApi.toggle(t.id, !t.enabled);
      message.success(t.enabled ? '已停用' : '已启用');
      await reload();
    } catch {}
  }

  const deleter = reactive({ open: false, doing: false, task: null as CronTask | null });

  function askDelete(t: CronTask) {
    deleter.task = t;
    deleter.open = true;
  }

  async function doDelete() {
    if (!deleter.task) return;
    deleter.doing = true;
    try {
      await cronApi.remove(deleter.task.id);
      message.success('已删除');
      deleter.open = false;
      await reload();
    } catch {
    } finally {
      deleter.doing = false;
    }
  }

  async function runNow(t: CronTask) {
    runningId.value = t.id;
    try {
      const res = await cronApi.run(t.id);
      if (res.ok) {
        const reply = res.message ? `：${res.message.slice(0, 80)}` : '（无回复）';
        message.success(`已执行${reply}`, 4);
      } else {
        message.error(`执行失败：${res.message}`, 5);
      }
      await reload();
    } catch {
    } finally {
      runningId.value = 0;
    }
  }

  // cron 输入联动
  watch(
    () => editor.cron,
    () => refreshCron(),
  );
</script>

<style lang="less" scoped>
  .sk-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .sk-cell__name {
    display: flex;
    gap: 6px;
    align-items: center;
    overflow: hidden;
    font-size: 13px;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sk-cell__sub {
    overflow: hidden;
    font-size: 11.5px;
    color: var(--g-text-mute);
    text-overflow: ellipsis;
    white-space: nowrap;

    &.is-error {
      color: #e0664a;
    }
  }

  .sk-cell__mono {
    font-family: var(--g-mono, ui-monospace, monospace);
    font-size: 12px;
    color: var(--g-text-sub);

    &.is-error {
      color: #e0664a;
    }
  }

  .sk-cell__time {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .sk-tag {
    margin-right: 0;
  }

  .sk-tag-off {
    margin-right: 0;
    font-size: 11px;
    line-height: 16px;
  }

  .sk-cmd {
    display: inline-block;
    max-width: 100%;
    overflow: hidden;
    font-family: var(--g-mono, ui-monospace, monospace);
    font-size: 12px;
    color: var(--g-text-sub);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sk-dot {
    display: inline-block;
    width: 7px;
    height: 7px;
    margin-right: 5px;
    border-radius: 50%;

    &.is-ok {
      background: #4fbf8b;
    }

    &.is-fail {
      background: #e0664a;
    }
  }

  .sk-ops {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    justify-content: center;
  }

  .sk-ellipsis {
    max-width: 180px;
  }

  /* ---- 表单 ---- */
  .sk-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .sk-field__label {
    display: block;
    margin-bottom: 6px;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text-sub);
  }

  .sk-field__hint {
    margin-top: 5px;
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--g-text-mute);

    &.is-error {
      color: #e0664a;
    }
  }

  .sk-cron {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .sk-cron__input {
    font-family: var(--g-mono, ui-monospace, monospace);
  }

  .sk-target {
    margin-top: 8px;
  }

  .sk-next {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-top: 8px;
  }

  .sk-next__label {
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  .sk-next__item {
    padding: 2px 8px;
    font-size: 11.5px;
    font-variant-numeric: tabular-nums;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border-radius: 8px;
  }

  .sk-switches {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 12px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .sk-switch {
    display: flex;
    gap: 10px;
    align-items: center;
    cursor: pointer;

    span {
      display: flex;
      flex-direction: column;
      font-size: 12.5px;
      color: var(--g-text-sub);

      small {
        font-size: 11px;
        color: var(--g-text-mute);
      }
    }
  }

  @media (max-width: 900px) {
    .sk-ops {
      justify-content: flex-start;
    }

    .sk-cron {
      flex-wrap: wrap;
    }
  }
</style>
