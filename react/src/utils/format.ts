export function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function joinSitePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}
