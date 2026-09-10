const prefetchedUrls = new Set<string>();

export function prefetchDocument(url: string): void {
  if (prefetchedUrls.has(url) || url.startsWith("#") || url.startsWith("tel:") || url.startsWith("https://wa.me")) {
    return;
  }

  prefetchedUrls.add(url);
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = url;
  document.head.appendChild(link);
}
