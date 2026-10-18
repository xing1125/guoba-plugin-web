<script lang="tsx">
  import type { PropType } from 'vue';
  import { computed, defineComponent, ref, unref } from 'vue';
  import { Button } from 'ant-design-vue';
  import { ExceptionEnum } from '/@/enums/exceptionEnum';
  import notDataSvg from '/@/assets/svg/no-data.svg';
  import netWorkSvg from '/@/assets/svg/net-error.svg';
  import { useRoute } from 'vue-router';
  import { useI18n } from '/@/hooks/web/useI18n';
  import { useGo, useRedo } from '/@/hooks/web/usePage';
  import { PageEnum } from '/@/enums/pageEnum';

  interface MapValue {
    /** 大号状态码，仅 403 / 404 / 500 有 */
    code?: string;
    /** 中文标题 */
    heading: string;
    subTitle: string;
    btnText?: string;
    icon?: string;
    handler?: Fn;
  }

  export default defineComponent({
    name: 'ErrorPage',
    props: {
      // 状态码
      status: {
        type: Number as PropType<number>,
        default: ExceptionEnum.PAGE_NOT_FOUND,
      },

      title: {
        type: String as PropType<string>,
        default: '',
      },

      subTitle: {
        type: String as PropType<string>,
        default: '',
      },

      btnText: {
        type: String as PropType<string>,
        default: '',
      },

      goPath: {
        type: String as PropType<string>,
        default: '',
      },

      full: {
        type: Boolean as PropType<boolean>,
        default: false,
      },
    },
    setup(props) {
      const statusMapRef = ref(new Map<string | number, MapValue>());

      const { query } = useRoute();
      const go = useGo();
      const redo = useRedo();
      const { t } = useI18n();

      const getStatus = computed(() => {
        const { status: routeStatus } = query;
        const { status } = props;
        return Number(routeStatus) || status;
      });

      const getMapValue = computed((): MapValue => {
        return unref(statusMapRef).get(unref(getStatus)) as MapValue;
      });

      const backLoginI18n = t('sys.exception.backLogin');
      const backHomeI18n = t('sys.exception.backHome');

      const getBtnText = (def: string) => (props.btnText ? props.btnText : def);
      const handleGoTo = (fn) => {
        if (props.goPath) {
          return go(props.goPath);
        }
        return fn();
      };

      unref(statusMapRef).set(ExceptionEnum.PAGE_NOT_ACCESS, {
        code: '403',
        heading: '无权访问此页面',
        subTitle: t('sys.exception.subTitle403'),
        btnText: getBtnText(props.full ? backLoginI18n : backHomeI18n),
        handler: () => handleGoTo(() => (props.full ? go(PageEnum.BASE_LOGIN) : go())),
      });

      unref(statusMapRef).set(ExceptionEnum.PAGE_NOT_FOUND, {
        code: '404',
        heading: '页面不存在',
        subTitle: t('sys.exception.subTitle404'),
        btnText: getBtnText(props.full ? backLoginI18n : backHomeI18n),
        handler: () => handleGoTo(() => (props.full ? go(PageEnum.BASE_LOGIN) : go())),
      });

      unref(statusMapRef).set(ExceptionEnum.ERROR, {
        code: '500',
        heading: '服务出了点问题',
        subTitle: t('sys.exception.subTitle500'),
        btnText: getBtnText(backHomeI18n),
        handler: () => handleGoTo(() => go()),
      });

      unref(statusMapRef).set(ExceptionEnum.PAGE_NOT_DATA, {
        heading: t('sys.exception.noDataTitle'),
        subTitle: '',
        btnText: getBtnText(t('common.redo')),
        handler: () => handleGoTo(() => redo()),
        icon: notDataSvg,
      });

      unref(statusMapRef).set(ExceptionEnum.NET_WORK_ERROR, {
        heading: t('sys.exception.networkErrorTitle'),
        subTitle: t('sys.exception.networkErrorSubTitle'),
        btnText: t('common.redo'),
        handler: () => redo(),
        icon: netWorkSvg,
      });

      return () => {
        const { code, heading, subTitle, btnText, icon, handler } = unref(getMapValue) || {};
        return (
          <div class="db-exc">
            <div class="db-exc__glow" />
            <div class="db-exc__card">
              {icon ? (
                <img class="db-exc__img" src={icon} alt="" />
              ) : (
                <div class="db-exc__code">
                  <span>{code}</span>
                </div>
              )}

              <h2 class="db-exc__title">{props.title || heading}</h2>
              {(props.subTitle || subTitle) && <p class="db-exc__sub">{props.subTitle || subTitle}</p>}

              {btnText && (
                <div class="db-exc__ops">
                  <Button type="primary" size="large" onClick={handler}>
                    {() => btnText}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      };
    },
  });
</script>
<style lang="less">
  .db-exc {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: calc(100vh - 128px);
    padding: 40px 24px;
    overflow: hidden;
    color: var(--g-text);
  }

  /* 柔光：覆盖内容区中部，避免只有上半截发亮造成断层感 */
  .db-exc__glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 880px;
    height: 620px;
    pointer-events: none;
    content: '';
    background: radial-gradient(closest-side, rgb(98 168 234 / 15%), transparent 74%);
    transform: translate(-50%, -50%);
  }

  html[data-theme='dark'] .db-exc__glow {
    background: radial-gradient(closest-side, rgb(23 74 110 / 55%), transparent 72%);
  }

  .db-exc__card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 520px;
    padding: 44px 40px 38px;
    text-align: center;
    background: var(--g-card-bg);
    border: 1px solid var(--g-card-border);
    border-radius: 20px;
    box-shadow: var(--g-card-shadow);
  }

  .db-exc__code {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 72px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -3px;

    /* 渐变字：主色 → 冷金 */
    background: linear-gradient(135deg, var(--g-blue), var(--g-violet) 55%, var(--g-amber));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .db-exc__img {
    max-width: 280px;
    max-height: 200px;
    margin-bottom: 4px;
  }

  .db-exc__title {
    margin: 20px 0 0;
    font-size: 20px;
    font-weight: 650;
    line-height: 1.4;
    color: var(--g-text);
    letter-spacing: 0.2px;
  }

  .db-exc__sub {
    max-width: 400px;
    margin: 10px 0 0;
    font-size: 13px;
    line-height: 1.75;
    color: var(--g-text-sub);
  }

  .db-exc__ops {
    display: flex;
    gap: 10px;
    justify-content: center;
    margin-top: 26px;

    .ant-btn {
      min-width: 132px;
      height: 38px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 10px;
    }
  }

  @media (max-width: 560px) {
    .db-exc__card {
      padding: 34px 24px 30px;
      border-radius: 16px;
    }

    .db-exc__code {
      font-size: 56px;
    }
  }
</style>
