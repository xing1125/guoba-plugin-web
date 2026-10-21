<template>
  <PageWrapper title="">
    <section class="db-hero">
      <div class="db-hero__main">
        <div class="db-hero__eyebrow">ABOUT</div>
        <div class="db-hero__title">关于</div>
        <div class="db-hero__desc">
          <b>YingPanel（荧后台）</b> 是
          <a href="https://github.com/Le-niao/Yunzai-Bot" target="_blank">Yunzai-Bot</a>
          的后台管理面板，基于 Vue-Vben-Admin / Vue3 / Vite / Ant-Design-Vue / TypeScript 构建，由开源项目
          <a :href="GITHUB_URL" target="_blank">Guoba-Plugin</a>
          fork 后深度定制。
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
      <section class="g-card db-about__brand">
        <figure class="db-about__brandart">
          <img :src="artUrl" alt="荧 · 二创插画" />
        </figure>
        <div class="db-about__brandbody">
          <div class="db-about__brandtitle">视觉与品牌</div>
          <p>
            整套视觉取自云崽的拟人形象<b>荧</b>：水手服的天蓝
            <code>#4f8fd8</code>、发色与星星的暖金 <code>#e2ab4a</code>，以及画面里漂浮的气泡。侧栏与导航用自绘的毛玻璃方块图标（<code>gmg</code> 图标集），按钮、表格操作用跟随文字色的线性图标（<code>gm</code> 图标集）。
          </p>
          <p class="db-about__brandnote">插画为二创作品，仅作本面板的装饰使用，角色版权归 miHoYo 所有。</p>
          <div class="db-about__swatches">
            <span class="is-sky"><i /><em>天蓝</em>#4f8fd8</span>
            <span class="is-gold"><i /><em>暖金</em>#e2ab4a</span>
            <span class="is-mist"><i /><em>气泡白</em>#f7fbff</span>
          </div>
        </div>
      </section>
      <section class="g-card db-about__block">
        <Description @register="infoRegister" />
      </section>
      <section class="g-card db-about__block db-about__deps">
        <Description @register="register" />
      </section>
      <section class="g-card db-about__block db-about__deps">
        <Description @register="registerDev" />
      </section>
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
  import artUrl from '/@/assets/images/ying-art.webp';

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
    // 手机上必须降列：3 列时每格只有 ~100px，版本号「^6.0.0」会被拆成一字一行
    column: { xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 },
  });

  const [registerDev] = useDescription({
    title: '开发环境依赖',
    data: devDependencies,
    schema: devSchema,
    column: { xxl: 3, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 },
  });

  const [infoRegister] = useDescription({
    title: '项目信息',
    data: infoData,
    schema: infoSchema,
    column: { xxl: 2, xl: 2, lg: 2, md: 2, sm: 1, xs: 1 },
  });
</script>

<style scoped>
  .db-about {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px 0 4px;
  }

  .db-hero__desc a {
    color: var(--g-blue);
  }

  /* -------- 品牌卡：插画 + 视觉说明 -------- */
  .db-about__brand {
    display: flex;
    gap: 20px;
    align-items: center;
  }

  /* 插画自带 alpha（白底已在 gen-login-art.py 里抠掉），所以不需要卡片/描边/投影，
   * 方形只是构图：cover 裁到胸口 + 下沿羽化，人物直接从卡片底色上浮出来 */
  .db-about__brandart {
    position: relative;
    flex: 0 0 auto;
    width: 148px;
    height: 148px; /* 显式给高：竖排 flex 里 aspect-ratio 会被图片的固有比例顶开 */
    margin: 0;
    align-self: center;
  }

  /* 卡片底色是白的，白衬衫会跟着糊掉 —— 身后垫一层天蓝柔光，人物才有轮廓 */
  .db-about__brandart::before {
    position: absolute;
    inset: -14%;
    z-index: -1;
    content: '';
    background: radial-gradient(62% 58% at 50% 42%, rgb(142 199 243 / 58%), rgb(142 199 243 / 0) 76%);
    filter: blur(8px);
  }

  .db-about__brandart img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 2%;
    mask-image: linear-gradient(180deg, #000 0 88%, rgb(0 0 0 / 0) 100%);
  }

  html[data-theme='dark'] .db-about__brandart::before {
    background: radial-gradient(56% 50% at 50% 40%, rgb(98 168 234 / 26%), rgb(98 168 234 / 0) 74%);
  }

  html[data-theme='dark'] .db-about__brandart img {
    filter: brightness(0.88) saturate(1.04);
  }

  .db-about__brandbody {
    min-width: 0;
  }

  .db-about__brandtitle {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: var(--g-text);
    letter-spacing: 0.2px;
  }

  .db-about__brandtitle::before {
    width: 3px;
    height: 14px;
    content: '';
    background: linear-gradient(180deg, var(--g-gold), var(--g-blue));
    border-radius: 2px;
  }

  .db-about__brandbody p {
    max-width: 720px;
    margin: 10px 0 0;
    font-size: 12.5px;
    line-height: 1.9;
    color: var(--g-text-sub);
  }

  .db-about__brandbody b {
    font-weight: 650;
    color: var(--g-text);
  }

  .db-about__brandbody code {
    padding: 1px 5px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
    color: var(--g-blue);
    background: rgb(98 168 234 / 12%);
    border-radius: 5px;
  }

  .db-about__brandnote {
    font-size: 11.5px !important;
    color: var(--g-text-mute) !important;
  }

  /* 品牌色卡：把主色写进页面本身，比只写 hex 更有说服力 */
  .db-about__swatches {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 14px;
  }

  .db-about__swatches span {
    display: inline-flex;
    gap: 7px;
    align-items: center;
    padding: 4px 10px 4px 6px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--g-text-mute);
    background: var(--g-card-bg-soft);
    border: 1px solid var(--g-card-border);
    border-radius: 20px;
  }

  .db-about__swatches em {
    font-family: inherit;
    font-style: normal;
    color: var(--g-text-sub);
  }

  .db-about__swatches i {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);
  }

  .db-about__swatches .is-sky i {
    background: linear-gradient(160deg, #8ec7f3, #4f8fd8);
  }

  .db-about__swatches .is-gold i {
    background: linear-gradient(160deg, #f0c877, #e2ab4a);
  }

  .db-about__swatches .is-mist i {
    background: linear-gradient(160deg, #ffffff, #eef5ff);
  }

  @media (max-width: 640px) {
    .db-about__brand {
      flex-direction: column;
      align-items: flex-start;
    }

    /* 竖排时靠左会留一大块空，直接居中当封面图更自然 */
    .db-about__brandart {
      align-self: center;
      width: 108px;
      height: 108px;
    }
  }

  /* 每块「项目信息 / 依赖」都是一张 g-card，内部表格不再自带外框与阴影 */
  .db-about__block :deep(.ant-descriptions) {
    margin-bottom: 0;
  }

  .db-about__block :deep(.ant-descriptions-title) {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    font-weight: 600;
    color: var(--g-text);
    letter-spacing: 0.2px;
  }

  /* 标题前的竖条与 g-card__title 一致 */
  .db-about__block :deep(.ant-descriptions-title)::before {
    width: 3px;
    height: 14px;
    content: '';
    background: linear-gradient(180deg, var(--g-gold), var(--g-blue));
    border-radius: 2px;
  }

  .db-about__block :deep(.ant-descriptions-view) {
    overflow: hidden;
    background: transparent;
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    box-shadow: none;
  }

  .db-about__block :deep(.ant-descriptions-row > th),
  .db-about__block :deep(.ant-descriptions-row > td) {
    padding: 9px 12px;
    border-color: var(--g-card-border);
  }

  .db-about__block :deep(.ant-descriptions-item-label) {
    font-size: 12px;
    color: var(--g-text-mute);
    background: var(--g-card-bg-soft);
  }

  .db-about__block :deep(.ant-descriptions-item-content) {
    font-size: 12.5px;
    color: var(--g-text-sub);
  }

  /* 依赖名/版本号用等宽字体，扫读对齐 */
  .db-about__deps :deep(.ant-descriptions-item-label),
  .db-about__deps :deep(.ant-descriptions-item-content) {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 11.5px;
  }

  .db-about__block :deep(.ant-descriptions-item-content .ant-tag) {
    padding: 0 7px;
    font-size: 11px;
    font-weight: 550;
    line-height: 17px;
    color: var(--g-blue);
    background: rgb(98 168 234 / 15%);
    border: none;
    border-radius: 5px;
  }

  .db-about__block :deep(.ant-descriptions-item-content a) {
    color: var(--g-blue);
  }

  @media (max-width: 900px) {
    .db-about__block :deep(.ant-descriptions-view) {
      overflow-x: auto;
    }
  }
</style>
