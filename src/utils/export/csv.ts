/**
 * 通用 CSV 导出（前端生成，不依赖后端）
 *
 * 约定：
 *  - 带 UTF-8 BOM，避免 Excel 打开中文乱码
 *  - 值含逗号/引号/换行时按 RFC4180 加引号转义
 *  - 文件名默认带时间戳
 */

export interface CsvColumn<T = any> {
  /** 表头 */
  title: string;
  /** 取值字段名，或自定义取值函数 */
  key?: string;
  /** 自定义格式化（优先于 key） */
  format?: (row: T) => string | number | null | undefined;
}

function cell(v: unknown): string {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/[",\r\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv<T = any>(columns: CsvColumn<T>[], rows: T[]): string {
  const head = columns.map((c) => cell(c.title)).join(',');
  const body = (rows || []).map((row) =>
    columns
      .map((c) => {
        const v = c.format ? c.format(row) : (row as any)?.[c.key as string];
        return cell(v);
      })
      .join(','),
  );
  return [head, ...body].join('\r\n');
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

/** 导出并触发下载 */
export function downloadCsv<T = any>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  const csv = toCsv(columns, rows);
  const name = `${filename || 'export'}_${stamp()}.csv`;
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
