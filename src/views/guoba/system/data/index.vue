<template>
  <PageWrapper title="">
    <div class="db g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">DATA CONTROL</div>
          <div class="db-hero__title">数据管理</div>
          <div class="db-hero__desc">
            所有插件的数据都在这里：Redis 键值、插件 data 目录文件，可查可改可删，改前自动备份
            <span v-if="domains.scannedAt" class="db-hero__time">· 扫描于 {{ shortTime(domains.scannedAt) }}</span>
          </div>
        </div>
        <div class="db-hero__side">
          <span class="gm-seg">
            <span
              v-for="t in tabs"
              :key="t.key"
              class="gm-seg__item"
              :class="{ 'is-active': tab === t.key }"
              @click="switchTab(t.key)"
            >
              {{ t.label }}
            </span>
          </span>
          <Button size="small" :loading="loading" @click="loadDomains(true)">重新扫描</Button>
          <Button size="small" @click="openRedisBackups">备份记录</Button>
        </div>
      </section>

      <!-- ============================ 数据域总览 ============================ -->
      <template v-if="tab === 'domains'">
        <section class="db-kpi">
          <template v-if="loading">
            <div v-for="i in 4" :key="i" class="gm-skeleton" style="height: 108px" />
          </template>
          <template v-else>
            <div v-for="c in domainCards" :key="c.key" class="db-kpi__card">
              <div class="db-kpi__icon" :style="{ background: `linear-gradient(135deg, ${c.color}, ${c.color2})` }">
                <Icon :icon="c.icon" :size="19" />
              </div>
              <div class="db-kpi__body">
                <div class="db-kpi__label">{{ c.label }}</div>
                <div class="db-kpi__value">{{ c.value }}<small v-if="c.unit">{{ c.unit }}</small></div>
                <div class="db-kpi__foot">{{ c.foot }}</div>
              </div>
            </div>
          </template>
        </section>

        <div class="g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon icon="ant-design:cluster-outlined" :size="13" /></i>
              游戏数据域
            </div>
            <span class="gm-panel__extra">按游戏归类 · 点命名空间直接进入键列表</span>
          </div>
          <div class="dm-plugins">
            <div v-for="g in domainGames" :key="g.id" class="dm-plugin">
              <div class="dm-plugin__head">
                <span class="dm-plugin__name">
                  <GameIcon :game="g.id" :size="18" />
                  {{ g.name }}
                  <small v-if="g.domainCount" class="g-muted">{{ g.domainCount }} 个数据域</small>
                </span>
                <span class="dm-plugin__count">{{ thousands(g.count) }} 键</span>
              </div>
              <div class="dm-plugin__domains">
                <span
                  v-for="d in g.domains"
                  :key="d.prefix"
                  class="dm-chip"
                  :class="`is-${d.risk}`"
                  :title="`${d.prefix} · ${d.desc}`"
                  @click="openPrefix(d.prefix)"
                >
                  {{ d.label }}
                  <em>{{ thousands(d.count) }}</em>
                  <small>{{ d.plugin }}</small>
                </span>
                <span v-if="!g.domains.length" class="dm-chip is-unknown">该分类下暂无已收录的数据域</span>
              </div>
            </div>
            <div v-if="domains.unknownCount" class="dm-plugin">
              <div class="dm-plugin__head">
                <span class="dm-plugin__name">未收录命名空间</span>
                <span class="dm-plugin__count">{{ thousands(domains.unknownCount) }} 键</span>
              </div>
              <div class="dm-plugin__domains">
                <span v-for="s in domains.unknownSamples" :key="s" class="dm-chip is-unknown mono">{{ s }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ============================ Redis 键 ============================ -->
      <template v-else-if="tab === 'keys'">
        <section class="db-grid db-grid--3-9">
          <div class="g-card dm-side">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon icon="ant-design:tags-outlined" :size="13" /></i>
                命名空间
              </div>
            </div>
            <div class="dm-ns">
              <div class="dm-ns__item" :class="{ 'is-active': !prefix }" @click="openPrefix('')">
                <span>全部键</span>
                <em>{{ thousands(domains.totalKeys) }}</em>
              </div>

              <!-- 一级：游戏分类 → 二级：数据域 → 三级：右侧键列表 -->
              <div
                v-for="g in domainGames"
                :key="g.id"
                class="dm-game"
                :class="{ 'is-open': openGames.has(g.id), 'is-empty': !g.count }"
              >
                <div class="dm-game__head" @click="toggleGame(g.id)">
                  <GameIcon :game="g.id" :size="18" />
                  <span class="dm-game__name">{{ g.name }}</span>
                  <em class="dm-game__count">{{ thousands(g.count || 0) }}</em>
                  <Icon icon="ant-design:right-outlined" :size="11" class="dm-game__arrow" />
                </div>
                <div v-show="openGames.has(g.id)" class="dm-game__body">
                  <div
                    v-for="d in g.domains"
                    :key="d.prefix"
                    class="dm-ns__item"
                    :class="{ 'is-active': prefix === d.prefix }"
                    @click="openPrefix(d.prefix)"
                  >
                    <span class="dm-ns__label">
                      <i :class="`risk-${d.risk}`" />{{ d.label }}
                      <small>{{ d.plugin }}</small>
                    </span>
                    <em>{{ thousands(d.count || 0) }}</em>
                  </div>
                  <div v-if="g.id === 'unknown' && g.samples?.length" class="dm-unknown">
                    <span v-for="s in g.samples" :key="s" class="mono">{{ s }}</span>
                  </div>
                  <div v-if="!g.domainCount" class="dm-game__empty">该分类下暂无数据域</div>
                </div>
              </div>
            </div>
          </div>

          <div class="g-card">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon icon="ant-design:key-outlined" :size="13" /></i>
                {{ activeDomain ? activeDomain.label : '全部键' }}
                <span class="gm-panel__extra" style="margin-left: 8px">
                  {{ thousands(!prefix && keyPage.truncated ? domains.totalKeys : keyPage.total) }} 个
                </span>
              </div>
              <div class="toolbar">
                <Input
                  v-model:value="keyQuery.q"
                  class="w-240"
                  placeholder="搜索键名（支持模糊）"
                  allow-clear
                  @press-enter="searchKeys"
                />
                <Button type="primary" @click="searchKeys">查询</Button>
                <Button danger :disabled="!prefix" @click="openDeletePrefix">清空此前缀</Button>
              </div>
            </div>

            <div v-if="activeDomain" class="dm-note">
              {{ activeDomain.desc }}
              <span class="dm-risk" :class="`is-${activeDomain.risk}`">{{ riskText(activeDomain.risk) }}</span>
            </div>

            <Table
              row-key="key"
              size="middle"
              :columns="keyColumns"
              :data-source="keyPage.list"
              :loading="keyLoading"
              :pagination="keyPagination"
              :scroll="{ x: 720 }"
              @change="handleKeyTableChange"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'key'">
                  <span class="mono dm-key" @click="openKey(record.key)">{{ record.key }}</span>
                </template>
                <template v-else-if="column.key === 'type'">
                  <span class="dm-type" :class="`is-${record.type}`">{{ record.type }}</span>
                </template>
                <template v-else-if="column.key === 'ttl'">
                  <span :class="record.ttl > 0 ? '' : 'g-muted'">{{ ttlText(record.ttl) }}</span>
                </template>
                <template v-else-if="column.key === 'action'">
                  <Button type="link" size="small" @click="openKey(record.key)">查看</Button>
                  <Button type="link" size="small" danger @click="openDeleteKey(record.key)">删除</Button>
                </template>
              </template>
            </Table>
            <div v-if="keyPage.truncated" class="dm-note dm-note--warn">
              匹配键过多，仅展示前 {{ keyPage.total }} 个；建议加前缀或关键字缩小范围。
            </div>
          </div>
        </section>
      </template>

      <!-- ============================ 数据文件 ============================ -->
      <template v-else>
        <section class="db-grid db-grid--3-9">
          <div class="g-card dm-side">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon icon="ant-design:appstore-outlined" :size="13" /></i>
                插件 data 目录
              </div>
            </div>
            <div class="dm-ns">
              <div
                v-for="p in filePlugins"
                :key="p.plugin"
                class="dm-ns__item"
                :class="{ 'is-active': filePlugin === p.plugin }"
                @click="openPlugin(p.plugin)"
              >
                <span class="dm-ns__label">{{ p.plugin }}</span>
                <em>{{ p.files }}</em>
              </div>
              <div v-if="!filePlugins.length" class="dm-empty">没有找到插件的 data 目录</div>
            </div>
          </div>

          <div class="g-card">
            <div class="gm-panel__head">
              <div class="gm-panel__title">
                <i><Icon icon="ant-design:folder-open-outlined" :size="13" /></i>
                {{ filePlugin || '请选择插件' }}
                <span v-if="filePath" class="gm-panel__extra" style="margin-left: 8px">/{{ filePath }}</span>
              </div>
              <div class="toolbar">
                <Button v-if="filePath" @click="upDir">返回上级</Button>
                <Button :loading="fileLoading" @click="refreshFiles">刷新</Button>
              </div>
            </div>

            <Table
              row-key="path"
              size="middle"
              :columns="fileColumns"
              :data-source="fileList"
              :loading="fileLoading"
              :pagination="false"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'name'">
                  <span v-if="record.dir" class="dm-dir" @click="enterDir(record.path)">
                    <Icon icon="ant-design:folder-outlined" :size="14" />
                    {{ record.name }}
                  </span>
                  <span v-else class="dm-file" @click="openFile(record.path)">{{ record.name }}</span>
                </template>
                <template v-else-if="column.key === 'size'">
                  <span v-if="record.dir" class="g-muted">{{ record.childCount ?? 0 }} 项</span>
                  <span v-else>{{ fmtSize(record.size) }}</span>
                </template>
                <template v-else-if="column.key === 'mtime'">{{ (record.mtime || '').replace('T', ' ').slice(0, 19) }}</template>
                <template v-else-if="column.key === 'action'">
                  <Button v-if="!record.dir" type="link" size="small" @click="openFile(record.path)">编辑</Button>
                  <span v-if="!record.dir && record.backupCount" class="g-muted fs-12">备份 {{ record.backupCount }}</span>
                </template>
              </template>
            </Table>
            <div v-if="filePlugin && !fileList.length && !fileLoading" class="dm-empty">该目录下没有可编辑的数据文件</div>
          </div>
        </section>
      </template>
    </div>

    <!-- ============================ Redis 值抽屉 ============================ -->
    <GModal v-model:visible="keyDrawer.visible" eyebrow="REDIS KEY" title="键详情" :subtitle="keyDetail?.key || ''" size="xl" body-height="64vh">
      <template v-if="keyDetail">
        <div class="dm-meta">
          <div class="dm-meta__row">
            <span class="g-muted">键名</span>
            <span class="mono">{{ keyDetail.key }}</span>
          </div>
          <div class="dm-meta__row">
            <span class="g-muted">类型</span>
            <span class="dm-type" :class="`is-${keyDetail.type}`">{{ keyDetail.type }}</span>
            <span class="g-muted" style="margin-left: 12px">大小</span>
            <span>{{ fmtSize(keyDetail.size) }}</span>
            <span class="g-muted" style="margin-left: 12px">TTL</span>
            <span>{{ ttlText(keyDetail.ttl) }}</span>
          </div>
          <div v-if="keyDetail.domain" class="dm-meta__row">
            <span class="g-muted">归属</span>
            <span>{{ keyDetail.domain.plugin }} · {{ keyDetail.domain.label }}</span>
            <span class="dm-risk" :class="`is-${keyDetail.domain.risk}`">{{ riskText(keyDetail.domain.risk) }}</span>
          </div>
        </div>

        <div class="dm-editor">
          <div class="dm-editor__head">
            <span>值{{ keyDetail.type === 'string' ? '' : '（JSON 格式编辑）' }}</span>
            <span class="g-muted">{{ keyDetail.editable ? '可直接修改' : '过大或类型不支持，只读' }}</span>
          </div>
          <Input.TextArea
            v-model:value="keyDrawer.text"
            :rows="14"
            class="dm-editor__area mono"
            :disabled="!keyDetail.editable"
          />
        </div>

      </template>
      <div v-else class="gm-skeleton" style="height: 240px" />

      <template #footer>
        <div v-if="keyDetail" class="dm-actions">
          <div class="dm-actions__left">
            <InputNumber v-model:value="keyDrawer.ttl" :min="-1" style="width: 130px" addon-after="秒" />
            <Button size="small" @click="applyTtl">设置 TTL</Button>
          </div>
          <div class="dm-actions__right">
            <Button danger @click="openDeleteKey(keyDetail.key)">删除键</Button>
            <Button type="primary" :loading="keyDrawer.saving" :disabled="!keyDetail.editable" @click="saveKey">
              保存修改
            </Button>
          </div>
        </div>
      </template>
    </GModal>

    <!-- ============================ 文件编辑抽屉 ============================ -->
    <GModal v-model:visible="fileDrawer.visible" eyebrow="PLUGIN FILE" title="文件预览" :subtitle="fileDrawer.path" size="xl" body-height="64vh">
      <template v-if="fileContent">
        <div class="dm-meta">
          <div class="dm-meta__row">
            <span class="g-muted">插件</span>
            <span>{{ fileContent.plugin }}</span>
            <span class="g-muted" style="margin-left: 12px">大小</span>
            <span>{{ fmtSize(fileContent.size) }}</span>
            <span class="g-muted" style="margin-left: 12px">修改时间</span>
            <span>{{ (fileContent.mtime || '').replace('T', ' ').slice(0, 19) }}</span>
          </div>
        </div>
        <Input.TextArea v-model:value="fileDrawer.text" :rows="20" class="mono dm-editor__area" />
        <div v-if="fileBackups.length" class="dm-backups">
          <div v-for="b in fileBackups.slice(0, 8)" :key="b.name" class="dm-backups__row">
            <span class="mono fs-12">{{ b.name }}</span>
            <span class="g-muted">{{ fmtSize(b.size) }}</span>
            <Button type="link" size="small" @click="restoreFileBackup(b)">恢复</Button>
          </div>
        </div>
      </template>

      <template #footer>
        <div class="dm-actions">
          <div class="dm-actions__left">
            <Button size="small" :loading="fileDrawer.loadingBackups" @click="loadFileBackups">
              备份记录（{{ fileBackups.length }}）
            </Button>
          </div>
          <div class="dm-actions__right">
            <Button :disabled="!fileBackups.length" @click="restoreLatestFile">恢复上一版</Button>
            <Button type="primary" :loading="fileDrawer.saving" @click="saveFile">保存修改</Button>
          </div>
        </div>
      </template>
    </GModal>

    <!-- ============================ 危险确认 ============================ -->
    <GConfirmModal
      v-model:visible="confirm.visible"
      :title="confirm.title"
      :content="confirm.content"
      :hint="confirm.hint"
      danger
      :loading="confirm.loading"
      ok-text="确认执行"
      @ok="runConfirm"
    />

    <GConfirmModal
      v-model:visible="prefixConfirm.visible"
      title="清空整个前缀"
      :content="prefixConfirm.content"
      hint="会逐个备份后删除，误删可在「备份记录」里恢复；执行期间 Redis 会有一定压力"
      danger
      :loading="prefixConfirm.loading"
      ok-text="确认清空"
      @ok="doDeletePrefix"
    />

    <!-- ============================ 备份记录抽屉 ============================ -->
    <GModal v-model:visible="backupDrawer.visible" eyebrow="REDIS BACKUP" title="Redis 备份记录" subtitle="最近 100 条修改/删除前的旧值" size="xl" body-height="62vh">
      <div class="dm-note">每次修改 / 删除 Redis 键前都会备份旧值；这里是最近 100 条。</div>
      <Table
        row-key="id"
        size="small"
        :columns="backupColumns"
        :data-source="backups"
        :loading="backupDrawer.loading"
        :pagination="{ pageSize: 10, size: 'small' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <Button type="link" size="small" @click="doRestoreBackup(record)">恢复</Button>
          </template>
        </template>
      </Table>
      <template #footer>
        <Button @click="backupDrawer.visible = false">关闭</Button>
      </template>
    </GModal>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Input, InputNumber, Table, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GModal from '../_shared/dialog/GModal.vue';
  import { Icon } from '/@/components/Icon';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GameIcon from '../_shared/GameIcon.vue';
  import type { DomainMeta, DomainsResult, FileContent, FileItem, FilePlugin, KeyDetail, KeyPage } from './api';
  import { dataApi } from './api';
  import { kpiPalette, thousands } from '../_shared/stats';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';

  defineOptions({ name: 'DataManage' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

  const tabs = [
    { key: 'domains', label: '数据域总览' },
    { key: 'keys', label: 'Redis 键' },
    { key: 'files', label: '数据文件' },
  ];
  const tab = ref<'domains' | 'keys' | 'files'>('domains');

  const loading = ref(false);
  const domains = ref<DomainsResult>({
    available: false,
    totalKeys: 0,
    unknownCount: 0,
    unknownSamples: [],
    games: [],
    plugins: [],
    domains: [],
  });

  /* 三级导航：一级游戏分组（可折叠）→ 二级数据域 → 三级右侧键列表 */
  const domainGames = computed(() => domains.value.games || []);
  const openGames = reactive(new Set<string>());

  function toggleGame(id: string) {
    if (openGames.has(id)) {
      openGames.delete(id);
    } else {
      openGames.add(id);
    }
  }

  /** 加载完成后：默认展开有数据的前两组；若当前选中域在某个组里，也把它展开 */
  function ensureGamesOpen() {
    if (openGames.size) {
      return;
    }
    const withData = domainGames.value.filter((g) => g.count > 0);
    withData.slice(0, 2).forEach((g) => openGames.add(g.id));
    if (prefix.value) {
      const hit = domainGames.value.find((g) => g.domains.some((d) => d.prefix === prefix.value));
      if (hit) {
        openGames.add(hit.id);
      }
    }
    if (!withData.length && domainGames.value.length) {
      openGames.add(domainGames.value[0].id);
    }
  }

  const shortTime = (iso?: string) => (iso ? iso.slice(5, 16).replace('T', ' ') : '');

  /* ------------------------------ 数据域 ------------------------------ */

  const domainCards = computed(() => {
    const p = kpiPalette(isDark.value);
    const plugins = domains.value.plugins?.length ?? 0;
    const games = (domains.value.games || []).filter((g) => g.count > 0 && g.id !== 'unknown').length;
    const known = domains.value.totalKeys - domains.value.unknownCount;
    return [
      {
        key: 'total',
        label: 'Redis 键总数',
        icon: 'ant-design:cloud-server-outlined',
        value: thousands(domains.value.totalKeys),
        foot: `覆盖 ${games} 款游戏 · ${plugins} 个插件/模块`,
        color: p.blue[0],
        color2: p.blue[1],
      },
      {
        key: 'known',
        label: '已归属插件',
        icon: 'ant-design:cluster-outlined',
        value: thousands(known),
        foot: `占 ${domains.value.totalKeys ? ((known / domains.value.totalKeys) * 100).toFixed(1) : 0}%`,
        color: p.green[0],
        color2: p.green[1],
      },
      {
        key: 'ns',
        label: '命名空间',
        icon: 'ant-design:tags-outlined',
        value: String(domains.value.domains?.length ?? 0),
        foot: '带中文说明与风险等级',
        color: p.violet[0],
        color2: p.violet[1],
      },
      {
        key: 'unknown',
        label: '未收录键',
        icon: 'ant-design:question-circle-outlined',
        value: thousands(domains.value.unknownCount),
        foot: '可在「Redis 键」里自由查看',
        color: p.amber[0],
        color2: p.amber[1],
      },
    ];
  });

  async function loadDomains(force = false) {
    loading.value = true;
    try {
      domains.value = await dataApi.getDomains(force);
      ensureGamesOpen();
    } catch (e: any) {
      message.error(e?.message || '加载数据域失败');
    } finally {
      loading.value = false;
    }
  }

  const sortedDomains = computed(() =>
    (domains.value.domains || [])
      .filter((d) => (d.count || 0) > 0)
      .sort((a, b) => (b.count || 0) - (a.count || 0)),
  );

  const riskText = (r?: string) => (r === 'high' ? '高危' : r === 'mid' ? '谨慎' : '安全');

  /* ------------------------------ Redis 键 ------------------------------ */

  const prefix = ref('');
  const activeDomain = computed<DomainMeta | null>(
    () => (domains.value.domains || []).find((d) => d.prefix === prefix.value) || null,
  );
  const keyLoading = ref(false);
  const keyQuery = reactive({ q: '' });
  const keyPager = reactive({ page: 1, size: 20 });
  const keyPage = ref<KeyPage>({ total: 0, page: 1, size: 20, truncated: false, list: [] });

  const keyColumns = [
    { title: '键名', key: 'key', dataIndex: 'key' },
    { title: '类型', key: 'type', width: 100 },
    { title: 'TTL', key: 'ttl', width: 110 },
    { title: '操作', key: 'action', width: 120, fixed: 'right' as const },
  ];

  const keyPagination = computed(() => ({
    current: keyPager.page,
    pageSize: keyPager.size,
    total: keyPage.value.total,
    showSizeChanger: true,
    pageSizeOptions: ['20', '50', '100'],
    showTotal: (t: number) => `共 ${t} 个键`,
  }));

  function openPrefix(p: string) {
    tab.value = 'keys';
    prefix.value = p;
    keyPager.page = 1;
    keyQuery.q = '';
    loadKeys();
  }

  function switchTab(k: 'domains' | 'keys' | 'files') {
    tab.value = k;
    if (k === 'keys' && !keyPage.value.list.length) {
      loadKeys();
    }
    if (k === 'files' && !filePlugins.value.length) {
      loadFilePlugins();
    }
  }

  function searchKeys() {
    keyPager.page = 1;
    loadKeys();
  }

  async function loadKeys() {
    keyLoading.value = true;
    try {
      keyPage.value = await dataApi.getKeys({
        prefix: prefix.value || undefined,
        q: keyQuery.q || undefined,
        page: keyPager.page,
        size: keyPager.size,
      });
    } catch (e: any) {
      message.error(e?.message || '读取键列表失败');
    } finally {
      keyLoading.value = false;
    }
  }

  function handleKeyTableChange(pag: any) {
    keyPager.page = pag?.current ?? 1;
    keyPager.size = pag?.pageSize ?? 20;
    loadKeys();
  }

  function ttlText(ttl: number) {
    if (ttl === -1) return '永久';
    if (ttl === -2) return '已过期';
    if (ttl > 86400) return `${Math.round(ttl / 86400)} 天`;
    if (ttl > 3600) return `${Math.round(ttl / 3600)} 小时`;
    if (ttl > 60) return `${Math.round(ttl / 60)} 分钟`;
    return `${ttl} 秒`;
  }

  function fmtSize(bytes: number) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  /* ------------------------------ 键详情 ------------------------------ */

  const keyDrawer = reactive({ visible: false, saving: false, text: '', ttl: -1 });
  const keyDetail = ref<KeyDetail | null>(null);

  /** string 值若本身是 JSON，格式化后再展示，避免一坨挤在一行 */
  function prettyValue(d: KeyDetail) {
    if (d.type !== 'string') return JSON.stringify(d.value, null, 2);
    const raw = String(d.value ?? '');
    const t = raw.trim();
    if (t.startsWith('{') || t.startsWith('[')) {
      try {
        return JSON.stringify(JSON.parse(t), null, 2);
      } catch {
        /* 不是合法 JSON，原样展示 */
      }
    }
    return raw;
  }

  async function openKey(key: string) {
    keyDrawer.visible = true;
    keyDrawer.text = '';
    keyDetail.value = null;
    try {
      const d = await dataApi.getKey(key);
      keyDetail.value = d;
      keyDrawer.ttl = d.ttl;
      keyDrawer.text = prettyValue(d);
    } catch (e: any) {
      message.error(e?.message || '读取键失败');
      keyDrawer.visible = false;
    }
  }

  async function saveKey() {
    const d = keyDetail.value;
    if (!d) return;
    let value: any = keyDrawer.text;
    if (d.type !== 'string') {
      try {
        value = JSON.parse(keyDrawer.text);
      } catch (e: any) {
        message.error(`JSON 格式不合法：${e.message}`);
        return;
      }
    }
    keyDrawer.saving = true;
    try {
      await dataApi.setKey({ key: d.key, type: d.type, value });
      message.success('已保存，旧值已备份');
      keyDrawer.visible = false;
      loadKeys();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      keyDrawer.saving = false;
    }
  }

  async function applyTtl() {
    const d = keyDetail.value;
    if (!d) return;
    try {
      await dataApi.setTtl(d.key, keyDrawer.ttl);
      message.success('TTL 已更新');
      loadKeys();
    } catch (e: any) {
      message.error(e?.message || '设置失败');
    }
  }

  /* ------------------------------ 删除 ------------------------------ */

  const confirm = reactive({
    visible: false,
    loading: false,
    title: '',
    content: '',
    hint: '',
    run: null as null | (() => Promise<void>),
  });

  function askConfirm(o: { title: string; content: string; hint?: string; run: () => Promise<void> }) {
    confirm.title = o.title;
    confirm.content = o.content;
    confirm.hint = o.hint || '';
    confirm.run = o.run;
    confirm.visible = true;
  }

  async function runConfirm() {
    if (!confirm.run) return;
    confirm.loading = true;
    try {
      await confirm.run();
      confirm.visible = false;
    } finally {
      confirm.loading = false;
    }
  }

  function openDeleteKey(key: string) {
    const isHigh = key.startsWith('Yz:count:');
    askConfirm({
      title: '删除 Redis 键',
      content: isHigh
        ? `即将删除核心计数键：${key}\n删除后该天的消息统计会永久缺失（可从备份恢复）。`
        : `确定删除键 ${key} 吗？删除前会自动备份旧值。`,
      hint: '删除后可在「备份记录」里恢复',
      run: async () => {
        try {
          await dataApi.deleteKey(key, isHigh ? key : undefined);
          message.success('已删除，旧值已备份');
          keyDrawer.visible = false;
          loadKeys();
          loadDomains(true);
        } catch (e: any) {
          message.error(e?.message || '删除失败');
        }
      },
    });
  }

  const prefixConfirm = reactive({ visible: false, loading: false, content: '' });

  function openDeletePrefix() {
    prefixConfirm.content = `将删除 ${prefix.value}* 下的所有键（逐个备份后删除）。这个操作影响面较大，确认继续？`;
    prefixConfirm.visible = true;
  }

  async function doDeletePrefix() {
    prefixConfirm.loading = true;
    try {
      const res = await dataApi.deletePrefix(prefix.value);
      message.success(`已删除 ${res.deleted} 个键${res.failed?.length ? `，失败 ${res.failed.length} 个` : ''}`);
      prefixConfirm.visible = false;
      loadKeys();
      loadDomains(true);
    } catch (e: any) {
      message.error(e?.message || '清空失败');
    } finally {
      prefixConfirm.loading = false;
    }
  }

  /* ------------------------------ 备份记录 ------------------------------ */

  const backupDrawer = reactive({ visible: false, loading: false });
  const backups = ref<any[]>([]);
  const backupColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '键名', dataIndex: 'key', key: 'key' },
    { title: '类型', dataIndex: 'type', key: 'type', width: 90 },
    { title: '动作', dataIndex: 'action', key: 'action', width: 110 },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '操作', key: 'action2', width: 70 },
  ];

  async function openRedisBackups() {
    backupDrawer.visible = true;
    backupDrawer.loading = true;
    try {
      const res = await dataApi.getBackups(100);
      backups.value = (res?.list ?? []).map((x) => ({
        ...x,
        created_at: (x.created_at || '').replace('T', ' ').slice(0, 19),
      }));
    } catch {
      backups.value = [];
    } finally {
      backupDrawer.loading = false;
    }
  }

  async function doRestoreBackup(row: any) {
    try {
      await dataApi.restoreBackup(row.id);
      message.success('已恢复');
      loadKeys();
    } catch (e: any) {
      message.error(e?.message || '恢复失败');
    }
  }

  /* ------------------------------ 数据文件 ------------------------------ */

  const filePlugins = ref<FilePlugin[]>([]);
  const filePlugin = ref('');
  const filePath = ref('');
  const fileLoading = ref(false);
  const fileList = ref<FileItem[]>([]);

  const fileColumns = [
    { title: '名称', key: 'name' },
    { title: '大小', key: 'size', width: 110 },
    { title: '修改时间', key: 'mtime', width: 180 },
    { title: '操作', key: 'action', width: 140 },
  ];

  async function loadFilePlugins() {
    try {
      const res = await dataApi.getFilePlugins();
      filePlugins.value = res?.list ?? [];
    } catch {
      filePlugins.value = [];
    }
    /* 默认展开数据目录最大的那个插件，避免进页面就是空表格 */
    if (!filePlugin.value && filePlugins.value.length) {
      await openPlugin(filePlugins.value[0].plugin);
    }
  }

  async function openPlugin(plugin: string) {
    filePlugin.value = plugin;
    filePath.value = '';
    await refreshFiles();
  }

  async function refreshFiles() {
    if (!filePlugin.value) return;
    fileLoading.value = true;
    try {
      const res = await dataApi.getFiles(filePlugin.value, filePath.value);
      fileList.value = res?.list ?? [];
    } catch (e: any) {
      message.error(e?.message || '读取目录失败');
      fileList.value = [];
    } finally {
      fileLoading.value = false;
    }
  }

  function enterDir(p: string) {
    filePath.value = p;
    refreshFiles();
  }

  function upDir() {
    const parts = filePath.value.split('/').filter(Boolean);
    parts.pop();
    filePath.value = parts.join('/');
    refreshFiles();
  }

  const fileDrawer = reactive({ visible: false, saving: false, loadingBackups: false, path: '' });
  const fileContent = ref<FileContent | null>(null);
  const fileBackups = ref<any[]>([]);

  async function openFile(path: string) {
    fileDrawer.visible = true;
    fileDrawer.path = path;
    fileContent.value = null;
    fileBackups.value = [];
    try {
      const d = await dataApi.readFile(filePlugin.value, path);
      fileContent.value = d;
      fileDrawer.text = d.content;
      loadFileBackups();
    } catch (e: any) {
      message.error(e?.message || '读取文件失败');
      fileDrawer.visible = false;
    }
  }

  async function loadFileBackups() {
    if (!fileContent.value) return;
    fileDrawer.loadingBackups = true;
    try {
      const res = await dataApi.getFileBackups(fileContent.value.plugin, fileContent.value.path);
      fileBackups.value = res?.list ?? [];
    } catch {
      fileBackups.value = [];
    } finally {
      fileDrawer.loadingBackups = false;
    }
  }

  async function saveFile() {
    if (!fileContent.value) return;
    fileDrawer.saving = true;
    try {
      await dataApi.saveFile(fileContent.value.plugin, fileContent.value.path, fileDrawer.text);
      message.success('已保存，旧版本已备份');
      await openFile(fileContent.value.path);
      refreshFiles();
    } catch (e: any) {
      message.error(e?.message || '保存失败');
    } finally {
      fileDrawer.saving = false;
    }
  }

  async function restoreFileBackup(b: any) {
    if (!fileContent.value) return;
    try {
      await dataApi.restoreFile(fileContent.value.plugin, fileContent.value.path, b.name);
      message.success('已恢复到该版本');
      await openFile(fileContent.value.path);
      refreshFiles();
    } catch (e: any) {
      message.error(e?.message || '恢复失败');
    }
  }

  function restoreLatestFile() {
    if (fileBackups.value.length) {
      restoreFileBackup(fileBackups.value[0]);
    }
  }

  onMounted(async () => {
    await loadDomains();
    loadFilePlugins();
  });
</script>

<style scoped lang="less">
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .w-240 {
    width: 240px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  }

  .db-grid--3-9 {
    grid-template-columns: minmax(220px, 0.32fr) minmax(0, 1fr);
  }

  /* 插件数据域 */
  .dm-plugins {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }

  .dm-plugin {
    padding: 14px 16px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
  }

  .dm-plugin__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .dm-plugin__name {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    font-size: 13.5px;
    font-weight: 650;
    color: var(--g-text);

    small {
      font-size: 11px;
      font-weight: 400;
      color: var(--g-text-mute);
    }
  }

  .dm-plugin__count {
    font-size: 12px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  /* ------------ 三级导航：游戏分组（keys tab 左栏） ------------ */
  .dm-game {
    margin-bottom: 4px;

    &.is-empty .dm-game__head {
      opacity: 0.55;
    }
  }

  .dm-game__head {
    display: flex;
    gap: 8px;
    align-items: center;
    padding: 7px 10px;
    cursor: pointer;
    border-radius: 9px;
    transition: background 0.15s ease;

    &:hover {
      background: var(--g-hover);
    }
  }

  .dm-game__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    font-size: 12.5px;
    font-weight: 600;
    color: var(--g-text);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dm-game__count {
    font-size: 11px;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .dm-game__arrow {
    color: var(--g-text-mute);
    transition: transform 0.18s ease;
  }

  .dm-game.is-open .dm-game__arrow {
    transform: rotate(90deg);
  }

  .dm-game__body {
    padding: 2px 0 4px 6px;
    margin-top: 2px;
    border-left: 2px solid var(--g-card-border);
  }

  .dm-game__body .dm-ns__item {
    margin: 1px 0 1px 4px;
  }

  .dm-game__empty {
    padding: 6px 10px;
    font-size: 11.5px;
    color: var(--g-text-mute);
  }

  .dm-unknown {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 6px 10px;
    margin: 1px 0 1px 4px;

    span {
      overflow: hidden;
      font-size: 10.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .dm-plugin__domains {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .dm-chip {
    display: inline-flex;
    gap: 5px;
    align-items: center;
    padding: 3px 8px;
    font-size: 11.5px;
    color: var(--g-text-sub);
    cursor: pointer;
    background: var(--g-chip-bg);
    border: 1px solid transparent;
    border-radius: 7px;
    transition: all 0.18s;
  }

  .dm-chip em {
    font-style: normal;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .dm-chip small {
    font-size: 10.5px;
    font-weight: 400;
    color: var(--g-text-mute);
    opacity: 0.85;
  }

  .dm-chip:hover {
    border-color: var(--g-card-border-strong);
  }

  .dm-chip.is-high {
    color: var(--g-rose);
    background: rgb(224 102 74 / 10%);
  }

  .dm-chip.is-unknown {
    max-width: 100%;
    overflow: hidden;
    color: var(--g-text-mute);
    cursor: default;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  /* 命名空间侧栏 */
  .dm-ns {
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 620px;
    overflow: auto;
  }

  .dm-ns__item {
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 7px 10px;
    font-size: 12.5px;
    color: var(--g-text-sub);
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.16s;
  }

  .dm-ns__item:hover {
    background: var(--g-hover);
  }

  .dm-ns__item.is-active {
    color: var(--g-text);
    background: var(--g-chip-bg);
    box-shadow: inset 2px 0 0 var(--g-blue);
  }

  .dm-ns__item em {
    font-style: normal;
    color: var(--g-text-mute);
    font-variant-numeric: tabular-nums;
  }

  .dm-ns__label {
    display: flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .dm-ns__label i {
    width: 7px;
    height: 7px;
    background: var(--g-green);
    border-radius: 50%;
  }

  .dm-ns__label i.risk-high {
    background: #e0664a;
  }

  .dm-ns__label i.risk-mid {
    background: var(--g-amber);
  }

  .dm-ns__label small {
    font-size: 10.5px;
    color: var(--g-text-mute);
  }

  /* 表格里的键 */
  .dm-key {
    font-size: 12.5px;
    color: var(--g-text);
    cursor: pointer;
    word-break: break-all;
  }

  .dm-key:hover {
    color: var(--g-blue);
  }

  .dm-type {
    display: inline-block;
    padding: 0 7px;
    font-size: 11px;
    line-height: 19px;
    color: var(--g-text-sub);
    background: var(--g-chip-bg);
    border-radius: 5px;
  }

  .dm-type.is-string { color: #2f86c4; background: rgb(47 134 196 / 12%); }
  .dm-type.is-hash { color: #8d83e8; background: rgb(141 131 232 / 12%); }
  .dm-type.is-zset { color: #a8813f; background: rgb(168 129 63 / 12%); }
  .dm-type.is-list { color: #2e7a58; background: rgb(46 122 88 / 12%); }
  .dm-type.is-set { color: #ce7c9b; background: rgb(206 124 155 / 12%); }

  .dm-dir,
  .dm-file {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
    color: var(--g-text);
    cursor: pointer;
  }

  .dm-file:hover,
  .dm-dir:hover {
    color: var(--g-blue);
  }

  .dm-note {
    padding: 8px 12px;
    margin-bottom: 10px;
    font-size: 12px;
    color: var(--g-text-sub);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 9px;
  }

  .dm-note--warn {
    margin-top: 10px;
    margin-bottom: 0;
    color: var(--g-amber);
  }

  .dm-risk {
    padding: 0 6px;
    margin-left: 8px;
    font-size: 10.5px;
    line-height: 18px;
    border-radius: 4px;
  }

  .dm-risk.is-high { color: #e0664a; background: rgb(224 102 74 / 12%); }
  .dm-risk.is-mid { color: var(--g-amber); background: rgb(168 129 63 / 12%); }
  .dm-risk.is-low { color: var(--g-green); background: rgb(69 185 124 / 12%); }

  /* 抽屉内容 */
  .dm-meta {
    padding: 12px 14px;
    margin-bottom: 14px;
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
  }

  .dm-meta__row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: baseline;
    font-size: 12.5px;
    color: var(--g-text);
  }

  .dm-meta__row + .dm-meta__row {
    margin-top: 8px;
  }

  .dm-editor__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 6px;
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  .dm-editor__area {
    font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
    font-size: 12px;
    line-height: 1.7;
  }

  /* 抽屉里的编辑区跟随主题，避免深色模式下出现白底代码块 */
  :deep(.dm-editor__area.ant-input) {
    color: var(--g-text);
    background: var(--g-card-bg-soft);
    border-color: var(--g-card-border);
  }

  :deep(.dm-editor__area.ant-input:focus),
  :deep(.dm-editor__area.ant-input-focused) {
    background: var(--g-card-bg);
    border-color: var(--g-blue);
    box-shadow: 0 0 0 2px rgb(47 134 196 / 16%);
  }

  .dm-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
  }

  .dm-actions__left,
  .dm-actions__right {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .dm-backups {
    margin-top: 14px;
    border-top: 1px dashed var(--g-card-border);
  }

  .dm-backups__row {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 12px;
    border-bottom: 1px dashed var(--g-card-border);
  }

  .dm-empty {
    padding: 16px 0;
    font-size: 12.5px;
    color: var(--g-text-mute);
    text-align: center;
  }

  @media (max-width: 1180px) {
    .db-grid--3-9 {
      grid-template-columns: 1fr;
    }
  }
</style>
