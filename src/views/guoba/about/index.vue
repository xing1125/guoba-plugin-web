<template>
  <PageWrapper title="" dense>
    <section class="db-hero">
      <div class="db-hero__main">
        <div class="db-hero__eyebrow">ABOUT</div>
        <div class="db-hero__title">关于</div>
        <div class="db-hero__desc">
          <a :href="GITHUB_URL" target="_blank">Guoba-Plugin</a>
          是
          <a href="https://github.com/Le-niao/Yunzai-Bot" target="_blank">Yunzai-Bot</a>
          的后台管理插件，基于 Vue-Vben-Admin / Vue3 / Vite / Ant-Design-Vue / TypeScript 构建。
        </div>
      </div>
      <div class="db-hero__side">
        <GSegmented
          :model-value="activeKey"
          :options="tabPanes.map((t) => ({ value: t.key, label: t.title }))"
          label="关于页视图"
          @update:model-value="activeKey = $event as any"
        />
      </div>
    </section>

    <div v-show="activeKey === 'about'" key="about" class="db-about">
      <Description @register="infoRegister" class="enter-y" />
      <Description @register="register" class="my-4 enter-y" />
      <Description @register="registerDev" class="enter-y" />
    </div>
    <div v-show="activeKey === 'todo'" key="todo" class="db-about">
      <LoadGitee />
    </div>
  </PageWrapper>
</template>

<script lang="ts" setup>
  import { h, ref } from 'vue';
  import { Tag } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Description, DescItem, useDescription } from '/@/components/Description';
  import { GITHUB_URL, SITE_URL, DOC_URL, GITEE_URL } from '/@/settings/siteSetting';
  // import LoadGist from './LoadGist.vue';
  import LoadGitee from './LoadGitee.vue';
  import GSegmented from '../system/_shared/form/GSegmented.vue';

  import { pkg, lastBuildTime } from '/@/utils/appInfo';

  // noinspection JSUnusedGlobalSymbols
  const _components = { PageWrapper, Description, LoadGitee };

  const { dependencies, devDependencies, name, version } = pkg;
  const schema: DescItem[] = [];
  const devSchema: DescItem[] = [];

  const commonTagRender = (color: string) => (curVal) => h(Tag, { color }, () => curVal);

  const commonLinkRender = (text: string) => (href) => h('a', { href, target: '_blank' }, text);

  const activeKey = ref('about');

  const tabPanes = ref([
    { key: 'about', title: '关于' },
    { key: 'todo', title: '咕咕咕' },
  ]);

  const infoSchema: DescItem[] = [
    {
      label: '版本',
      field: 'version',
      render: commonTagRender('blue'),
    },
    {
      label: '最后编译时间',
      field: 'lastBuildTime',
      render: commonTagRender('blue'),
    },
    // {
    //   label: '文档地址',
    //   field: 'doc',
    //   render: commonLinkRender('文档地址'),
    // },
    // {
    //   label: '预览地址',
    //   field: 'preview',
    //   render: commonLinkRender('预览地址'),
    // },
    {
      label: 'Github',
      field: 'github',
      render: commonLinkRender('Github仓库地址'),
    },
    {
      label: 'Gitee',
      field: 'gitee',
      render: commonLinkRender('Gitee仓库地址'),
    },
  ];

  const infoData = {
    version: window['__YUNZAI_BOT_CONF__']['GUOBA_VERSION'] || version,
    lastBuildTime,
    doc: DOC_URL,
    preview: SITE_URL,
    github: GITHUB_URL,
    gitee: GITEE_URL,
  };

  Object.keys(dependencies).forEach((key) => {
    schema.push({ field: key, label: key });
  });

  Object.keys(devDependencies).forEach((key) => {
    devSchema.push({ field: key, label: key });
  });

  const [register] = useDescription({
    title: '生产环境依赖',
    data: dependencies,
    schema: schema,
    column: 3,
  });

  const [registerDev] = useDescription({
    title: '开发环境依赖',
    data: devDependencies,
    schema: devSchema,
    column: 3,
  });

  const [infoRegister] = useDescription({
    title: '项目信息',
    data: infoData,
    schema: infoSchema,
    column: 2,
  });
</script>

<style scoped>
  .db-about {
    padding: 14px 4px 0;
  }

  .db-hero__desc a {
    color: var(--g-blue);
  }

  /* 让 vben 的 Description 卡片跟随设计令牌（尤其暗色主题） */
  .db-about :deep(.ant-descriptions) {
    margin-bottom: 16px;
  }

  .db-about :deep(.ant-descriptions-title) {
    margin-bottom: 10px;
    font-size: 13.5px;
    font-weight: 650;
    color: var(--g-text);
    letter-spacing: 0.2px;
  }

  .db-about :deep(.ant-descriptions-view) {
    overflow: hidden;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 12px;
    box-shadow: var(--g-card-shadow);
  }

  .db-about :deep(.ant-descriptions-bordered .ant-descriptions-view) {
    border-color: var(--g-card-border);
  }

  .db-about :deep(.ant-descriptions-row > th),
  .db-about :deep(.ant-descriptions-row > td) {
    border-color: var(--g-card-border);
  }

  .db-about :deep(.ant-descriptions-item-label) {
    font-size: 12px;
    color: var(--g-text-mute);
    background: var(--g-card-bg-soft);
  }

  .db-about :deep(.ant-descriptions-item-content) {
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  .db-about :deep(.ant-descriptions-item-content .ant-tag) {
    padding: 0 7px;
    font-size: 11px;
    font-weight: 550;
    line-height: 17px;
    color: var(--g-blue);
    background: rgb(98 168 234 / 15%);
    border: none;
    border-radius: 5px;
  }

  .db-about :deep(.ant-descriptions-item-content a) {
    color: var(--g-blue);
  }
</style>
