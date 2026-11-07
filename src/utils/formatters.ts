export function formatCurrency(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(val) + ' đ';
}

export function formatNumber(val: number | null | undefined, decimals = 0): string {
  if (val === null || val === undefined) return '-';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(val);
}

export function formatPercent(val: number | null | undefined): string {
  if (val === null || val === undefined) return '-';
  return `${val.toFixed(2)}%`;
}

export function formatValueByDVT(val: number | null | undefined, dvt: string): string {
  if (val === null || val === undefined) return '-';
  if (dvt === 'Đồng') return formatCurrency(val);
  if (dvt === '%') return formatPercent(val);
  if (dvt === 'Ngày') return formatNumber(val, 2);
  return formatNumber(val, 0);
}
