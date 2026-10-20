<template>
  <BasicModal v-bind="getProps">
    <a-spin :spinning="loading || (activeKey === 'readme' && !initOk)" :tip="loadingTip">
      <a-empty v-if="!plugin" description="插件加载失败" />
      <template v-else>
        <!-- 身份条：图标 + 标题 + 包名 + 状态胶囊 -->
        <header class="gm-head">
          <span class="gm-head__icon">
            <PluginIcon :plugin="plugin" :size="18" />
          </span>
          <div class="gm-head__body">
            <div class="gm-head__title">{{ plugin.title }}</div>
            <div class="gm-head__sub">{{ plugin.name }}</div>
          </div>
          <div class="gm-head__tags">
            <span v-for="(s, i) in statusChips" :key="i" class="gm-tag" :class="`is-${s.tone}`">{{ s.text }}</span>
          </div>
        </header>

        <a-tabs v-model:active-key="activeKey" class="gm-tabs">
          <a-tab-pane tab="详情" key="desc">
            <div class="gm-desc">
              <div v-for="row in descRows" :key="row.label" class="gm-row">
                <div class="gm-row__label">{{ row.label }}</div>
                <div class="gm-row__value" :class="{ 'is-mono': row.type === 'mono' }">
                  <template v-if="row.type === 'link'">
                    <a :href="row.value" target="_blank" class="gm-link">{{ row.value }}</a>
                  </template>
                  <template v-else-if="row.type === 'chips'">
                    <a v-for="(a, i) in row.value" :key="i" class="g-chip gm-author" :href="a.link || undefined" target="_blank">
                      {{ a.name }}
                    </a>
                    <span v-if="!row.value.length" class="gm-muted">—</span>
                  </template>
                  <template v-else>{{ row.value || '—' }}</template>
                </div>
              </div>
            </div>
          </a-tab-pane>
          <a-tab-pane v-if="plugin.hasConfig" tab="配置" key="config">
            <PluginConfigForm v-if="!plugin.showInMenu && showConfigForm" ref="configFormRef" :plugin="plugin" />
          </a-tab-pane>
          <a-tab-pane tab="README" key="readme">
            <div v-if="loading"></div>
            <a-empty v-else-if="!readme" description="README 读取失败" />
            <MarkdownViewer v-else :value="readme" @initOk="onInitOk" />
          </a-tab-pane>
        </a-tabs>
      </template>
    </a-spin>

    <template #footer>
      <div class="gm-foot">
        <div class="gm-foot__left">
          <template v-if="activeKey === 'desc'">
            <a-button v-if="!plugin?.installed" type="primary" :pre-icon="$gm('cloud')" @click="installNow">
              立即安装
            </a-button>
            <a-button
              v-else
              danger
              :pre-icon="$gm('trash')"
              :disabled="['miao-plugin'].includes(plugin.name)"
              @click="uninstall"
            >
              卸载插件
            </a-button>
          </template>
          <span class="gm-foot__hint">{{ footHint }}</span>
        </div>
        <div class="gm-foot__right">
          <a-button @click="close">关闭</a-button>
          <a-button v-if="activeKey === 'config'" type="primary" :pre-icon="$gm('save')" @click="saveConfig">
            保存配置
          </a-button>
        </div>
      </div>
    </template>
  </BasicModal>
</template>

<script lang="tsx">
  import type { Plugin } from '/#/guoba';
  import type { ModalProps } from '/@/components/Modal';
  import { BasicModal, useModalInner } from '/@/components/Modal';
  import { computed, defineComponent, ref, unref, watch } from 'vue';
  import { Checkbox } from 'ant-design-vue';
  import { useAttrs } from '/@/hooks/core/useAttrs';
  import { useDesign } from '/@/hooks/web/useDesign';
  import Scrollbar from '/@/components/Scrollbar/src/Scrollbar.vue';
  import { pluginApi } from '/@/api/guoba';
  import { MarkdownViewer } from '/@/components/Markdown';
  import { useMessage } from '/@/hooks/web/useMessage';
  import PluginConfigForm from './components/PluginConfigForm.vue';
  import PluginIcon from './components/PluginIcon.vue';
  import { sleep } from '/@/utils/common';
  import { useGo } from '/@/hooks/web/usePage';

  export default defineComponent({
    name: 'GPluginModal',
    components: {
      PluginConfigForm,
      PluginIcon,
      Scrollbar,
      BasicModal,
      MarkdownViewer,
    },
    emits: ['register', 'success'],
    setup(props) {
      const configFormRef = ref();
      const attrs = useAttrs();
      const { prefixCls } = useDesign('g-plugin-modal');
      const { createMessage: $message, createConfirm } = useMessage();
      const go = useGo();

      // 当前是否正在加载中
      const loading = ref(false);
      const loadingTip = ref('');
      const initOk = ref(false);
      const activeKey = ref('desc');
      const plugin = ref<Plugin>();
      const readme = ref('');
      // 注册弹窗
      const [registerModal, { closeModal, setModalProps, getVisible }] = useModalInner(open);

      // 状态胶囊
      const statusChips = computed(() => {
        const p = plugin.value;
        if (!p) return [];
        const list: { text: string; tone: string }[] = [
          p.installed ? { text: '已安装', tone: 'ok' } : { text: '未安装', tone: 'muted' },
        ];
        if (p.hasConfig) list.push({ text: '可配置', tone: 'info' });
        if (p.isV3) list.push({ text: 'V3', tone: 'blue' });
        if (p.isV2) list.push({ text: 'V2', tone: 'amber' });
        if (p.isDeleted) list.push({ text: '已失效', tone: 'danger' });
        return list;
      });

      // 详情键值行
      const descRows = computed(() => {
        const p = plugin.value;
        if (!p) return [] as any[];
        let authors = p.author;
        let links = p.authorLink;
        if (!Array.isArray(authors)) authors = authors ? [authors] : [];
        if (links && !Array.isArray(links)) links = [links];
        const authorChips = (authors as string[]).filter(Boolean).map((name, i) => ({
          name: String(name).replace(/^@/, ''),
          link: Array.isArray(links) ? links[i] : undefined,
        }));
        return [
          { label: '插件标题', value: p.title },
          { label: '插件名称', value: p.name, type: 'mono' },
          { label: '插件作者', value: authorChips, type: 'chips' },
          { label: '仓库地址', value: p.link, type: 'link' },
          { label: '插件说明', value: p.description },
        ] as any[];
      });

      // 底部提示
      const footHint = computed(() => {
        if (activeKey.value === 'config') return '修改后点击右侧「保存配置」立即写入';
        if (activeKey.value === 'readme') return 'README 来自插件仓库，需要联网拉取';
        if (!plugin.value) return '';
        if (!plugin.value.installed) return '安装后会立即重启 Bot';
        return plugin.value.showInMenu ? '可在「配置」中跳转到插件配置页' : '卸载会删除插件目录及其数据，不可恢复';
      });

      // 弹窗最终props
      const getProps = computed(() => {
        let modalProps: Partial<ModalProps> = {
          width: 820,
          title: '插件详情',
          wrapClassName: prefixCls,
          confirmLoading: unref(loading),
          showOkBtn: false,
          showCancelBtn: false,
        };
        let finalProps: Recordable = {
          ...unref(attrs),
          ...modalProps,
          ...props,
          onOk: close,
          onCancel: close,
          onRegister: registerModal,
        };
        return finalProps;
      });

      watch(activeKey, (val) => {
        if (val === 'readme') {
          if (readme.value) {
            getReadme();
          }
        } else if (val === 'config') {
          if (plugin.value?.showInMenu) {
            // 跳转到插件详情页
            go(`/plugin/@/${plugin.value.name}`);
            close();
          }
        }
      });

      const showConfigForm = ref(false);

      watch(getVisible!, async (val) => {
        if (val) {
          await sleep(300);
          showConfigForm.value = true;
        } else {
          await sleep(300);
          showConfigForm.value = false;
        }
      });

      /** 弹窗开启 */
      async function open(data) {
        readme.value = '';
        activeKey.value = 'desc';
        plugin.value = data.plugin;
      }

      /** 弹窗关闭 */
      function close() {
        closeModal();
      }

      async function saveConfig() {
        try {
          setLoading(true);
          await configFormRef.value!.savePluginConfigData();
        } finally {
          setLoading(false);
        }
      }

      /** 设置加载状态*/
      function setLoading(flag) {
        loading.value = flag;
        setModalProps({ confirmLoading: flag });
      }

      let mdTimer: any = null;

      async function getReadme() {
        setLoading(true);
        let timer = setTimeout(() => {
          loadingTip.value = 'github仓库可能会因为网络问题而缓慢，请耐心等待';
        }, 1500);
        try {
          let link = plugin.value!.link;
          if (!link) {
            readme.value = '';
          } else {
            readme.value = await pluginApi.getReadme(plugin.value!.link);
            mdTimer = setTimeout(() => {
              loadingTip.value = 'Markdown编辑器首次使用可能会因为网络原因加载比较慢，请耐心等待';
            }, 1500);
          }
        } finally {
          loadingTip.value = '';
          clearTimeout(timer);
          setLoading(false);
        }
      }

      function onInitOk() {
        clearTimeout(mdTimer);
        loadingTip.value = '';
        initOk.value = true;
      }

      const autoRestart = ref(true);
      const autoNpmInstall = ref(true);

      async function installNow() {
        createConfirm({
          title: '安装插件',
          iconType: 'warning',
          content: () => (
            <div>
              <p>确定要安装该插件吗？</p>
              <Checkbox
                checked={autoRestart.value}
                onChange={(e) => {
                  autoRestart.value = e.target.checked;
                  // 自动重启必须自动安装依赖
                  if (autoRestart.value && !autoNpmInstall.value) {
                    autoNpmInstall.value = true;
                  }
                }}
              >
                自动重启
              </Checkbox>
              <Checkbox
                checked={autoNpmInstall.value}
                onChange={(e) => {
                  if (!e.target.checked && autoRestart.value) {
                    $message.warn('请先去掉自动重启（自动重启必须自动安装依赖）');
                  } else {
                    autoNpmInstall.value = e.target.checked;
                  }
                }}
              >
                自动安装依赖
              </Checkbox>
            </div>
          ),
          async onOk() {
            try {
              setLoading(true);
              let data = await pluginApi.installPlugin(plugin.value!.link, {
                autoRestart: autoRestart.value,
                autoNpmInstall: autoNpmInstall.value,
              });
              if (data.status === 'success') {
                $message.success(data.message);
                if (autoRestart.value) {
                  await sleep(3000);
                  window.location.reload();
                }
              } else {
                $message.error(data.message);
              }
            } finally {
              setLoading(false);
            }
          },
        });
      }

      async function uninstall() {
        createConfirm({
          title: '卸载插件',
          iconType: 'warning',
          content: (
            <div>
              <p>
                确定要卸载该插件吗？
                <br />
                将会删除插件目录包括可能产生的数据以及配置，且无法恢复！
              </p>
              <p>请谨慎操作，卸载后会立即重启！</p>
            </div>
          ),
          async onOk() {
            try {
              setLoading(true);
              let data = await pluginApi.uninstallPlugin(plugin.value!.name);
              if (data.status === 'success') {
                $message.success(data.message);
                await sleep(3000);
                window.location.reload();
              } else {
                $message.error(data.message);
              }
            } finally {
              setLoading(false);
            }
          },
        });
      }

      return {
        configFormRef,
        getProps,
        initOk,
        loading,
        loadingTip,
        plugin,
        readme,
        activeKey,
        showConfigForm,
        statusChips,
        descRows,
        footHint,

        close,
        saveConfig,
        installNow,
        uninstall,
        onInitOk,
      };
    },
  });
</script>

<style lang="less">
  //noinspection LessUnresolvedVariable
  @prefix-cls: ~'@{namespace}-g-plugin-modal';

  .@{prefix-cls} {
    .ant-modal-body > .scrollbar {
      padding-top: 0;
    }

    /* 弹窗本体跟随设计令牌（深色主题下 antd 默认仍是浅底） */
    .ant-modal-content {
      background: var(--g-card-bg);
      border: 1px solid var(--g-card-border);
      border-radius: 14px;
      box-shadow: var(--g-card-shadow);
    }

    .ant-modal-header {
      padding: 14px 18px 12px;
      margin-bottom: 0;
      background: transparent;
      border-bottom: 1px solid var(--g-card-border);
    }

    .ant-modal-title {
      font-size: 13.5px;
      font-weight: 650;
      color: var(--g-text);
      letter-spacing: 0.3px;
    }

    .ant-modal-close {
      color: var(--g-text-mute);
    }

    .ant-modal-close:hover {
      color: var(--g-text);
      background: var(--g-hover);
    }

    .ant-modal-body {
      padding: 14px 18px 6px;
      color: var(--g-text);
    }

    .ant-modal-footer {
      padding: 12px 18px 14px;
      margin-top: 0;
      border-top: 1px solid var(--g-card-border);
    }

    .ant-tabs-tab {
      color: var(--g-text-sub);
    }

    .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: var(--g-blue) !important;
    }

    .ant-tabs-top > .ant-tabs-nav::before {
      border-bottom-color: var(--g-card-border);
    }

    .ant-empty-description {
      color: var(--g-text-mute);
    }

    /* -------- 身份条 -------- */
    .gm-head {
      display: flex;
      gap: 10px;
      align-items: center;
      padding: 2px 2px 13px;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--g-card-border);
    }

    .gm-head__icon {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: var(--g-card-bg-soft);
      border: 1px solid var(--g-card-border);
      border-radius: 10px;
    }

    .gm-head__body {
      flex: 1;
      min-width: 0;
    }

    .gm-head__title {
      overflow: hidden;
      font-size: 14px;
      font-weight: 650;
      color: var(--g-text);
      text-overflow: ellipsis;
      letter-spacing: 0.2px;
      white-space: nowrap;
    }

    .gm-head__sub {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 10.5px;
      color: var(--g-text-mute);
    }

    .gm-head__tags {
      display: flex;
      flex-wrap: wrap;
      flex: none;
      gap: 4px;
      align-items: center;
      justify-content: flex-end;
      max-width: 46%;
    }

    .gm-tag {
      padding: 1px 7px;
      font-size: 10.5px;
      font-weight: 550;
      line-height: 16px;
      white-space: nowrap;
      border-radius: 5px;
    }

    .gm-tag.is-ok {
      color: var(--g-green);
      background: rgb(69 185 124 / 14%);
    }

    .gm-tag.is-info {
      color: var(--g-violet);
      background: rgb(157 141 240 / 15%);
    }

    .gm-tag.is-blue {
      color: var(--g-blue);
      background: rgb(98 168 234 / 15%);
    }

    .gm-tag.is-amber {
      color: var(--g-amber);
      background: rgb(211 188 141 / 18%);
    }

    .gm-tag.is-danger {
      color: var(--g-rose);
      background: rgb(255 138 101 / 15%);
    }

    .gm-tag.is-muted {
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
    }

    /* -------- Tabs -------- */
    .gm-tabs .ant-tabs-nav {
      margin-bottom: 6px;
    }

    .gm-tabs .ant-tabs-tab {
      font-size: 12.5px;
    }

    /* -------- 详情键值行 -------- */
    .gm-desc {
      display: flex;
      flex-direction: column;
      padding-top: 2px;
    }

    .gm-row {
      display: flex;
      gap: 12px;
      padding: 9px 2px;
      border-bottom: 1px dashed var(--g-card-border);
    }

    .gm-row:last-child {
      border-bottom: none;
    }

    .gm-row__label {
      flex: none;
      width: 88px;
      font-size: 12px;
      color: var(--g-text-mute);
    }

    .gm-row__value {
      flex: 1;
      min-width: 0;
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--g-text);
      word-break: break-word;
    }

    .gm-row__value.is-mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 11.5px;
      color: var(--g-text-sub);
    }

    .gm-link {
      color: var(--g-blue);
      word-break: break-all;
    }

    .gm-author {
      padding: 1px 8px;
      margin-right: 4px;
      font-size: 11px;
      text-decoration: none;
    }

    .gm-muted {
      color: var(--g-text-mute);
    }

    /* -------- Footer -------- */
    .gm-foot {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
    }

    .gm-foot__left {
      display: flex;
      gap: 10px;
      align-items: center;
      min-width: 0;
    }

    .gm-foot__hint {
      overflow: hidden;
      font-size: 11.5px;
      color: var(--g-text-mute);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .gm-foot__right {
      display: flex;
      flex: none;
      gap: 8px;
      align-items: center;
    }
  }
</style>
