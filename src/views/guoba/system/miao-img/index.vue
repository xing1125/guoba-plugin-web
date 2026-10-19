<template>
  <PageWrapper title="">
    <div class="mi g-page" :class="{ 'is-dark': isDark }">
      <!-- ============================ 页头 ============================ -->
      <section class="mi-hero">
        <div class="mi-hero__main">
          <div class="mi-hero__eyebrow">MIAO GALLERY</div>
          <div class="mi-hero__title">喵喵面板图</div>
          <div class="mi-hero__desc"> 在后台上传 / 管理面板图、立绘与写真，落盘目录与聊天指令完全一致 </div>
        </div>
        <div class="mi-hero__side">
          <span class="gm-seg">
            <span v-for="k in kinds" :key="k.key" class="gm-seg__item" :class="{ 'is-active': kind === k.key }" @click="switchKind(k.key)">
              {{ k.label }}
            </span>
          </span>
        </div>
      </section>

      <div class="mi-body">
        <!-- ============================ 左侧：角色 ============================ -->
        <aside class="mi-side">
          <div class="mi-side__head">
            <span>角色</span>
            <span class="mi-side__hint">{{ chars.length }} 个有图</span>
          </div>
          <div class="mi-side__dir" :title="KIND_DIR[kind]">目录：{{ KIND_DIR[kind] }}</div>
          <div class="mi-side__new">
            <Input v-model:value="newChar" size="small" :placeholder="kind === 'profile' ? '输入角色名，如 芙宁娜' : '输入角色名'" @pressEnter="pickNewChar" />
            <Button size="small" type="primary" @click="pickNewChar">添加</Button>
            <div v-if="char" class="mi-side__cur">当前：{{ char }}</div>
          </div>
          <div class="mi-side__list">
            <div v-for="c in chars" :key="c.name" class="mi-char" :class="{ 'is-active': char === c.name }" @click="pickChar(c.name)">
              <span class="mi-char__name">{{ c.name }}</span>
              <span class="mi-char__count">{{ c.count }}</span>
            </div>
            <div v-if="!chars.length" class="mi-side__empty">还没有图片，先在上方输入角色名</div>
          </div>
        </aside>

        <!-- ============================ 右侧：图片 ============================ -->
        <main class="mi-main">
          <div class="mi-main__bar">
            <span class="mi-main__title">{{ char ? `${char} · ${label}` : '未选择角色' }}</span>
            <span class="mi-main__tools">
              <Button size="small" :disabled="!char" :loading="uploading" @click="pickFiles"> 上传图片 </Button>
              <input ref="fileRef" type="file" :accept="accept" multiple style="display: none" @change="onFiles" />
              <Button size="small" :disabled="!char" @click="loadList">刷新</Button>
            </span>
          </div>

          <div v-if="char && imgs.length" class="mi-grid">
            <div v-for="im in imgs" :key="im.rel" class="mi-card">
              <img class="mi-card__img" :src="imgUrl(im.rel)" loading="lazy" @click="preview = im" />
              <div class="mi-card__meta">
                <span class="mi-card__name" :title="im.name">{{ im.name }}</span>
                <span class="mi-card__size">{{ fmtSize(im.size) }}</span>
              </div>
              <button class="mi-card__del" type="button" title="删除" @click="askRemove(im)">×</button>
            </div>
          </div>
          <div v-else class="mi-main__empty">
            <div class="mi-main__empty-main">{{ char ? '该角色还没有图片' : '在左侧选择或添加角色' }}</div>
            <div class="mi-main__empty-sub">
              {{
                kind === 'profile'
                  ? '面板图落盘 profile/normal-character/<角色>/，支持 png / jpg / webp（建议竖版）'
                  : kind === 'art'
                    ? '立绘落盘 character-img/<角色>/ 根层（卡面随机图库，01..04.webp），支持 png / webp'
                    : kind === 'se'
                      ? '小清新落盘 character-img/<角色>/se/，支持 png / jpg / webp / gif'
                      : '写真（自传图）落盘 character-img/<角色>/upload/，聊天 #上传xx图片 会落到这里'
              }}
            </div>
          </div>
        </main>
      </div>

      <!-- ============================ 大图预览 ============================ -->
      <GModal :visible="!!preview" :title="preview?.name || ''" :width="720" @close="preview = null">
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
    </div>
  </PageWrapper>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, unref } from 'vue';
  import { Button, Input, message } from 'ant-design-vue';
  import { PageWrapper } from '/@/components/Page';
  import GModal from '../_shared/dialog/GModal.vue';
  import GConfirmModal from '../_shared/dialog/GConfirmModal.vue';
  import { useRootSetting } from '/@/hooks/setting/useRootSetting';
  import { ThemeEnum } from '/@/enums/appEnum';
  import type { MiaoImgItem } from './api';
  import { imgUrl, miaoImgApi } from './api';

  defineOptions({ name: 'MiaoImg' });

  const { getDarkMode } = useRootSetting();
  const isDark = computed(() => unref(getDarkMode) === ThemeEnum.DARK);

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
  const label = computed(() => kinds.find((k) => k.key === kind.value)?.label || '');
  /** 后端 MiaoImgService kindsMap 的扩展名白名单 */
  const KIND_EXTS: Record<string, string> = {
    profile: 'image/png,image/jpeg,image/webp',
    art: 'image/png,image/webp',
    character: 'image/png,image/jpeg,image/webp,image/gif',
    se: 'image/png,image/jpeg,image/webp,image/gif',
  };
  const accept = computed(() => KIND_EXTS[kind.value] || KIND_EXTS.character);

  const kind = ref('profile');
  const chars = ref<{ name: string; count: number }[]>([]);
  const char = ref('');
  const newChar = ref('');
  const imgs = ref<MiaoImgItem[]>([]);
  const preview = ref<MiaoImgItem | null>(null);
  const uploading = ref(false);
  const fileRef = ref<HTMLInputElement | null>(null);

  function fmtSize(n: number) {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }

  async function loadChars() {
    const res = await miaoImgApi.characters(kind.value);
    chars.value = res?.list || [];
  }

  async function switchKind(k: string) {
    if (kind.value === k) return;
    kind.value = k;
    char.value = '';
    imgs.value = [];
    chars.value = [];
    newChar.value = '';
    await loadChars().catch((e) => message.error(e?.message || '加载失败'));
  }

  async function pickChar(name: string) {
    char.value = name;
    await loadList().catch((e) => message.error(e?.message || '加载失败'));
  }

  async function pickNewChar() {
    const name = newChar.value.trim();
    if (!name) {
      message.warning('先输入角色名');
      return;
    }
    newChar.value = '';
    char.value = name;
    imgs.value = [];
    // 左侧列表只显示有图角色：新角色立即插入置顶并选中，避免"点了没反应"
    if (!chars.value.some((c) => c.name === name)) {
      chars.value = [{ name, count: 0 }, ...chars.value];
    }
    await loadList().catch((e) => message.error(e?.message || '加载失败'));
    if (!imgs.value.length) {
      message.info(`已选中「${name}」，点右上角「上传图片」即可添加${label.value}`);
    }
  }

  async function loadList() {
    if (!char.value) return;
    const res = await miaoImgApi.list(kind.value, char.value);
    imgs.value = res?.list || [];
    // 同步左侧计数
    const hit = chars.value.find((c) => c.name === char.value);
    if (hit) hit.count = imgs.value.length;
  }

  function pickFiles() {
    fileRef.value?.click();
  }

  async function onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input?.files || []);
    input.value = '';
    if (!files.length || !char.value) return;
    uploading.value = true;
    try {
      const res = await miaoImgApi.upload(kind.value, char.value, files);
      const ok = res?.count || 0;
      const failed = res?.failed || [];
      if (ok) message.success(`已上传 ${ok} 张${failed.length ? `，${failed.length} 张失败` : ''}`);
      for (const f of failed) message.warning(`${f.file}：${f.reason}`);
      await loadList();
      await loadChars();
    } catch (e: any) {
      message.error(e?.message || '上传失败');
    } finally {
      uploading.value = false;
    }
  }

  const removeModal = reactive({ visible: false, loading: false, file: '' });

  function askRemove(im: MiaoImgItem) {
    removeModal.file = im.name;
    removeModal.loading = false;
    (removeModal as any)._rel = im.rel;
    removeModal.visible = true;
  }

  async function doRemove() {
    if (!char.value) return;
    removeModal.loading = true;
    try {
      const rel = (removeModal as any)._rel as string;
      const file = rel.slice(rel.lastIndexOf('/') + 1);
      await miaoImgApi.remove(kind.value, char.value, file);
      message.success('已移入回收站');
      removeModal.visible = false;
      preview.value = null;
      await loadList();
      await loadChars();
    } catch (e: any) {
      message.error(e?.message || '删除失败');
    } finally {
      removeModal.loading = false;
    }
  }

  onMounted(() => loadChars().catch((e) => message.error(e?.message || '加载失败')));
</script>

<style lang="less" scoped>
  .mi {
    --mi-line: rgba(15, 23, 42, 0.1);
    --mi-panel: rgba(255, 255, 255, 0.72);
    --mi-text: #1f2937;
    --mi-text-dim: #6b7280;
    --mi-accent: #2563eb;

    &.is-dark {
      --mi-line: rgba(148, 163, 184, 0.18);
      --mi-panel: rgba(15, 23, 42, 0.55);
      --mi-text: #e5e7eb;
      --mi-text-dim: #94a3b8;
      --mi-accent: #60a5fa;
    }
  }

  .mi-hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    padding: 18px 20px;
    border: 1px solid var(--mi-line);
    border-radius: 14px;
    background: var(--mi-panel);
    backdrop-filter: blur(10px);

    &__eyebrow {
      font-size: 11px;
      letter-spacing: 0.28em;
      color: var(--mi-accent);
      font-weight: 600;
    }
    &__title {
      font-size: 22px;
      font-weight: 700;
      color: var(--mi-text);
      margin-top: 2px;
    }
    &__desc {
      font-size: 12px;
      color: var(--mi-text-dim);
      margin-top: 4px;
    }
  }

  .gm-seg {
    display: inline-flex;
    border: 1px solid var(--mi-line);
    border-radius: 8px;
    overflow: hidden;

    &__item {
      padding: 4px 14px;
      font-size: 12px;
      cursor: pointer;
      color: var(--mi-text-dim);
      transition: all 0.2s;

      &.is-active {
        background: var(--mi-accent);
        color: #fff;
      }
    }
  }

  .mi-body {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .mi-side {
    width: 260px;
    flex-shrink: 0;
    border: 1px solid var(--mi-line);
    border-radius: 12px;
    background: var(--mi-panel);
    backdrop-filter: blur(10px);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 250px);

    &__head {
      display: flex;
      justify-content: space-between;
      padding: 10px 12px;
      border-bottom: 1px solid var(--mi-line);
      font-size: 13px;
      font-weight: 600;
      color: var(--mi-text);
    }
    &__hint {
      font-size: 11px;
      color: var(--mi-text-dim);
      font-weight: 400;
    }
    &__dir {
      overflow: hidden;
      padding: 6px 12px;
      font-size: 10.5px;
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      color: var(--mi-text-dim);
      text-overflow: ellipsis;
      white-space: nowrap;
      background: rgba(127, 127, 127, 0.08);
      border-bottom: 1px solid var(--mi-line);
    }
    &__new {
      display: flex;
      gap: 6px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--mi-line);
      flex-wrap: wrap;

      > .ant-input {
        flex: 1;
        min-width: 0;
      }
    }
    &__cur {
      width: 100%;
      font-size: 11px;
      color: var(--mi-accent);
      margin-top: 2px;
    }
    &__list {
      flex: 1;
      overflow: auto;
      padding: 6px;
    }
    &__empty {
      text-align: center;
      font-size: 12px;
      color: var(--mi-text-dim);
      padding: 20px 8px;
    }
  }

  .mi-char {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: var(--mi-text);
    transition: background 0.15s;

    &:hover {
      background: rgba(37, 99, 235, 0.1);
    }
    &.is-active {
      background: var(--mi-accent);
      color: #fff;

      .mi-char__count {
        color: rgba(255, 255, 255, 0.8);
      }
    }
    &__count {
      font-size: 11px;
      color: var(--mi-text-dim);
    }
  }

  .mi-main {
    flex: 1;
    min-width: 0;
    border: 1px solid var(--mi-line);
    border-radius: 12px;
    background: var(--mi-panel);
    backdrop-filter: blur(10px);

    &__bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      border-bottom: 1px solid var(--mi-line);
    }
    &__title {
      font-size: 13px;
      font-weight: 600;
      color: var(--mi-text);
    }
    &__tools {
      display: flex;
      gap: 6px;
    }
    &__empty {
      padding: 70px 0;
      text-align: center;

      &-main {
        font-size: 14px;
        color: var(--mi-text);
      }
      &-sub {
        font-size: 12px;
        color: var(--mi-text-dim);
        margin-top: 6px;
      }
    }
  }

  .mi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
    padding: 14px;
  }

  .mi-card {
    position: relative;
    border: 1px solid var(--mi-line);
    border-radius: 10px;
    overflow: hidden;
    background: var(--mi-panel);

    &__img {
      width: 100%;
      height: 170px;
      object-fit: cover;
      cursor: zoom-in;
      display: block;
      background: rgba(127, 127, 127, 0.12);
    }
    &__meta {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      padding: 5px 8px;
      font-size: 11px;
      color: var(--mi-text-dim);
    }
    &__name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    &__del {
      position: absolute;
      top: 6px;
      right: 6px;
      width: 22px;
      height: 22px;
      border: none;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.92);
      color: #fff;
      font-size: 14px;
      line-height: 20px;
      cursor: pointer;
      display: none;
    }
    &:hover .mi-card__del {
      display: block;
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
</style>
