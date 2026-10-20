<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- 页头 -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">GAME ACCOUNTS</div>
          <div class="db-hero__title">游戏账号</div>
          <div class="db-hero__desc">
            米游社 6 款游戏的 CK / Stoken 与 UID 绑定，含鸣潮（库街区）账号
          </div>
        </div>
        <div class="db-hero__side">
          <Button @click="openBin">删除记录</Button>
          <Button :loading="loading" @click="loadAll">刷新数据</Button>
        </div>
      </section>

      <div class="ac-body">
        <!-- 左侧游戏导航 -->
        <aside class="g-card ac-nav">
          <div class="ac-nav__title">游戏</div>
          <button
            v-for="g in games"
            :key="g.key"
            class="ac-nav__item"
            :class="{ 'is-active': activeGame === g.key }"
            :style="{ '--g1': g.from, '--g2': g.to }"
            @click="switchGame(g.key)"
          >
            <GameIcon :game="g.key" :size="22" />
            <span class="ac-nav__name">{{ g.name }}</span>
            <span class="ac-nav__count">{{ g.uidCount }}</span>
          </button>
          <div class="ac-nav__foot">
            米游社数据来自 Bot 主库，Stoken 只读自 Lotus 档案；鸣潮走库街区 token。
          </div>
        </aside>

        <!-- 右侧内容 -->
        <div class="ac-main">
          <!-- 当前游戏指标 -->
          <section class="ac-hero">
            <div class="ac-hero__title">
              <GameIcon :game="activeGame" :size="26" />
              <div>
                <div class="ac-hero__name">{{ meta.name }}</div>
                <div class="ac-hero__en">{{ meta.en }}</div>
              </div>
            </div>

            <div class="ac-hero__cards">
              <div class="ac-metric">
                <div class="ac-metric__label">绑定 UID</div>
                <div class="ac-metric__value">{{ fmtNum(hero.uidCount) }}</div>
                <div class="ac-metric__foot">{{ hero.accountCount }} 个账号</div>
              </div>
              <div class="ac-metric">
                <div class="ac-metric__label">{{ isMys ? 'CK 已存' : '有效令牌' }}</div>
                <div class="ac-metric__value">{{ fmtNum(hero.ckSaved) }}</div>
                <div class="ac-metric__foot">
                  覆盖 {{ pctOf(hero.ckSaved, hero.accountCount) }}% 账号
                </div>
              </div>
              <div class="ac-metric" :class="{ 'is-na': !hero.skSupported }">
                <div class="ac-metric__label">SK 已存</div>
                <div class="ac-metric__value">{{ hero.skSupported ? fmtNum(hero.skSaved) : '—' }}</div>
                <div class="ac-metric__foot">
                  {{ hero.skSupported ? `覆盖 ${pctOf(hero.skSaved, hero.accountCount)}% 账号` : '该游戏无 Stoken 体系' }}
                </div>
              </div>
            </div>
          </section>

          <div class="g-card">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon :icon="$gm('idcard')" :size="13" /></i>
                {{ meta.name }}账号
                <span class="gm-panel__extra" style="margin-left: 8px">
                  共 {{ total }} 个账号 · {{ uidRows.length }} 个 UID
                </span>
              </div>
              <div class="toolbar">
                <GSearch
                  v-model="keyword"
                  width="220px"
                  :placeholder="isMys ? '搜索 ltuid / 绑定标识 / UID' : '搜索 QQ / 角色名 / UID'"
                  @search="loadAccounts()"
                />
                <Button type="primary" @click="loadAccounts()">查询</Button>
                <Button :disabled="!list.length" @click="exportCsv">导出 CSV</Button>
              </div>
            </div>

            <GSegmented
              class="ac-seg"
              :model-value="tab"
              :options="tabList.map((t) => ({ value: t.key, label: t.name }))"
              label="账号视图"
              @update:model-value="switchTab($event as any)"
            />

            <!-- UID 绑定 -->
            <template v-if="tab === 'uids'">
              <div v-if="loading" class="ac-skeletons">
                <div v-for="i in 5" :key="i" class="g-skeleton ac-skeleton" />
              </div>
              <GEmpty
                v-else-if="!list.length"
                :title="keyword ? '没有匹配的账号' : '该游戏暂无账号'"
                :desc="keyword ? '换个关键词试试' : '账号在聊天中绑定后会出现在这里'"
              />
              <!-- 每个游戏 UID 单独一行：绑了几个号就显示几行 -->
              <div v-else class="ac-list">
                <div v-for="r in uidRows" :key="r.__key" class="ac-uidrow">
                  <span class="ac-row__avatar" :style="avatarStyle(r)">
                    {{ (r.nickname || r.bindNames?.[0] || String(r.ltuid ?? r.qq) || '?').slice(0, 1) }}
                  </span>

                  <div class="ac-uidrow__main">
                    <div class="ac-uidrow__name">
                      <span class="ac-uidrow__nick">{{ r.nickname || '未获取昵称' }}</span>
                      <span class="mono ac-uidrow__uid">{{ r.uid || '—' }}</span>
                      <span v-if="r.level" class="ac-uidrow__lv">Lv.{{ r.level }}</span>
                    </div>
                    <div class="ac-uidrow__meta">
                      <span class="mono">{{ r.ltuid ? `ltuid ${r.ltuid}` : `QQ ${r.qq}` }}</span>
                      <span v-if="r.server" class="ac-uidrow__dot">区服 {{ r.server }}</span>
                      <span v-if="r.kuroUid" class="ac-uidrow__dot mono">库街区 {{ r.kuroUid }}</span>
                      <span class="ac-uidrow__binds">
                        <span v-if="!r.bindIds.length" class="muted">未绑定 Bot 用户</span>
                        <span
                          v-for="(id, i) in r.bindIds.slice(0, 3)"
                          :key="id"
                          class="bind-chip"
                          :title="id"
                        >
                          {{ r.bindNames?.[i] || maskId(id) }}
                        </span>
                        <span v-if="r.bindIds.length > 3" class="bind-more">
                          +{{ r.bindIds.length - 3 }}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div class="ac-uidrow__tags">
                    <span class="ac-tag" :class="r.hasCk ? 'is-on' : 'is-off'">
                      {{ isMys ? 'CK' : '令牌' }}
                    </span>
                    <span v-if="isMys" class="ac-tag" :class="r.hasSk ? 'is-on' : 'is-off'">SK</span>
                    <span v-if="r.ckStatus === 'expired'" class="ac-tag is-off">已失效</span>
                  </div>

                  <div class="ac-uidrow__acts">
                    <Button
                      v-if="isMys && r.uid"
                      size="small"
                      danger
                      :loading="unbinding === `${r.ltuid}:${r.uid}`"
                      @click="askUnbind(r, r)"
                    >
                      解绑
                    </Button>
                    <Button v-if="isMys" size="small" :loading="verifying === r.ltuid" @click="verifyOne(r)">
                      校验
                    </Button>
                    <Button v-if="isMys" size="small" danger @click="askDelete(r)">删除</Button>
                  </div>

                  <div v-if="isMys" class="ac-uidrow__foot">
                    <span class="mono fs-12">CK {{ r.ckMask || '未保存' }}</span>
                    <span v-if="r.checkedAt" class="muted">最后校验 {{ r.checkedAt }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Cookie 状态 -->
            <template v-else-if="tab === 'ck'">
              <GEmpty
                v-if="!list.length"
                title="暂无账号"
                desc="该游戏下还没有可展示的 CK 状态"
              />
              <Table
                v-else
                row-key="id"
                size="small"
                :columns="ckColumns"
                :data-source="list"
                :pagination="{ pageSize: 10, size: 'small' }"
                :scroll="{ x: 760 }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'ltuid'">
                    <span class="mono fs-12">{{ record.ltuid ? record.ltuid : `QQ ${record.qq}` }}</span>
                  </template>
                  <template v-else-if="column.key === 'bindNames'">
                    <span v-if="record.bindNames?.length" class="fs-12">{{ record.bindNames.join('、') }}</span>
                    <span v-else class="muted">未绑定</span>
                  </template>
                  <template v-else-if="column.key === 'ckMask'">
                    <span class="mono fs-12">{{ record.ckMask || (record.hasCk ? '（鸣潮令牌已保存）' : '未保存') }}</span>
                  </template>
                  <template v-else-if="column.key === 'ckStatus'">
                    <Tag :color="statusOf(record.ckStatus).color">{{ statusOf(record.ckStatus).text }}</Tag>
                  </template>
                  <template v-else-if="column.key === 'hasSk'">
                    <Tag v-if="record.hasSk" color="blue">已存</Tag>
                    <span v-else class="muted">未存</span>
                  </template>
                  <template v-else-if="column.key === 'action'">
                    <Button
                      v-if="isMys && record.ltuid"
                      type="link"
                      size="small"
                      :loading="verifying === record.ltuid"
                      @click="verifyOne(record)"
                    >
                      校验
                    </Button>
                    <span v-else class="muted">—</span>
                  </template>
                </template>
              </Table>
            </template>

            <!-- Stoken 状态 -->
            <template v-else>
              <GEmpty
                v-if="!isMys"
                title="该游戏无 Stoken 体系"
                desc="鸣潮使用库街区 token，不走米游社 Stoken"
              />
              <div v-else-if="skLoading" class="ac-skeletons">
                <div v-for="i in 4" :key="i" class="g-skeleton ac-skeleton" />
              </div>
              <Table
                v-else
                row-key="ltuid"
                size="small"
                :columns="skColumns"
                :data-source="skList"
                :pagination="{ pageSize: 10, size: 'small' }"
                :scroll="{ x: 700 }"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'hasStoken'">
                    <Tag :color="record.hasStoken ? 'green' : 'default'">
                      {{ record.hasStoken ? '已存' : '未存' }}
                    </Tag>
                  </template>
                  <template v-else-if="column.key === 'source'">
                    <span :class="record.source ? 'fs-12' : 'muted'">{{ record.source || '—' }}</span>
                  </template>
                  <template v-else-if="column.key === 'hasLtoken'">
                    <span :class="record.hasLtoken ? 'fs-12' : 'muted'">{{ record.hasLtoken ? '是' : '否' }}</span>
                  </template>
                </template>
              </Table>
              <div v-if="isMys" class="ac-sk-tip">
                Stoken 来自 Lotus-Plugin 的用户档案（只读）· 已存 {{ skReport.saved }} / {{ skReport.total }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <GConfirmModal
      v-model:visible="deleteModal.visible"
      title="删除账号"
      :content="deleteModal.content"
      hint="删除前会自动备份到后台库，可在「删除记录」里恢复；Bot 侧绑定关系也会同步清理。"
      danger
      :loading="deleteModal.loading"
      ok-text="确认删除"
      @ok="submitDelete"
    />

    <!-- 解绑 UID 确认 -->
    <GConfirmModal
      v-model:visible="unbindModal.visible"
      title="解绑 UID"
      :content="unbindModal.content"
      hint="只移除该账号在该游戏下的这条 UID 记录，不会影响 CK 与其他游戏。"
      danger
      :loading="unbindModal.loading"
      ok-text="确认解绑"
      @ok="submitUnbind"
    />

    <!-- 删除记录 / 恢复 -->
    <GModal v-model:visible="binDrawer.visible" eyebrow="DELETED ACCOUNTS" title="删除记录（可恢复）" subtitle="最近 100 条，删除前自动备份" size="lg" body-height="58vh">
      <div class="bin-tip">删除账号前会把整行备份到后台库；这里是最近 100 条记录。</div>
      <Table
        row-key="id"
        size="small"
        :columns="binColumns"
        :data-source="binList"
        :loading="binDrawer.loading"
        :pagination="{ pageSize: 10, size: 'small' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" :loading="binDrawer.restoring" @click="doRestore(record)">恢复</Button>
          </template>
        </template>
      </Table>
      <template #footer>
        <Button @click="binDrawer.visible = false">关闭</Button>
      </template>
    </GModal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import { Button, Table, Tag, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import { downloadCsv } from '/@/utils/export/csv';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GModal from '../_shared/dialog/GModal.vue';
  import GEmpty from '../_shared/GEmpty.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import GameIcon from '../_shared/GameIcon.vue';
  import { fmtNum } from '../_shared/stats';
  import type { CkStatus, VerifyResult } from './api';
  import { adminApi } from './api';
  import { STATUS_MAP } from './data';
  import type { GameAccount, GameOverviewItem, GameUid, StokenReport } from './gameApi';
  import { gameApi } from './gameApi';

  defineOptions({ name: 'Account' });

  const route = useRoute();

  const loading = ref(false);
  const skLoading = ref(false);
  const verifying = ref<number | null>(null);
  const unbinding = ref('');

  const games = ref<GameOverviewItem[]>([]);
  const activeGame = ref(String(route.query?.game || 'gs'));

  const list = ref<GameAccount[]>([]);
  const total = ref(0);
  const hero = ref({
    uidCount: 0,
    ckSaved: 0,
    skSaved: 0,
    skSupported: true,
    accountCount: 0,
  });
  const meta = ref<{ name: string; en: string }>({ name: '原神', en: 'GENSHIN IMPACT' });
  const keyword = ref('');

  const tab = ref<'uids' | 'ck' | 'sk'>('uids');
  const tabList = [
    { key: 'uids', name: 'UID 绑定' },
    { key: 'ck', name: 'Cookie 状态' },
    { key: 'sk', name: 'Stoken 状态' },
  ] as const;

  const isMys = computed(() => activeGame.value !== 'waves');

  const opened = ref<Set<string>>(new Set());

  /**
   * 把一个米游社账号下的多个游戏 UID 摊平成独立行 —— 绑几个号就显示几行，
   * 避免「2 UID」这种合并展示让人以为只有一条记录。
   * 没有任何 UID 的账号单独出一行占位，免得账号在列表里凭空消失。
   */
  const uidRows = computed(() => {
    const rows: any[] = [];
    for (const a of list.value) {
      const uids = Array.isArray(a.uids) ? a.uids : [];
      if (!uids.length) {
        rows.push({ ...a, uid: '', nickname: '', level: '', server: '', kuroUid: '', __key: `${a.id}#none` });
        continue;
      }
      for (const u of uids) {
        rows.push({
          ...a,
          uid: u.uid,
          nickname: u.nickname || '',
          level: u.level || '',
          server: u.server || '',
          kuroUid: u.kuroUid || '',
          __key: `${a.id}#${u.uid}`,
        });
      }
    }
    return rows;
  });

  /** 鸣潮不适用米游社统计口径 */
  function pctOf(v: number, t: number) {
    if (!t) return 0;
    return Math.round((v / t) * 100);
  }

  function statusOf(s: CkStatus | string) {
    return STATUS_MAP[String(s || 'unknown') as CkStatus] ?? STATUS_MAP.unknown;
  }

  function maskId(id: string) {
    const s = String(id || '');
    if (s.length <= 10) return s;
    return `${s.slice(0, 8)}****${s.slice(-2)}`;
  }

  const AVATAR_TONES: [string, string][] = [
    ['#6E9BFF', '#3F6FD8'],
    ['#9B8BF0', '#6C5CD6'],
    ['#57C795', '#329C6C'],
    ['#F0A46B', '#D07A3C'],
    ['#EC7FA9', '#C95B87'],
    ['#4FC0DE', '#2E93B4'],
  ];

  function avatarStyle(a: GameAccount) {
    const s = String(a.ltuid ?? a.qq ?? '');
    let h = 0;
    for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    const [c1, c2] = AVATAR_TONES[h % AVATAR_TONES.length];
    return { background: `linear-gradient(135deg, ${c1}, ${c2})` };
  }

  function toggleRow(id: string) {
    const next = new Set(opened.value);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    opened.value = next;
  }

  /* ------------------------------ 表格列 ------------------------------ */

  const ckColumns = [
    { title: '账号', dataIndex: 'ltuid', key: 'ltuid', width: 130 },
    { title: '绑定用户', key: 'bindNames', width: 200 },
    { title: 'Cookie / 令牌', key: 'ckMask', width: 240 },
    { title: 'CK 状态', key: 'ckStatus', width: 110 },
    { title: 'Stoken', key: 'hasSk', width: 90 },
    { title: '最后校验', dataIndex: 'checkedAt', key: 'checkedAt', width: 170 },
    { title: '操作', key: 'action', width: 90 },
  ];

  const skColumns = [
    { title: 'ltuid', dataIndex: 'ltuid', key: 'ltuid', width: 130 },
    { title: 'Stoken', key: 'hasStoken', width: 100 },
    { title: 'ltoken', key: 'hasLtoken', width: 90 },
    { title: 'stuid', dataIndex: 'stuid', key: 'stuid', width: 160 },
    { title: '来源', key: 'source', width: 140 },
    { title: '绑定 UID 数', dataIndex: 'uids', key: 'uids', width: 110 },
  ];

  const binColumns = [
    { title: '备份 ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'ltuid', dataIndex: 'ltuid', key: 'ltuid', width: 110 },
    { title: '操作人', dataIndex: 'actor', key: 'actor', width: 100 },
    { title: '删除时间', dataIndex: 'deleted_at', key: 'deleted_at' },
    { title: '操作', key: 'action', width: 70 },
  ];

  /* ------------------------------ 数据加载 ------------------------------ */

  const skReport = ref<StokenReport>({ total: 0, saved: 0, list: [] });
  const skList = computed(() => skReport.value.list || []);

  async function loadOverview() {
    try {
      const res = await gameApi.overview();
      games.value = res?.games ?? [];
      const hit = games.value.find((g) => g.key === activeGame.value);
      if (hit) meta.value = { name: hit.name, en: hit.en };
    } catch {
      games.value = [];
    }
  }

  async function loadAccounts(q = keyword.value) {
    loading.value = true;
    try {
      const res = await gameApi.accounts(activeGame.value, q || '');
      list.value = res?.list ?? [];
      total.value = res?.total ?? 0;
      if (res?.hero) hero.value = res.hero;
      if (res?.meta) meta.value = { name: res.meta.name, en: res.meta.en };
      opened.value = new Set(list.value.length ? [list.value[0].id] : []);
    } catch {
      list.value = [];
      total.value = 0;
    } finally {
      loading.value = false;
    }
  }

  async function loadStoken() {
    if (!isMys.value) return;
    skLoading.value = true;
    try {
      skReport.value = await gameApi.stokenReport(activeGame.value);
    } catch {
      skReport.value = { total: 0, saved: 0, list: [] };
    } finally {
      skLoading.value = false;
    }
  }

  function loadAll() {
    loadOverview();
    loadAccounts();
    if (tab.value === 'sk') loadStoken();
  }

  function switchGame(key: string) {
    if (activeGame.value === key) return;
    activeGame.value = key;
    keyword.value = '';
    tab.value = 'uids';
    const hit = games.value.find((g) => g.key === key);
    if (hit) meta.value = { name: hit.name, en: hit.en };
    loadAccounts('');
  }

  /** 段控件切换必须走函数（直接改 tab 会导致首次进入该段数据为空） */
  function switchTab(key: 'uids' | 'ck' | 'sk') {
    tab.value = key;
    if (key === 'sk') loadStoken();
  }

  /* ------------------------------ 校验 / 删除 / 解绑 ------------------------------ */

  async function verifyOne(a: GameAccount) {
    if (!a.ltuid) return;
    verifying.value = a.ltuid;
    try {
      const res: VerifyResult = await adminApi.verifyAccounts([a.ltuid]);
      message.success(`校验完成：有效 ${res.ok} / 失效 ${res.expired}`);
      await Promise.all([loadAccounts(), loadOverview()]);
    } catch {
      message.error('校验失败，请检查后端服务');
    } finally {
      verifying.value = null;
    }
  }

  const deleteModal = reactive({ visible: false, loading: false, ltuid: 0, content: '' });

  function askDelete(a: GameAccount) {
    if (!a.ltuid) return;
    deleteModal.ltuid = a.ltuid;
    deleteModal.content = `确定删除账号 ${a.ltuid} 吗？将从 Bot 主库移除该账号及其 CK、UID 绑定关系。`;
    deleteModal.visible = true;
  }

  async function submitDelete() {
    deleteModal.loading = true;
    try {
      const res = await adminApi.deleteAccounts([deleteModal.ltuid]);
      if (res?.failed?.length) {
        message.warning(`删除完成 ${res.deleted} 个，失败：${res.failed[0].error}`);
      } else {
        message.success(`已删除账号 ${deleteModal.ltuid}，备份已保存`);
      }
      deleteModal.visible = false;
      await Promise.all([loadAccounts(), loadOverview()]);
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    } finally {
      deleteModal.loading = false;
    }
  }

  const unbindModal = reactive({
    visible: false,
    loading: false,
    ltuid: 0,
    uid: '',
    content: '',
  });

  function askUnbind(a: GameAccount, u: GameUid) {
    if (!a.ltuid) return;
    unbindModal.ltuid = a.ltuid;
    unbindModal.uid = u.uid;
    unbindModal.content =
      `确定从账号 ${a.ltuid} 解绑 ${meta.value.name} 的 UID ${u.uid}` +
      `${u.nickname ? `（${u.nickname}）` : ''} 吗？`;
    unbindModal.visible = true;
  }

  async function submitUnbind() {
    unbindModal.loading = true;
    try {
      await adminApi.deleteUid(unbindModal.ltuid, activeGame.value, unbindModal.uid);
      message.success(`已解绑 UID ${unbindModal.uid}`);
      unbindModal.visible = false;
      await Promise.all([loadAccounts(), loadOverview()]);
    } catch (e: any) {
      message.error(e?.message || '解绑失败');
    } finally {
      unbindModal.loading = false;
    }
  }

  /* ------------------------------ 导出 ------------------------------ */

  function exportCsv() {
    downloadCsv(`accounts-${activeGame.value}`, [
      { title: '账号', format: (r: GameAccount) => (r.ltuid ? String(r.ltuid) : `QQ:${r.qq}`) },
      { title: '绑定用户', format: (r: GameAccount) => (r.bindNames?.length ? r.bindNames.join('|') : r.bindIds.join('|')) },
      { title: 'UID 数', key: 'uidCount' },
      { title: 'UID 列表', format: (r: GameAccount) => r.uids.map((u) => `${u.uid}${u.nickname ? `(${u.nickname})` : ''}`).join(' / ') },
      { title: 'CK', format: (r: GameAccount) => (r.hasCk ? '已存' : '未存') },
      { title: 'Stoken', format: (r: GameAccount) => (r.hasSk ? '已存' : '未存') },
      { title: 'CK 状态', key: 'ckStatus' },
      { title: '最后校验', format: (r: GameAccount) => r.checkedAt || '' },
    ], list.value);
  }

  /* ------------------------------ 删除记录 ------------------------------ */

  const binDrawer = reactive({ visible: false, loading: false, restoring: false });
  const binList = ref<any[]>([]);

  async function openBin() {
    binDrawer.visible = true;
    binDrawer.loading = true;
    try {
      const res = await adminApi.getDeleted(100);
      binList.value = (res?.list ?? []).map((x) => ({
        ...x,
        deleted_at: (x.deleted_at || '').replace('T', ' ').slice(0, 19),
      }));
    } catch {
      binList.value = [];
    } finally {
      binDrawer.loading = false;
    }
  }

  async function doRestore(row: any) {
    binDrawer.restoring = true;
    try {
      await adminApi.restoreAccount(row.id);
      message.success(`账号 ${row.ltuid} 已恢复`);
      await openBin();
      await Promise.all([loadAccounts(), loadOverview()]);
    } catch (e: any) {
      message.error(e?.message || '恢复失败');
    } finally {
      binDrawer.restoring = false;
    }
  }

  /** 从用户统计页带 game 参数跳进来时，等 overview 到了再对齐一次 */
  watch(games, (val) => {
    if (!val.length) return;
    const hit = val.find((g) => g.key === activeGame.value);
    if (hit) {
      meta.value = { name: hit.name, en: hit.en };
      return;
    }
    activeGame.value = val[0].key;
    loadAccounts('');
  });

  onMounted(async () => {
    await loadOverview();
    await loadAccounts('');
  });
</script>

<style scoped lang="less">

  .w-220 {
    width: 220px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .fs-12 {
    font-size: 12px;
  }

  .muted {
    font-size: 12px;
    opacity: 0.55;
  }

  /* --------------------------- 布局 --------------------------- */

  .ac-body {
    display: grid;
    gap: 14px;
    grid-template-columns: 208px minmax(0, 1fr);
    align-items: start;
  }

  .ac-nav {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 12px 10px !important;
    position: sticky;
    top: 8px;
  }

  .ac-nav__title {
    padding: 2px 8px 8px;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--g-text-mute);
    letter-spacing: 1px;
  }

  .ac-nav__item {
    display: flex;
    gap: 9px;
    align-items: center;
    width: 100%;
    padding: 8px 9px;
    font-size: 12.5px;
    color: var(--g-text-sub);
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 10px;
    transition: background 0.15s ease, border-color 0.15s ease;

    &:hover {
      background: var(--g-hover);
    }

    &.is-active {
      color: var(--g-text);
      font-weight: 650;
      background: var(--g-card-bg-soft);
      border-color: var(--g-card-border-strong);
      box-shadow: inset 2px 0 0 var(--g1, var(--g-blue));
    }
  }

  .ac-nav__name {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ac-nav__count {
    margin-left: auto;
    padding: 0 6px;
    font-size: 10.5px;
    color: var(--g-text-mute);
    background: var(--g-chip-bg);
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }

  .ac-nav__foot {
    padding: 10px 8px 2px;
    margin-top: 8px;
    font-size: 10.5px;
    line-height: 1.7;
    color: var(--g-text-mute);
    border-top: 1px solid var(--g-card-border);
  }

  .ac-main {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  /* --------------------------- 当前游戏 hero --------------------------- */

  .ac-hero {
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
    padding: 14px 16px;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 14px;
    box-shadow: var(--g-card-shadow);
  }

  .ac-hero__title {
    display: flex;
    gap: 10px;
    align-items: center;
    min-width: 180px;
  }

  .ac-hero__name {
    font-size: 16px;
    font-weight: 700;
    color: var(--g-text);
  }

  .ac-hero__en {
    margin-top: 2px;
    font-size: 10px;
    color: var(--g-text-mute);
    letter-spacing: 0.6px;
  }

  .ac-hero__cards {
    display: grid;
    flex: 1;
    gap: 10px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ac-metric {
    padding: 9px 12px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 11px;

    &.is-na {
      opacity: 0.62;
    }
  }

  .ac-metric__label {
    font-size: 11px;
    color: var(--g-text-mute);
  }

  .ac-metric__value {
    margin: 2px 0;
    font-size: 21px;
    font-weight: 700;
    color: var(--g-text);
    font-variant-numeric: tabular-nums;
  }

  .ac-metric__foot {
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  /* --------------------------- 分段控件 --------------------------- */

  .ac-seg {
    margin: 2px 0 12px;
  }

  /* --------------------------- 手风琴 --------------------------- */

  .ac-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ac-row {
    overflow: hidden;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
    transition: border-color 0.16s ease;

    &.is-open {
      border-color: var(--g-card-border-strong);

      .ac-row__chev {
        transform: rotate(90deg);
      }
    }
  }

  .ac-row__head {
    display: flex;
    gap: 10px;
    align-items: center;
    width: 100%;
    padding: 10px 12px;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: none;
    border-radius: 10px;
    transition: background 0.16s ease;

    &:hover {
      background: var(--g-hover);
    }

    &:focus-visible {
      outline: 2px solid var(--g-blue);
      outline-offset: -2px;
    }
  }

  .ac-row__chev {
    display: inline-flex;
    flex: 0 0 auto;
    color: var(--g-text-mute);
    transition: transform 0.18s ease;
  }

  .ac-row__avatar {
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    border-radius: 9px;
    box-shadow: inset 0 0 0 1px rgb(255 255 255 / 18%);
  }

  .ac-row__id {
    min-width: 0;
    font-size: 12.5px;
    color: var(--g-text);
  }

  .ac-row__binds {
    display: flex;
    gap: 5px;
    align-items: center;
    margin-top: 3px;
    flex-wrap: wrap;
  }

  .bind-chip {
    display: inline-flex;
    align-items: center;
    max-width: 118px;
    padding: 0 6px;
    overflow: hidden;
    font-size: 10.5px;
    color: var(--g-text-sub);
    white-space: nowrap;
    text-overflow: ellipsis;
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .bind-more {
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .ac-row__count {
    margin-left: auto;
    font-size: 11.5px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .ac-tag {
    padding: 0 7px;
    font-size: 10.5px;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 6px;

    &.is-on {
      color: #329C6C;
      border-color: rgb(50 156 108 / 42%);
    }

    &.is-off {
      color: var(--g-text-mute);
      opacity: 0.7;
    }

    &.is-ghost {
      opacity: 0.5;
    }
  }

  .ac-row__body {
    padding: 4px 12px 12px;
    border-top: 1px dashed var(--g-card-border);
  }

  .ac-uid {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 10px;
    margin-top: 8px;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 9px;
  }

  .ac-uid__body {
    min-width: 0;
  }

  .ac-uid :deep(.ant-btn) {
    flex: 0 0 auto;
    margin-left: auto;
  }

  .ac-uid__name {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
  }

  .ac-uid__meta {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    margin-top: 2px;
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  .ac-row__foot {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    padding-top: 10px;
    margin-top: 10px;
    font-size: 11px;
    color: var(--g-text-sub);
    border-top: 1px dashed var(--g-card-border);
  }

  .ac-row__actions {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .ac-skeletons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ac-skeleton {
    height: 52px;
    border-radius: 12px;
  }

  .ac-sk-tip {
    padding: 10px 12px;
    margin-top: 10px;
    font-size: 11.5px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .bin-tip {
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 12.5px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  :deep(.ant-table-thead > tr > th) {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--g-text-mute) !important;
    background: var(--g-card-bg-soft) !important;
    border-bottom: 1px solid var(--g-card-border) !important;

    &::before {
      display: none !important;
    }
  }

  :deep(.ant-table-tbody > tr > td) {
    border-bottom: 1px solid var(--g-card-border);
  }

  :deep(.ant-table-tbody > tr:hover > td) {
    background: var(--g-hover) !important;
  }

  @media (max-width: 1180px) {
    .ac-body {
      grid-template-columns: minmax(0, 1fr);
    }

    .ac-nav {
      position: static;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .ac-nav__item {
      width: auto;
    }

    .ac-nav__foot {
      display: none;
    }
  }

  /* --------------------- UID 平铺行（绑几个号就几行） --------------------- */

  .ac-uidrow {
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto auto;
    gap: 8px 12px;
    align-items: center;
    padding: 10px 12px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
    transition: border-color 0.16s ease;

    &:hover {
      border-color: var(--g-card-border-strong);
    }
  }

  .ac-uidrow__main {
    min-width: 0;
  }

  .ac-uidrow__name {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
  }

  .ac-uidrow__nick {
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ac-uidrow__uid {
    flex: 0 0 auto;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  .ac-uidrow__lv {
    flex: 0 0 auto;
    padding: 0 5px;
    font-size: 10.5px;
    line-height: 16px;
    color: var(--g-text-sub);
    background: var(--g-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 5px;
  }

  .ac-uidrow__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 5px 10px;
    align-items: center;
    margin-top: 3px;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  .ac-uidrow__binds {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
  }

  .ac-uidrow__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
    justify-content: flex-end;
  }

  .ac-uidrow__acts {
    display: flex;
    gap: 6px;
    align-items: center;
  }

  .ac-uidrow__foot {
    display: flex;
    grid-column: 1 / -1;
    flex-wrap: wrap;
    gap: 14px;
    align-items: center;
    padding-top: 7px;
    font-size: 11.5px;
    color: var(--g-text-mute);
    border-top: 1px dashed var(--g-card-border);
  }

  @media (max-width: 1180px) {
    .ac-uidrow {
      grid-template-columns: 28px minmax(0, 1fr);

      .ac-uidrow__tags,
      .ac-uidrow__acts {
        grid-column: 2;
        justify-content: flex-start;
      }
    }
  }
</style>
