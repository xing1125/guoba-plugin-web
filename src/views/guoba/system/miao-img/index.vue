<template>
  <PageWrapper title="">
    <div class="mi g-page">
      <!-- ============================ 页头 ============================ -->
      <section class="db-hero">
        <div class="db-hero__main">
          <div class="db-hero__eyebrow">MIAO GALLERY</div>
          <div class="db-hero__title">喵喵面板图</div>
          <div class="db-hero__desc">
            在后台上传 / 管理面板图、立绘与写真，落盘目录与聊天指令完全一致
            <span class="db-hero__time">· 官方角色 {{ stats.total }} 位</span>
          </div>
        </div>
        <div class="db-hero__side">
          <GSegmented
            :model-value="kind"
            :options="kindOptions"
            size="sm"
            label="图库类型"
            @change="switchKind"
          />
          <Button size="small" :loading="loadingCatalog" @click="loadCatalog(true)">
            <Icon :icon="$gm('refresh')" :size="13" style="margin-right: 4px" />
            刷新角色表
          </Button>
        </div>
      </section>

      <!-- ============================ 筛选行 ============================ -->
      <section class="mi-filters g-card">
        <div class="mi-filters__row">
          <span class="mi-filters__label">稀有度</span>
          <GSegmented
            :model-value="filterStar"
            :options="starOptions"
            size="sm"
            label="稀有度筛选"
            @change="onStarChange"
          />
        </div>
        <div class="mi-filters__row">
          <span class="mi-filters__label">属性</span>
          <div class="mi-filters__elems">
            <button
              v-for="e in elemOptions"
              :key="e.value"
              type="button"
              class="mi-elem"
              :class="{ 'is-active': filterElem === e.value }"
              @click="filterElem = e.value"
            >
              <i v-if="e.value !== 'all'" class="mi-elem__dot" :style="{ background: ELEM_COLOR[e.value] || '#8b93a1' }" />
              {{ e.label }}
              <span v-if="e.count" class="mi-elem__n">{{ e.count }}</span>
            </button>
          </div>
        </div>
        <div class="mi-filters__row">
          <span class="mi-filters__label">游戏</span>
          <GSegmented
            :model-value="filterGame"
            :options="gameOptions"
            size="sm"
            label="游戏筛选"
            @change="onGameChange"
          />
        </div>
        <div class="mi-filters__row mi-filters__row--last">
          <span class="mi-filters__label">角色名</span>
          <GSearch v-model="keyword" size="small" width="260px" placeholder="搜索角色名" @search="noop" />
          <span class="mi-filters__count">符合筛选的角色 · {{ filtered.length }} 位</span>
        </div>
      </section>

      <!-- ============================ 主体：角色网格 + 选中角色图片 ============================ -->
      <section class="mi-body">
        <!-- 左：角色网格 -->
        <div class="mi-roles g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('users')" :size="13" /></i>
              角色
              <span class="gm-panel__extra" style="margin-left: 8px">
                {{ filtered.length }} 位 · 有图 {{ withImagesCount }} 位
              </span>
            </div>
            <Button size="small" @click="openNewChar">
              <Icon :icon="$gm('plus')" :size="13" style="margin-right: 4px" />
              自定义目录
            </Button>
          </div>

          <div v-if="loadingCatalog" class="mi-rolegrid">
            <div v-for="i in 12" :key="i" class="g-skeleton" style="height: 74px" />
          </div>
          <div v-else-if="filtered.length" class="mi-rolegrid">
            <button
              v-for="c in filtered"
              :key="c.name"
              type="button"
              class="mi-role"
              :class="{ 'is-active': curName === c.name }"
              @click="pickChar(c.name)"
            >
              <span class="mi-role__name">{{ c.name }}</span>
              <span class="mi-role__tags">
                <span v-if="c.star" class="mi-role__tag">
                  <i class="mi-role__dot" style="background: #d3bc8d" />{{ c.star }} 星
                </span>
                <span v-if="c.elem" class="mi-role__tag">
                  <i class="mi-role__dot" :style="{ background: ELEM_COLOR[c.elem] || '#8b93a1' }" />{{ c.elem }}
                </span>
                <span v-if="c.gameLabel" class="mi-role__tag mi-role__tag--mute">{{ c.gameLabel }}</span>
                <span v-if="c.custom" class="mi-role__tag mi-role__tag--custom">自定义</span>
              </span>
              <span v-if="c.count" class="mi-role__count">{{ c.count }}</span>
            </button>
          </div>
          <GEmpty
            v-else
            title="没有匹配的角色"
            desc="换个筛选条件，或点右上角「自定义目录」新建一个角色文件夹"
            height="220px"
          />
        </div>

        <!-- 右：选中角色的图片 -->
        <div class="mi-main g-card">
          <div class="gm-panel__head">
            <div class="gm-panel__title">
              <i><Icon :icon="$gm('image')" :size="13" /></i>
              {{ curName ? `${curName} · ${label}` : '未选择角色' }}
              <span v-if="curMeta" class="gm-panel__extra" style="margin-left: 8px">{{ curMeta }}</span>
            </div>
            <div class="mi-main__tools">
              <Button size="small" :disabled="!curName" @click="askCharRename">
                <Icon :icon="$gm('edit')" :size="13" style="margin-right: 4px" />
                重命名目录
              </Button>
              <Button size="small" :disabled="!curName" :loading="uploading" @click="pickFiles">
                <Icon :icon="$gm('upload')" :size="13" style="margin-right: 4px" />
                上传图片
              </Button>
              <input ref="fileRef" type="file" :accept="accept" multiple style="display: none" @change="onFiles" />
              <Button size="small" :disabled="!curName" @click="loadList">
                <Icon :icon="$gm('refresh')" :size="13" style="margin-right: 4px" />
                刷新
              </Button>
            </div>
          </div>

          <div class="mi-main__dir" :title="KIND_DIR[kind]">
            <Icon :icon="$gm('folder')" :size="12" style="margin-right: 5px" />
            {{ KIND_DIR[kind] }}
          </div>

          <div v-if="curName && imgs.length" class="mi-grid">
            <div v-for="im in imgs" :key="im.rel" class="mi-card">
              <img class="mi-card__img" :src="imgUrl(im.rel)" loading="lazy" @click="preview = im" />
              <div class="mi-card__meta">
                <span class="mi-card__name" :title="im.name">{{ im.name }}</span>
                <span class="mi-card__size">{{ fmtSize(im.size) }}</span>
              </div>
              <button class="mi-card__ren" type="button" title="重命名（可改后缀）" @click="askFileRename(im)">
                <Icon :icon="$gm('edit')" :size="12" />
              </button>
              <button class="mi-card__del" type="button" title="删除" @click="askRemove(im)">
                <Icon :icon="$gm('trash')" :size="12" />
              </button>
            </div>
          </div>
          <GEmpty
            v-else
            :title="curName ? '该角色还没有图片' : '请在左侧选择一个角色'"
            :desc="curName ? KIND_HINT[kind] : '角色表来自 miao-plugin 的官方角色库，也可以点左上角「自定义目录」新建'"
            height="260px"
          >
            <Button v-if="curName" size="small" type="primary" :loading="uploading" @click="pickFiles">
              上传图片
            </Button>
          </GEmpty>
        </div>
      </section>

      <!-- ============================ 大图预览 ============================ -->
      <GModal :visible="!!preview" :title="preview?.name || ''" size="lg" @close="preview = null">
        <div class="mi-preview">
          <img v-if="preview" :src="imgUrl(preview.rel)" />
        </div>
      </GModal>

      <!-- ============================ 删除确认 ============================ -->
      <GConfirmModal
        :visible="removeModal.visible"
        title="删除图片"
        :content="removeModal.file"
        hint="会先移入 temp/guoba-trash 回收站，可手工找回"
        danger
        :loading="removeModal.loading"
        ok-text="移入回收站"
        @ok="doRemove"
        @cancel="removeModal.visible = false"
      />

      <!-- ============================ 新建 / 重命名角色目录 ============================ -->
      <GModal :visible="charRen.visible" :title="charRen.isNew ? '新建角色目录' : '重命名角色目录'" :width="440" @close="charRen.visible = false">
        <div class="mi-form">
          <div class="mi-form__label">{{ charRen.isNew ? '角色名' : '原目录' }}</div>
          <div v-if="!charRen.isNew" class="mi-form__mono">{{ charRen.from }}</div>
          <div class="mi-form__label">{{ charRen.isNew ? '' : '新名字' }}</div>
          <GInput v-model="charRen.to" size="sm" placeholder="输入角色名" @press-enter="doCharRename" />
          <div class="mi-form__hint">
            {{
              charRen.isNew
                ? `会先建好目录，之后可直接往里复制图片；落盘位置 ${KIND_DIR[kind]}`
                : '目录整体改名，目录下所有分类的图片一起移动'
            }}
          </div>
        </div>
        <template #footer>
          <Button @click="charRen.visible = false">取消</Button>
          <Button type="primary" :loading="charRen.loading" @click="doCharRename">确定</Button>
        </template>
      </GModal>

      <!-- ============================ 重命名图片 ============================ -->
      <GModal :visible="fileRen.visible" title="重命名图片" :width="440" @close="fileRen.visible = false">
        <div class="mi-form">
          <div class="mi-form__label">原文件名</div>
          <div class="mi-form__mono">{{ fileRen.from }}</div>
          <div class="mi-form__label">新文件名（含扩展名）</div>
          <GInput v-model="fileRen.to" size="sm" placeholder="如 01.webp / 芙宁娜.png" @press-enter="doFileRename" />
          <div class="mi-form__hint">可改后缀，{{ label }}支持：{{ extHint }}；不能与现有文件重名</div>
        </div>
        <template #footer>
          <Button @click="fileRen.visible = false">取消</Button>
          <Button type="primary" :loading="fileRen.loading" @click="doFileRename">确定</Button>
        </template>
      </GModal>
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref } from 'vue';
  import { Button, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import { Icon } from '/@/components/Icon';
  import GModal from '../_shared/dialog/GModal.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import GInput from '../_shared/form/GInput.vue';
  import GSearch from '../_shared/form/GSearch.vue';
  import GSegmented from '../_shared/form/GSegmented.vue';
  import type { MiaoCatalogChar, MiaoImgItem } from './api';
  import { imgUrl, miaoImgApi } from './api';

  defineOptions({ name: 'MiaoImg' });

  const kinds = [
    { key: 'profile', label: '面板图' },
    { key: 'art', label: '立绘' },
    { key: 'character', label: '写真' },
    { key: 'se', label: '小清新' },
  ];
  /** 四类图库各自的落盘目录（相对 miao-plugin/resources），列表互不干扰 */
  const KIND_DIR: Record<string, string> = {
    profile: 'profile/normal-character/<角色>/',
    art: 'character-img/<角色>/',
    character: 'character-img/<角色>/upload/',
    se: 'character-img/<角色>/se/',
  };
  const KIND_HINT: Record<string, string> = {
    profile: '面板图落盘 profile/normal-character/角色名/，支持 png / jpg / webp（建议竖版）',
    art: '立绘落盘 character-img/角色名/ 根层（卡面随机图库，01..04.webp），支持 png / webp',
    se: '小清新落盘 character-img/角色名/se/，支持 png / jpg / webp / gif',
    character: '写真（自传图）落盘 character-img/角色名/upload/，聊天 #上传xx图片 会落到这里',
  };
  /** 后端 MiaoImgService kindsMap 的扩展名白名单 */
  const KIND_EXTS: Record<string, string> = {
    profile: 'image/png,image/jpeg,image/webp',
    art: 'image/png,image/webp',
    character: 'image/png,image/jpeg,image/webp,image/gif',
    se: 'image/png,image/jpeg,image/webp,image/gif',
  };

  const kind = ref('profile');
  const label = computed(() => kinds.find((k) => k.key === kind.value)?.label || '');
  const kindOptions = computed(() => kinds.map((k) => ({ value: k.key, label: k.label })));
  const accept = computed(() => KIND_EXTS[kind.value] || KIND_EXTS.character);
  const extHint = computed(() =>
    (KIND_EXTS[kind.value] || KIND_EXTS.character)
      .split(',')
      .map((s) => s.replace('image/', '').replace('jpeg', 'jpg'))
      .join(' / '),
  );

  const catalog = ref<MiaoCatalogChar[]>([]);
  const stats = reactive({ gs: 0, sr: 0, custom: 0, total: 0, withImages: 0 });
  const loadingCatalog = ref(false);

  const filterStar = ref<string>('all');
  const filterElem = ref<string>('all');
  const filterGame = ref<string>('all');
  const keyword = ref('');

  const curName = ref('');
  const imgs = ref<MiaoImgItem[]>([]);
  const preview = ref<MiaoImgItem | null>(null);
  const uploading = ref(false);
  const fileRef = ref<HTMLInputElement | null>(null);

  function noop() {}

  /** 属性配色（色点用）：冰蓝 / 火橙 / 水青 / 草绿 / 雷紫 / 风青 / 岩金 / 量子靛 / 虚无粉 / 物理灰 */
  const ELEM_COLOR: Record<string, string> = {
    冰: '#5aa9e6',
    火: '#e2725b',
    水: '#4aa8c7',
    草: '#6cab5e',
    雷: '#9b7ae0',
    风: '#57bfae',
    岩: '#c2a15c',
    量子: '#7d8ce0',
    虚无: '#c07ad0',
    物理: '#94a0ad',
    多属性: '#a9b2be',
    爆破: '#d08a4a',
  };

  function fmtSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  /* ------------------------- 角色表 + 筛选 ------------------------- */

  async function loadCatalog(showTip = false) {
    loadingCatalog.value = true;
    try {
      const res = await miaoImgApi.catalog(kind.value);
      catalog.value = res?.list || [];
      Object.assign(stats, res?.stats || {});
      if (showTip) message.success('角色表已刷新');
      // 默认选中第一个有图的角色：右栏不至于一进来就是空的
      if (!curName.value) {
        const first = catalog.value.find((c) => c.count > 0);
        if (first) await pickChar(first.name);
      }
    } catch (e: any) {
      message.error(e?.message || '加载角色表失败');
    } finally {
      loadingCatalog.value = false;
    }
  }

  /** 稀有度选项（只有实际存在的星级才出现） */
  const starOptions = computed(() => {
    const set = new Set<number>();
    for (const c of catalog.value) if (c.star) set.add(c.star);
    const opts = [{ value: 'all', label: '全部' }];
    for (const s of [...set].sort((a, b) => b - a)) opts.push({ value: String(s), label: `${s} 星` });
    return opts;
  });

  /** 属性选项（带各属性的角色数） */
  const elemOptions = computed(() => {
    const cnt = new Map<string, number>();
    for (const c of catalog.value) {
      if (!c.elem) continue;
      cnt.set(c.elem, (cnt.get(c.elem) || 0) + 1);
    }
    const opts = [{ value: 'all', label: '全部' }];
    for (const [name, n] of [...cnt.entries()].sort((a, b) => b[1] - a[1])) {
      opts.push({ value: name, label: name, count: n });
    }
    return opts;
  });

  const gameOptions = computed(() => {
    const opts = [{ value: 'all', label: '全部' }];
    if (stats.gs) opts.push({ value: 'gs', label: '原神', count: stats.gs });
    if (stats.sr) opts.push({ value: 'sr', label: '星铁', count: stats.sr });
    if (stats.custom) opts.push({ value: 'custom', label: '自定义', count: stats.custom });
    return opts;
  });

  /** 筛选后的角色列表 */
  const filtered = computed(() => {
    const kw = keyword.value.trim().toLowerCase();
    return catalog.value.filter((c) => {
      if (filterStar.value !== 'all' && String(c.star) !== filterStar.value) return false;
      if (filterElem.value !== 'all' && c.elem !== filterElem.value) return false;
      if (filterGame.value === 'custom') {
        if (!c.custom) return false;
      } else if (filterGame.value !== 'all' && c.game !== filterGame.value) {
        return false;
      }
      if (kw && !c.name.toLowerCase().includes(kw)) return false;
      return true;
    });
  });

  const withImagesCount = computed(() => filtered.value.filter((c) => c.count > 0).length);

  /** 当前选中角色的档案摘要（星级 · 属性 · 游戏） */
  const curMeta = computed(() => {
    const c = catalog.value.find((x) => x.name === curName.value);
    if (!c) return '';
    const parts: string[] = [];
    if (c.star) parts.push(`${c.star} 星`);
    if (c.elem) parts.push(c.elem);
    if (c.gameLabel) parts.push(c.gameLabel);
    if (c.custom) parts.push('自定义目录');
    return parts.join(' · ');
  });

  function onStarChange(v: string | number) {
    filterStar.value = String(v);
  }
  function onGameChange(v: string | number) {
    filterGame.value = String(v);
  }

  /* ------------------------- 选角 + 图片列表 ------------------------- */

  async function switchKind(k: string | number) {
    const key = String(k);
    if (kind.value === key) return;
    kind.value = key;
    curName.value = '';
    imgs.value = [];
    filterStar.value = 'all';
    filterElem.value = 'all';
    filterGame.value = 'all';
    keyword.value = '';
    await loadCatalog();
  }
  async function pickChar(name: string) {
    curName.value = name;
    await loadList().catch((e) => message.error(e?.message || '加载失败'));
  }

  async function loadList() {
    if (!curName.value) return;
    const res = await miaoImgApi.list(kind.value, curName.value);
    imgs.value = res?.list || [];
    // 同步角色表里的计数
    const hit = catalog.value.find((c) => c.name === curName.value);
    if (hit) hit.count = imgs.value.length;
  }

  function pickFiles() {
    fileRef.value?.click();
  }

  async function onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input?.files || []);
    input.value = '';
    if (!files.length || !curName.value) return;
    uploading.value = true;
    try {
      const res = await miaoImgApi.upload(kind.value, curName.value, files);
      const ok = res?.count || 0;
      const failed = res?.failed || [];
      if (ok) message.success(`已上传 ${ok} 张${failed.length ? `，${failed.length} 张失败` : ''}`);
      for (const f of failed) message.warning(`${f.file}：${f.reason}`);
      await loadList();
      await loadCatalog();
    } catch (e: any) {
      message.error(e?.message || '上传失败');
    } finally {
      uploading.value = false;
    }
  }

  const removeModal = reactive({ visible: false, loading: false, file: '' });

  /* ---------------- 新建 / 重命名：角色目录 ---------------- */
  const charRen = reactive({ visible: false, loading: false, isNew: false, from: '', to: '' });

  function openNewChar() {
    charRen.isNew = true;
    charRen.from = '';
    charRen.to = '';
    charRen.loading = false;
    charRen.visible = true;
  }

  function askCharRename() {
    if (!curName.value) return;
    charRen.isNew = false;
    charRen.from = curName.value;
    charRen.to = curName.value;
    charRen.loading = false;
    charRen.visible = true;
  }

  async function doCharRename() {
    const to = charRen.to.trim();
    if (!to) {
      message.warning('输入角色名');
      return;
    }
    charRen.loading = true;
    try {
      if (charRen.isNew) {
        // 先在磁盘上真正建目录（幂等）——之后可直接往该目录手动复制图片
        const res = await miaoImgApi.mkdir(kind.value, to);
        if (res?.existed) message.info(`目录已存在，直接选中「${to}」`);
        else message.success(`已创建目录：${res?.dir || to}`);
        charRen.visible = false;
        await loadCatalog();
        await pickChar(to);
        if (!imgs.value.length) {
          message.info(`已选中「${to}」，点右上角「上传图片」，或把图片文件直接复制进目录`);
        }
        return;
      }
      if (to === charRen.from) {
        charRen.visible = false;
        return;
      }
      await miaoImgApi.renameDir(kind.value, charRen.from, to);
      message.success(`已重命名为「${to}」`);
      charRen.visible = false;
      if (curName.value === charRen.from) curName.value = to;
      await loadCatalog();
      if (curName.value === to) await loadList();
    } catch (e: any) {
      message.error(e?.message || (charRen.isNew ? '创建目录失败' : '重命名失败'));
    } finally {
      charRen.loading = false;
    }
  }

  /* ---------------- 重命名：图片（可改后缀） ---------------- */
  const fileRen = reactive({ visible: false, loading: false, from: '', to: '' });

  function askFileRename(im: MiaoImgItem) {
    fileRen.from = im.name;
    fileRen.to = im.name;
    fileRen.loading = false;
    fileRen.visible = true;
  }

  async function doFileRename() {
    const to = fileRen.to.trim();
    if (!to || to === fileRen.from) {
      fileRen.visible = false;
      return;
    }
    fileRen.loading = true;
    try {
      await miaoImgApi.rename(kind.value, curName.value, fileRen.from, to);
      message.success(`已重命名为「${to}」`);
      fileRen.visible = false;
      preview.value = null;
      await loadList();
    } catch (e: any) {
      message.error(e?.message || '重命名失败');
    } finally {
      fileRen.loading = false;
    }
  }

  function askRemove(im: MiaoImgItem) {
    removeModal.file = im.name;
    removeModal.loading = false;
    (removeModal as any)._rel = im.rel;
    removeModal.visible = true;
  }

  async function doRemove() {
    if (!curName.value) return;
    removeModal.loading = true;
    try {
      const rel = (removeModal as any)._rel as string;
      const file = rel.slice(rel.lastIndexOf('/') + 1);
      await miaoImgApi.remove(kind.value, curName.value, file);
      message.success('已移入回收站');
      removeModal.visible = false;
      preview.value = null;
      await loadList();
      await loadCatalog();
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    } finally {
      removeModal.loading = false;
    }
  }

  onMounted(() => loadCatalog());
</script>

<style lang="less" scoped>
  /* ---------------- 筛选行 ---------------- */
  .mi-filters {
    margin-top: 12px;
    padding: 12px 16px;

    &__row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
      padding: 6px 0;

      &--last {
        border-top: 1px solid var(--g-card-border);
        margin-top: 4px;
        padding-top: 10px;
      }
    }
    &__label {
      flex-shrink: 0;
      width: 42px;
      font-size: 12px;
      color: var(--g-text-mute);
    }
    &__elems {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
      flex: 1;
      min-width: 0;
    }
    &__count {
      margin-left: auto;
      font-size: 12px;
      color: var(--g-text-sub);
    }
  }

  .mi-elem {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 3px 10px;
    border: 1px solid var(--g-card-border);
    border-radius: 999px;
    font-size: 12px;
    line-height: 18px;
    color: var(--g-text-sub);
    background: transparent;
    cursor: pointer;
    transition: all 0.15s;

    &:hover {
      border-color: var(--g-card-border-strong);
      color: var(--g-text);
    }
    &.is-active {
      background: var(--g-chip-bg);
      border-color: var(--g-blue);
      color: var(--g-blue);
      font-weight: 600;
    }
    &__n {
      font-size: 10.5px;
      opacity: 0.65;
    }
  }

  .mi-elem__dot {
    width: 5px;
    height: 5px;
    flex-shrink: 0;
    border-radius: 50%;
  }

  /* ---------------- 主体两栏 ---------------- */
  .mi-body {
    display: grid;
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: 12px;
    margin-top: 12px;
    align-items: start;
  }

  .mi-roles {
    padding: 14px 16px;
  }

  .mi-rolegrid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
    gap: 8px;
    max-height: calc(100vh - 380px);
    overflow: auto;
    margin-top: 12px;
    padding-right: 4px;
  }

  .mi-role {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    background: var(--g-card-bg-soft);
    cursor: pointer;
    text-align: left;
    transition: all 0.16s;

    &:hover {
      border-color: var(--g-card-border-strong);
      transform: translateY(-1px);
    }
    &.is-active {
      border-color: var(--g-blue);
      background: var(--g-chip-bg);
      box-shadow: inset 0 0 0 1px var(--g-blue);
    }
    &__name {
      overflow: hidden;
      font-size: 13px;
      font-weight: 600;
      color: var(--g-text);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &__tags {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
      padding-right: 22px;
    }
    /* 标签统一用「文字 + 色点」，靠色点区分属性，文字本身走中性色保证浅色主题下也读得清 */
    &__tag {
      display: inline-flex;
      gap: 3px;
      align-items: center;
      padding: 0 5px;
      border-radius: 4px;
      font-size: 10px;
      line-height: 15px;
      color: var(--g-text-sub);
      background: var(--g-chip-bg);

      &--mute {
        color: var(--g-text-mute);
      }
      &--custom {
        color: var(--g-violet);
      }
    }
    &__dot {
      width: 5px;
      height: 5px;
      flex-shrink: 0;
      border-radius: 50%;
    }
    &__count {
      position: absolute;
      top: 6px;
      right: 8px;
      min-width: 17px;
      padding: 0 5px;
      border-radius: 9px;
      font-size: 10.5px;
      line-height: 17px;
      text-align: center;
      color: #fff;
      background: var(--g-blue);
    }
  }

  .mi-main {
    padding: 14px 16px;

    &__tools {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }
    &__dir {
      display: flex;
      gap: 4px;
      align-items: center;
      margin-top: 10px;
      padding: 5px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      color: var(--g-text-mute);
      background: var(--g-chip-bg);
      word-break: break-all;
    }
  }

  /* ---------------- 图片网格 ---------------- */
  .mi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .mi-card {
    position: relative;
    overflow: hidden;
    border: 1px solid var(--g-card-border);
    border-radius: 10px;
    background: var(--g-card-bg-soft);

    &__img {
      display: block;
      width: 100%;
      height: 170px;
      object-fit: cover;
      cursor: zoom-in;
      background: var(--g-chip-bg);
    }
    &__meta {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      padding: 5px 8px;
      font-size: 11px;
      color: var(--g-text-mute);
    }
    &__name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &__del,
    &__ren {
      position: absolute;
      top: 6px;
      display: none;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      padding: 0;
      border: none;
      border-radius: 50%;
      color: #fff;
      cursor: pointer;
    }
    &__del {
      right: 6px;
      background: rgb(224 86 86 / 92%);
    }
    &__ren {
      right: 32px;
      background: rgb(15 23 42 / 62%);
    }
    &:hover .mi-card__del,
    &:hover .mi-card__ren {
      display: flex;
    }
  }

  .mi-form {
    display: flex;
    flex-direction: column;
    gap: 6px;

    &__label {
      margin-top: 6px;
      font-size: 12px;
      color: var(--g-text-mute);
    }
    &__mono {
      padding: 6px 10px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 12px;
      color: var(--g-text);
      word-break: break-all;
      background: var(--g-chip-bg);
    }
    &__hint {
      margin-top: 4px;
      font-size: 11px;
      color: var(--g-text-mute);
    }
  }

  .mi-preview {
    text-align: center;

    img {
      max-width: 100%;
      max-height: 70vh;
      border-radius: 8px;
    }
  }

  /* ---------------- 移动端：两栏纵向堆叠 ---------------- */
  @media (max-width: 900px) {
    .mi-body {
      grid-template-columns: minmax(0, 1fr);
    }

    .mi-rolegrid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
      max-height: none;
      overflow: visible;
    }

    .mi-filters__count {
      width: 100%;
      margin-left: 0;
    }

    .mi-main__tools {
      width: 100%;
    }

    .mi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .mi-card__img {
      height: 140px;
    }

    /* 触摸设备没有 hover，重命名 / 删除常显 */
    .mi-card__del,
    .mi-card__ren {
      display: flex;
    }
  }
</style>
