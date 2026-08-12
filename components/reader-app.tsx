"use client";

import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CloudUpload,
  FileText,
  ListTree,
  Library,
  Menu,
  Minus,
  Moon,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  LoaderCircle,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { deleteStoredBook, getStoredBook, listStoredBooks, saveStoredBook, StoredEpubBook, updateStoredProgress } from "@/lib/epub-library";
import { blobUrlToDataUrl, EpubBook, EpubLocation, EpubRendition, EpubSearchResult, EpubTocItem, flattenToc, loadEpubEngine } from "@/lib/epub-engine";
import { AlertDialog } from "@/components/ui/alert-dialog";

type View = "library" | "import" | "reader";
type Filter = "全部" | "正在阅读" | "已读完" | "未开始";

type DisplayBook = {
  id: string;
  title: string;
  author: string;
  cover: string | null;
  progress: number;
  status: string;
};

type UploadItem = {
  id: string;
  name: string;
  size: string;
  progress: number;
  state: "parsing" | "done" | "error";
  error?: string;
};

type ReaderSearchResult = EpubSearchResult & { chapter: string };

const navItems: { id: Exclude<View, "reader">; label: string; icon: typeof Library }[] = [
  { id: "library", label: "我的书架", icon: Library },
  { id: "import", label: "导入书籍", icon: Upload },
];

export default function ReaderApp() {
  const [view, setView] = useState<View>("library");
  const [filter, setFilter] = useState<Filter>("全部");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [sortAsc, setSortAsc] = useState(true);
  const [fontSize, setFontSize] = useState(17);
  const [readerDark, setReaderDark] = useState(false);
  const [storedBooks, setStoredBooks] = useState<StoredEpubBook[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [libraryReady, setLibraryReady] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DisplayBook | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listStoredBooks()
      .then(setStoredBooks)
      .finally(() => setLibraryReady(true));
  }, []);

  const allBooks = useMemo<DisplayBook[]>(() =>
    storedBooks.map((book) => ({
      id: book.id,
      title: book.title,
      author: book.author,
      cover: book.cover,
      progress: book.progress,
      status: book.progress >= 100 ? "已读完" : book.progress > 0 ? "正在阅读" : "未开始",
    })), [storedBooks]);

  const visibleBooks = useMemo(() => {
    const result = allBooks.filter((book) => {
      const matchesFilter = filter === "全部" || book.status === filter;
      const matchesQuery = `${book.title}${book.author}`.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
    return sortAsc ? result : [...result].reverse();
  }, [allBooks, filter, query, sortAsc]);

  function goTo(next: View) {
    setView(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addFiles(files: FileList | File[]) {
    const candidates = Array.from(files);
    const queue = candidates.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      progress: 8,
      state: "parsing" as const,
    }));
    setUploads((current) => [...queue, ...current]);

    let importedCount = 0;
    for (const [index, file] of candidates.entries()) {
      const upload = queue[index];
      let epub: EpubBook | null = null;
      try {
        if (!/\.epub$/i.test(file.name)) throw new Error("仅支持 EPUB 文件");
        if (file.size > 50 * 1024 * 1024) throw new Error("文件不能超过 50MB");
        setUploads((items) => items.map((item) => item.id === upload.id ? { ...item, progress: 25 } : item));

        const createBook = await loadEpubEngine();
        const buffer = await file.arrayBuffer();
        epub = createBook(buffer);
        await epub.ready;
        const metadata = await epub.loaded.metadata;
        const now = Date.now();
        let stored: StoredEpubBook = {
          id: crypto.randomUUID(),
          title: metadata.title?.trim() || file.name.replace(/\.epub$/i, ""),
          author: metadata.creator?.trim() || "未知作者",
          fileName: file.name,
          size: file.size,
          cover: null,
          progress: 0,
          location: null,
          createdAt: now,
          updatedAt: now,
          file: new Blob([buffer], { type: "application/epub+zip" }),
        };
        await saveStoredBook(stored);

        try {
          const coverUrl = await epub.coverUrl();
          if (coverUrl) {
            stored = { ...stored, cover: await blobUrlToDataUrl(coverUrl) };
            await saveStoredBook(stored);
            if (coverUrl.startsWith("blob:")) URL.revokeObjectURL(coverUrl);
          }
        } catch {
          // A malformed or remote cover must not prevent the EPUB from entering the library.
        }

        importedCount += 1;
        setStoredBooks(await listStoredBooks());
        setUploads((items) => items.map((item) => item.id === upload.id ? { ...item, progress: 100, state: "done" } : item));
      } catch (error) {
        setUploads((items) => items.map((item) => item.id === upload.id ? {
          ...item,
          progress: 100,
          state: "error",
          error: error instanceof Error ? error.message : "解析失败",
        } : item));
      } finally {
        epub?.destroy();
      }
    }
    if (importedCount > 0) {
      setStoredBooks(await listStoredBooks());
      goTo("library");
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    addFiles(event.dataTransfer.files);
  }

  function openBook(book: DisplayBook) {
    setSelectedBookId(book.id);
    goTo("reader");
  }

  async function confirmRemoveBook() {
    if (!deleteTarget) return;
    await deleteStoredBook(deleteTarget.id);
    setStoredBooks(await listStoredBooks());
    setDeleteTarget(null);
  }

  if (view === "reader" && selectedBookId) {
    return (
      <EpubReaderView
        bookId={selectedBookId}
        fontSize={fontSize}
        setFontSize={setFontSize}
        dark={readerDark}
        setDark={setReaderDark}
        onBack={async () => {
          setStoredBooks(await listStoredBooks());
          goTo("library");
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <Header
        view={view}
        query={query}
        setQuery={setQuery}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        goTo={goTo}
      />
      <main>
        {view === "library" && (
          <LibraryView
            visibleBooks={visibleBooks}
            totalBooks={allBooks.length}
            readingBooks={allBooks.filter((book) => book.status === "正在阅读").length}
            libraryReady={libraryReady}
            filter={filter}
            setFilter={setFilter}
            sortAsc={sortAsc}
            setSortAsc={setSortAsc}
            openBook={openBook}
            removeBook={(id) => setDeleteTarget(allBooks.find((book) => book.id === id) ?? null)}
            openImport={() => goTo("import")}
          />
        )}
        {view === "import" && (
          <ImportView
            uploads={uploads}
            setUploads={setUploads}
            inputRef={inputRef}
            addFiles={addFiles}
            handleDrop={handleDrop}
          />
        )}
      </main>
      <AlertDialog
        open={Boolean(deleteTarget)}
        title="从书架移除？"
        description={`“${deleteTarget?.title ?? "这本书"}”及其本地阅读进度将从此设备删除，此操作无法撤销。`}
        confirmLabel="移除书籍"
        onConfirm={() => void confirmRemoveBook()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function Header({ view, query, setQuery, menuOpen, setMenuOpen, goTo }: {
  view: View;
  query: string;
  setQuery: (value: string) => void;
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
  goTo: (view: View) => void;
}) {
  return (
    <header className="topbar">
      <button className="brand" onClick={() => goTo("library")}>Luna Reader</button>
      <nav className={menuOpen ? "main-nav open" : "main-nav"} aria-label="主导航">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "nav-item active" : "nav-item"} onClick={() => goTo(id)}>
            <Icon size={17} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="header-actions">
        <label className="search-box">
          <Search size={19} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索书名、作者..." />
        </label>
        <button className="icon-button profile-button" aria-label="个人账户" title="个人账户"><CircleUserRound size={23} /></button>
        <button className="icon-button menu-button" aria-label="打开导航" title="导航" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

function LibraryView({ visibleBooks, totalBooks, readingBooks, libraryReady, filter, setFilter, sortAsc, setSortAsc, openBook, removeBook, openImport }: {
  visibleBooks: DisplayBook[];
  totalBooks: number;
  readingBooks: number;
  libraryReady: boolean;
  filter: Filter;
  setFilter: (filter: Filter) => void;
  sortAsc: boolean;
  setSortAsc: (value: boolean) => void;
  openBook: (book: DisplayBook) => void;
  removeBook: (id: string) => void;
  openImport: () => void;
}) {
  const filters: Filter[] = ["全部", "正在阅读", "已读完", "未开始"];
  return (
    <section className="page library-page">
      <div className="page-heading">
        <p className="eyebrow">个人图书馆</p>
        <h1>我的书架</h1>
        <p>{libraryReady ? <>你有 <strong>{totalBooks}</strong> 本藏书，其中 <strong className="accent">{readingBooks}</strong> 本正在阅读中。</> : "正在读取本地书架..."}</p>
      </div>
      <div className="library-toolbar">
        <div className="segmented" aria-label="筛选书籍">
          {filters.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}
        </div>
        <button className="outline-button" onClick={() => setSortAsc(!sortAsc)}><SlidersHorizontal size={16} />排序方式</button>
      </div>
      <div className="book-grid">
        {visibleBooks.map((book, index) => (
          <article className="book-card" key={book.title}>
            <button className="cover-button" onClick={() => openBook(book)} aria-label={`阅读${book.title}`}>
              {book.cover ? (
                <img className="cover-art" src={book.cover} alt={`${book.title}封面`} />
              ) : (
                <span className="generated-cover"><BookOpen size={34} /><strong>{book.title}</strong><small>{book.author}</small></span>
              )}
              {book.progress > 0 && book.progress < 100 && <span className="cover-progress" style={{ width: `${book.progress}%` }} />}
            </button>
            <div className="book-info">
              <button className="book-title" onClick={() => openBook(book)}>{book.title}</button>
              <p>{book.author}</p>
              <div className="book-meta">
                <span className={book.progress > 0 && book.progress < 100 ? "accent" : ""}>
                  {book.progress === 100 ? "已读完" : book.progress > 0 ? `${book.progress}% 已读` : book.status}
                </span>
                <button className="icon-button small" aria-label={`移除${book.title}`} title="从书架移除" onClick={() => removeBook(book.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          </article>
        ))}
        <button className="add-book" onClick={openImport}><Plus size={30} /><span>添加书籍</span></button>
      </div>
      {visibleBooks.length === 0 && <div className="empty-state"><BookOpen size={32} /><p>没有找到匹配的书籍</p></div>}
    </section>
  );
}

function ImportView({ uploads, setUploads, inputRef, addFiles, handleDrop }: {
  uploads: UploadItem[];
  setUploads: React.Dispatch<React.SetStateAction<UploadItem[]>>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  addFiles: (files: FileList | File[]) => void;
  handleDrop: (event: DragEvent<HTMLButtonElement>) => void;
}) {
  return (
    <section className="page import-page">
      <div className="page-heading centered compact"><p className="eyebrow">扩展你的书架</p><h1>导入书籍</h1><p>将 EPUB 添加到这台设备的本地书架</p></div>
      <input ref={inputRef} type="file" accept=".epub,application/epub+zip" multiple hidden onChange={(event: ChangeEvent<HTMLInputElement>) => { if (event.target.files) void addFiles(event.target.files); event.target.value = ""; }} />
      <button className="drop-zone" onClick={() => inputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
        <span className="upload-icon"><CloudUpload size={42} /></span>
        <strong>点击或拖拽 EPUB 文件到此处</strong>
        <small>支持标准 EPUB 格式（最大 50MB），文件仅保存在此设备</small>
      </button>
      <div className="recent-header"><h2>最近导入</h2><span>{uploads.length} 个项目</span></div>
      <div className="upload-list">
        {uploads.map((file) => (
          <article className="upload-row" key={file.name}>
            <span className="file-icon"><FileText size={22} /></span>
            <div className="file-copy"><strong>{file.name}</strong><p>{file.size} · {file.state === "done" ? "已加入书架" : file.state === "error" ? file.error : "正在解析元数据与封面..."}</p>{file.state === "parsing" && <span className="upload-progress"><i style={{ width: `${file.progress}%` }} /></span>}</div>
            {file.state === "done" ? <Check className="success" size={18} /> : file.state === "parsing" ? <LoaderCircle className="spin accent" size={19} /> : <X className="error-color" size={19} />}
            <button className="icon-button" aria-label="移除记录" title="移除记录" onClick={() => setUploads((items) => items.filter((item) => item.id !== file.id))}><X size={19} /></button>
          </article>
        ))}
      </div>
      <div className="feature-grid">
        <article><Sparkles size={23} /><h3>自动解析</h3><p>读取 EPUB 元数据、目录和封面，导入后即可开始阅读。</p></article>
        <article><Library size={23} /><h3>本地保存</h3><p>书籍与阅读进度保存在当前浏览器中，刷新页面后仍可继续阅读。</p></article>
        <article><ShieldCheck size={23} /><h3>私密阅读</h3><p>文件不会上传到服务器，也不会同步到其他设备。</p></article>
      </div>
    </section>
  );
}

function EpubReaderView({ bookId, fontSize, setFontSize, dark, setDark, onBack }: {
  bookId: string;
  fontSize: number;
  setFontSize: (size: number) => void;
  dark: boolean;
  setDark: (dark: boolean) => void;
  onBack: () => void | Promise<void>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const epubRef = useRef<EpubBook | null>(null);
  const renditionRef = useRef<EpubRendition | null>(null);
  const highlightedCfiRef = useRef<string | null>(null);
  const locationsPromiseRef = useRef<Promise<void> | null>(null);
  const currentCfiRef = useRef("");
  const flatTocRef = useRef<EpubTocItem[]>([]);
  const appearanceRef = useRef({ dark, fontSize });
  appearanceRef.current = { dark, fontSize };
  const [book, setBook] = useState<StoredEpubBook | null>(null);
  const [toc, setToc] = useState<EpubTocItem[]>([]);
  const [leftOpen, setLeftOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"toc" | "search">("toc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ReaderSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("正在打开...");
  const [currentTocHref, setCurrentTocHref] = useState("");
  const [progress, setProgress] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function applyFrameStyles(nextDark: boolean, nextFontSize: number) {
    const foreground = nextDark ? "#e9e9e7" : "#17191c";
    const background = nextDark ? "#1d1f21" : "#f7f8fa";
    stageRef.current?.querySelectorAll("iframe").forEach((frame) => {
      const document = frame.contentDocument;
      if (!document) return;
      let style = document.getElementById("luna-reader-theme") as HTMLStyleElement | null;
      if (!style) {
        const styleHost = document.head ?? document.documentElement;
        if (!styleHost) return;
        style = document.createElement("style");
        style.id = "luna-reader-theme";
        styleHost.appendChild(style);
      }
      style.textContent = `
        html, body { color: ${foreground} !important; background: ${background} !important; }
        body { max-width: 760px !important; margin: 0 auto !important; box-sizing: border-box !important; font-family: Georgia, 'Noto Serif SC', serif !important; font-size: ${nextFontSize}px !important; line-height: 1.85 !important; padding: 40px 36px 80px !important; }
        body * { color: ${foreground} !important; background-color: transparent !important; }
        body a { color: ${nextDark ? "#b8b9ff" : "#4648d4"} !important; }
        body img, body svg { max-width: 100% !important; object-fit: contain !important; }
        body input, body textarea { color: ${foreground} !important; background: ${background} !important; }
      `;
      document.documentElement.style.colorScheme = nextDark ? "dark" : "light";
      frame.style.backgroundColor = background;
    });
  }

  useEffect(() => {
    if (window.innerWidth <= 760) setLeftOpen(false);
  }, []);

  function syncReadingLocation(location: EpubLocation) {
    const epub = epubRef.current;
    const cfi = location.start.cfi;
    if (!epub || !cfi) return;
    currentCfiRef.current = cfi;

    const flatToc = flatTocRef.current;
    const href = (location.start.href ?? "").split("#")[0];
    const chapterIndex = flatToc.findIndex((item) => {
      const itemHref = item.href.split("#")[0];
      return href.endsWith(itemHref) || itemHref.endsWith(href);
    });
    const currentChapter = chapterIndex >= 0 ? flatToc[chapterIndex] : undefined;
    if (currentChapter) {
      setChapterTitle(currentChapter.label.trim());
      setCurrentTocHref(currentChapter.href.split("#")[0]);
    }

    const displayed = location.start.displayed;
    const chapterRatio = displayed?.total ? Math.min(1, displayed.page / displayed.total) : 0;
    setChapterProgress(Math.round(chapterRatio * 100));
    const approximate = flatToc.length && chapterIndex >= 0
      ? ((chapterIndex + chapterRatio) / flatToc.length) * 100
      : progress;
    if (Number.isFinite(approximate)) {
      setProgress(Math.round(approximate));
      void updateStoredProgress(bookId, cfi, approximate);
    }

    const locationsPromise = locationsPromiseRef.current;
    if (!locationsPromise) return;
    void locationsPromise.then(() => {
      if (currentCfiRef.current !== cfi || !epubRef.current) return;
      const exact = epubRef.current.locations.percentageFromCfi(cfi) * 100;
      if (!Number.isFinite(exact)) return;
      setProgress(Math.round(exact));
      void updateStoredProgress(bookId, cfi, exact);
    }).catch(() => undefined);
  }

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const stored = await getStoredBook(bookId);
        if (!stored || !stageRef.current) throw new Error("未找到这本 EPUB，请重新导入");
        setBook(stored);
        setProgress(stored.progress);
        setChapterTitle(stored.title);

        const createBook = await loadEpubEngine();
        const epub = createBook(await stored.file.arrayBuffer());
        epubRef.current = epub;
        await epub.ready;
        const navigation = await epub.loaded.navigation;
        if (!active || !stageRef.current) return;
        setToc(navigation.toc ?? []);
        const flatToc = flattenToc(navigation.toc ?? []);
        flatTocRef.current = flatToc;
        const rendition = epub.renderTo(stageRef.current, {
          width: "100%",
          height: "100%",
          flow: "scrolled",
          manager: "continuous",
          spread: "none",
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;
        locationsPromiseRef.current = epub.locations.generate(1200).then(() => undefined);
        rendition.on("rendered", () => window.requestAnimationFrame(() => {
          const appearance = appearanceRef.current;
          applyFrameStyles(appearance.dark, appearance.fontSize);
        }));
        rendition.on("relocated", (location: EpubLocation) => {
          if (!active) return;
          syncReadingLocation(location);
        });
        await rendition.display(stored.location ?? undefined);
        if (!active) return;
        const appearance = appearanceRef.current;
        applyFrameStyles(appearance.dark, appearance.fontSize);
        setLoading(false);
      } catch (reason) {
        if (!active) return;
        setError(reason instanceof Error ? reason.message : "EPUB 打开失败");
        setLoading(false);
      }
    }

    void initialize();
    return () => {
      active = false;
      try { renditionRef.current?.destroy(); } catch { /* EPUB view may already be detached. */ }
      renditionRef.current = null;
      locationsPromiseRef.current = null;
      currentCfiRef.current = "";
      flatTocRef.current = [];
      try { epubRef.current?.destroy(); } catch { /* Archive may already be closed. */ }
      epubRef.current = null;
    };
  }, [bookId]);

  useEffect(() => {
    applyFrameStyles(dark, fontSize);
  }, [dark, fontSize]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
      renditionRef.current?.resize();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [leftOpen, focusMode]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (focusMode) setFocusMode(false);
        else setLeftOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [focusMode]);

  async function searchInsideBook() {
    const epub = epubRef.current;
    const query = searchQuery.trim();
    if (!epub || !query || searching) return;
    setSearching(true);
    setSearchResults([]);
    const results: ReaderSearchResult[] = [];
    const flatToc = flattenToc(toc);
    try {
      for (const [sectionIndex, section] of epub.spine.spineItems.entries()) {
        try {
          await section.load(epub.load.bind(epub));
          const sectionHref = section.href.split("#")[0];
          const tocItem = flatToc.find((item) => {
            const itemHref = item.href.split("#")[0];
            return sectionHref.endsWith(itemHref) || itemHref.endsWith(sectionHref);
          });
          const chapter = tocItem?.label.trim() || `章节 ${sectionIndex + 1}`;
          results.push(...section.find(query).map((result) => ({ ...result, chapter })));
          if (results.length >= 80) break;
        } finally {
          section.unload();
        }
      }
      setSearchResults(results.slice(0, 80));
    } finally {
      setSearching(false);
    }
  }

  async function openSearchResult(result: ReaderSearchResult) {
    const rendition = renditionRef.current;
    if (!rendition) return;
    const previous = highlightedCfiRef.current;
    if (previous) rendition.annotations.remove(previous, "highlight");
    await rendition.display(result.cfi);
    syncReadingLocation(rendition.currentLocation());
    rendition.annotations.highlight(result.cfi, {}, undefined, "luna-search-highlight", {
      fill: dark ? "#ffd65a" : "#f0b429",
      "fill-opacity": dark ? "0.42" : "0.32",
      "mix-blend-mode": dark ? "screen" : "multiply",
    });
    highlightedCfiRef.current = result.cfi;
    if (window.innerWidth <= 760) setLeftOpen(false);
  }

  async function openTocItem(item: EpubTocItem) {
    const rendition = renditionRef.current;
    if (!rendition) return;
    // TOC anchors can point into the end of a chapter. For chapter navigation,
    // discard the fragment so epub.js starts at the chapter's first page.
    await rendition.display(item.href.split("#")[0]);
    if (window.innerWidth <= 760) setLeftOpen(false);
  }

  function isCurrentTocItem(item: EpubTocItem) {
    const itemHref = item.href.split("#")[0];
    return Boolean(currentTocHref) && (currentTocHref.endsWith(itemHref) || itemHref.endsWith(currentTocHref));
  }

  function highlightedExcerpt(text: string) {
    const query = searchQuery.trim();
    if (!query) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.split(new RegExp(`(${escaped})`, "gi")).map((part, index) =>
      part.toLocaleLowerCase() === query.toLocaleLowerCase() ? <mark key={index}>{part}</mark> : part,
    );
  }

  const readerClass = ["reader", "epub-reader", dark ? "dark" : "", leftOpen ? "" : "left-collapsed", focusMode ? "focus-mode" : ""].filter(Boolean).join(" ");

  return (
    <div className={readerClass}>
      <header className="reader-bar">
        <button className="reader-back" onClick={() => void onBack()}><ChevronLeft size={19} />返回书架</button>
        <strong title={book?.title}>{chapterTitle}</strong>
        <div className="reader-tools">
          <button aria-label={leftOpen ? "收起左侧栏" : "展开左侧栏"} title={leftOpen ? "收起左侧栏" : "展开左侧栏"} onClick={() => setLeftOpen(!leftOpen)}>{leftOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button>
          <button aria-label="进入阅读模式" title="阅读模式" onClick={() => setFocusMode(true)}><Maximize2 size={18} /></button>
        </div>
      </header>
      <div className="reader-progress"><i style={{ width: `${progress}%` }} /></div>

      <aside className={leftOpen ? "reader-sidebar open" : "reader-sidebar"}>
        <div className="sidebar-book"><span>{book?.author}</span><strong>{book?.title}</strong></div>
        <div className="sidebar-tabs" role="tablist" aria-label="书籍导航">
          <button role="tab" aria-selected={sidebarTab === "toc"} className={sidebarTab === "toc" ? "active" : ""} onClick={() => setSidebarTab("toc")}><ListTree size={16} />目录</button>
          <button role="tab" aria-selected={sidebarTab === "search"} className={sidebarTab === "search" ? "active" : ""} onClick={() => setSidebarTab("search")}><Search size={16} />搜索</button>
        </div>
        {sidebarTab === "toc" ? (
          <nav className="toc-list" aria-label="书籍目录">
            {flattenToc(toc).map((item, index) => <button key={`${item.href}-${index}`} className={isCurrentTocItem(item) ? "active" : ""} aria-current={isCurrentTocItem(item) ? "location" : undefined} onClick={() => void openTocItem(item)}>{item.label.trim() || `章节 ${index + 1}`}</button>)}
            {!toc.length && <p>此 EPUB 没有提供目录。</p>}
          </nav>
        ) : (
          <div className="book-search">
            <div className="book-search-box"><Search size={16} /><input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void searchInsideBook(); }} placeholder="搜索书内文字" /><button aria-label="搜索" onClick={() => void searchInsideBook()}>{searching ? <LoaderCircle className="spin" size={16} /> : <ChevronRight size={16} />}</button></div>
            <div className="search-results">
              {searchResults.map((result, index) => <button key={`${result.cfi}-${index}`} onClick={() => void openSearchResult(result)}><strong>{result.chapter}</strong><span>{highlightedExcerpt(result.excerpt)}</span></button>)}
              {!searching && searchQuery && !searchResults.length && <p>输入关键词并搜索整本书。</p>}
            </div>
          </div>
        )}
      </aside>

      <main className="epub-canvas">
        <div className="epub-stage" ref={stageRef} />
        {loading && <div className="reader-status"><LoaderCircle className="spin" size={26} /><span>正在解析与排版 EPUB...</span></div>}
        {error && <div className="reader-status error-state"><BookOpen size={30} /><strong>无法打开书籍</strong><span>{error}</span><button className="outline-button" onClick={() => void onBack()}>返回书架</button></div>}
      </main>

      <aside className="reader-utility">
        <div className="utility-progress"><span>阅读进度</span><strong>{progress}%</strong><small><span>{chapterTitle}</span><b>本章 {chapterProgress}%</b></small></div>
        <section><h3>字号</h3><div className="font-stepper"><button aria-label="减小字号" onClick={() => setFontSize(Math.max(14, fontSize - 1))}><Minus size={16} /></button><span>{fontSize}px</span><button aria-label="增大字号" onClick={() => setFontSize(Math.min(24, fontSize + 1))}><Plus size={16} /></button></div></section>
        <section><h3>主题</h3><div className="theme-segment"><button className={!dark ? "active" : ""} aria-label="浅色主题" onClick={() => setDark(false)}><Sun size={17} />浅色</button><button className={dark ? "active" : ""} aria-label="深色主题" onClick={() => setDark(true)}><Moon size={17} />深色</button></div></section>
      </aside>
      {leftOpen && <button className="reader-sidebar-backdrop" aria-label="关闭左侧栏" onClick={() => setLeftOpen(false)} />}
      {focusMode && <button className="focus-exit" aria-label="退出阅读模式" title="退出阅读模式" onClick={() => setFocusMode(false)}><Minimize2 size={20} /></button>}

    </div>
  );
}
