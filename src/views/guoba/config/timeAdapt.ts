/**
 * 配置 schema 自适应：说明/占位里写了「HH:mm」的裸 Input 自动换成 TimePicker。
 *
 * 背景：插件 guoba.support.js 里大量 `input(..., '格式 HH:mm。')` 字段，
 * 之前只能手敲文本；这里统一升级为时间选择器（下拉面板快捷选时分）。
 * valueFormat 字符串绑定 —— 表单值仍是 "23:30" 字符串，保存格式不变。
 *
 * 挂两处：/config/tabs（核心配置页）与 /plugin/list（插件配置页）。
 */
const TIME_HINT_RE = /(?:^|[^\w:])HH:mm(?![\w])/;

function adaptOne(s: any) {
  if (!s || s.component !== 'Input' || s.__timeAdapted) return;
  const hint = `${s.desc || ''} ${s.bottomHelpMessage || ''} ${s.placeholder || ''} ${s.label || ''}`;
  if (!TIME_HINT_RE.test(hint) || /HH:mm:ss/.test(hint)) return;
  s.component = 'TimePicker';
  s.componentProps = {
    ...(s.componentProps || {}),
    valueFormat: 'HH:mm',
    format: 'HH:mm',
    allowEmpty: true,
    placeholder: '选择时间',
    style: { width: '160px' },
  };
  s.bottomHelpMessage = String(s.bottomHelpMessage || '').replace(/格式 HH:mm[。.]?\s*/g, '');
  s.desc = String(s.desc || '').replace(/格式 HH:mm[。.]?\s*/g, '');
  s.__timeAdapted = true;
}

/** /config/tabs 结构：tab[] -> cards[] -> schemas[] */
export function adaptTimeSchemasForTabs(tabs: any[]) {
  for (const tab of tabs ?? []) {
    for (const card of tab?.cards ?? []) {
      for (const s of card?.schemas ?? []) adaptOne(s);
    }
  }
  return tabs;
}

/** /plugin/list 结构：plugin[] -> schemas[] */
export function adaptTimeSchemasForPlugins(plugins: any[]) {
  for (const p of plugins ?? []) {
    for (const s of p?.schemas ?? []) adaptOne(s);
  }
  return plugins;
}
