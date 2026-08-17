export type EpubMetadata = {
  title?: string;
  creator?: string;
};

export type EpubTocItem = {
  id?: string;
  href: string;
  label: string;
  subitems?: EpubTocItem[];
};

export type EpubNavigation = {
  toc: EpubTocItem[];
};

export type EpubLocation = {
  start: { cfi: string; href?: string; displayed?: { page: number; total: number } };
  end?: { cfi: string };
};

export type EpubRendition = {
  display: (target?: string) => Promise<void>;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  resize: (width?: number | string, height?: number | string) => void;
  currentLocation: () => EpubLocation;
  clear: () => void;
  destroy: () => void;
  on: {
    (event: "relocated", callback: (value: EpubLocation) => void): void;
    (event: "rendered", callback: () => void): void;
    (event: "selected", callback: (cfi: string, contents: { window?: Window; document?: Document }) => void): void;
  };
  themes: {
    register: (name: string, rules: Record<string, Record<string, string>>) => void;
    select: (name: string) => void;
    fontSize: (size: string) => void;
  };
  manager?: { settings?: { offset?: number }; check?: () => Promise<boolean> };
  annotations: {
    highlight: (cfi: string, data?: Record<string, unknown>, callback?: (() => void) | undefined, className?: string, styles?: Record<string, string>) => void;
    remove: (cfi: string, type: "highlight") => void;
  };
};

export type EpubSearchResult = { cfi: string; excerpt: string };

export type EpubSection = {
  href: string;
  load: (request: (url: string) => Promise<unknown>) => Promise<unknown>;
  find: (query: string) => EpubSearchResult[];
  unload: () => void;
};

export type EpubBook = {
  ready: Promise<void>;
  loaded: {
    metadata: Promise<EpubMetadata>;
    navigation: Promise<EpubNavigation>;
  };
  locations: {
    generate: (chars?: number) => Promise<string[]>;
    percentageFromCfi: (cfi: string) => number;
  };
  coverUrl: () => Promise<string | null>;
  load: (url: string) => Promise<unknown>;
  spine: { spineItems: EpubSection[] };
  renderTo: (element: HTMLElement, options: Record<string, unknown>) => EpubRendition;
  destroy: () => void;
};

declare global {
  interface Window {
    ePub?: (input: ArrayBuffer | string) => EpubBook;
    JSZip?: unknown;
  }
}

let loader: Promise<(input: ArrayBuffer | string) => EpubBook> | null = null;

export function loadEpubEngine(): Promise<(input: ArrayBuffer | string) => EpubBook> {
  if (typeof window === "undefined") return Promise.reject(new Error("EPUB 引擎只能在浏览器中运行"));
  if (window.ePub) return Promise.resolve(window.ePub);
  if (loader) return loader;

  loader = (async () => {
    await loadBrowserScript("jszip", "/vendor/jszip.min.js", () => Boolean(window.JSZip));
    await loadBrowserScript("epubjs", "/vendor/epub.min.js", () => Boolean(window.ePub));
    if (!window.ePub) throw new Error("EPUB 引擎加载失败");
    return window.ePub;
  })();
  return loader;
}

function loadBrowserScript(name: string, src: string, isReady: () => boolean): Promise<void> {
  if (isReady()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const selector = `script[data-reader-engine="${name}"]`;
    const existing = document.querySelector<HTMLScriptElement>(selector);
    const script = existing ?? document.createElement("script");
    script.dataset.readerEngine = name;
    script.src = src;
    script.async = false;
    script.addEventListener("load", () => isReady() ? resolve() : reject(new Error(`${name} 加载失败`)), { once: true });
    script.addEventListener("error", () => reject(new Error(`${name} 加载失败`)), { once: true });
    if (!existing) document.head.appendChild(script);
  });
}

export function flattenToc(items: EpubTocItem[]): EpubTocItem[] {
  return items.flatMap((item) => [item, ...flattenToc(item.subitems ?? [])]);
}

export async function blobUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("封面读取失败"));
    reader.readAsDataURL(blob);
  });
}
