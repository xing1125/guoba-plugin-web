/**
 * 统一时间展示
 *
 * 后端大部分接口给的是 ISO UTC 字符串（`2026-10-20T13:41:04.406Z`）。
 * 之前各页面各写一句 `replace('T',' ').slice(5,16)`，等于把 UTC 当本地时间显示，
 * 国内用户看到的「最后校验」会固定差 8 小时。这里统一走 Date 解析 + 本地时区输出。
 *
 * 解析失败就退回原始字符串的裁剪版本，保证不至于显示空。
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** 2026-10-20 21:41 */
export function fmtDateTime(iso?: string | null): string {
  const raw = String(iso || '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.replace('T', ' ').slice(0, 16);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 10-20 21:41（省略年份，表格里省地方） */
export function fmtTimeShort(iso?: string | null): string {
  const s = fmtDateTime(iso);
  return s.length >= 16 ? s.slice(5) : s;
}

/** 3 分钟前 / 2 小时前 / 5 天前；超过 30 天回落到日期 */
export function fmtFromNow(iso?: string | null): string {
  const raw = String(iso || '').trim();
  if (!raw) return '';
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  if (diff < 0) return fmtTimeShort(raw);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day <= 30) return `${day} 天前`;
  return fmtTimeShort(raw);
}

/** 精确 + 相对：「10-20 21:41 · 3 小时前」 */
export function fmtMoment(iso?: string | null): string {
  const t = fmtTimeShort(iso);
  if (!t) return '';
  const rel = fmtFromNow(iso);
  return rel && rel !== t ? `${t} · ${rel}` : t;
}
