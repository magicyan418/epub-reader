# Luna Reader

一个简洁、注重隐私的网页 EPUB 阅读器。书籍文件和阅读进度仅保存在当前浏览器的 IndexedDB 中，无需上传到服务器。

![Luna Reader 界面预览](design/shadcn_luna_reader_1/screen.png)

## 功能

- 点击或拖拽导入 EPUB，自动读取书名、作者和封面
- 本地书架管理，支持按阅读状态筛选、搜索和排序
- 自动保存阅读位置与进度
- 目录导航和全书文字搜索
- 选中文字后一键标记，在阅读器“标记”tab 中集中查看、跳转和取消标记
- 14-24 px 字号调节、浅色/深色主题和专注阅读模式
- 响应式布局，支持桌面端和移动端浏览器
- 书籍全程保存在本地，不上传、不跨设备同步

## 技术栈

- [Next.js 15](https://nextjs.org/)
- [React 19](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [epub.js](https://github.com/futurepress/epub.js/)
- [IndexedDB](https://developer.mozilla.org/docs/Web/API/IndexedDB_API)
- [Lucide React](https://lucide.dev/)

## 本地运行

请先安装 Node.js 18.18 或更高版本，以及 [pnpm](https://pnpm.io/)。

```bash
pnpm install
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 构建与部署

```bash
pnpm build
pnpm start
```

项目可以部署到支持 Next.js 的平台。Luna Reader 当前不包含服务端书籍存储，用户数据仍保留在访问该站点的浏览器中。浏览器会按站点来源隔离 IndexedDB，因此更换域名、浏览器或设备后不会自动迁移书架。

## 项目结构

```text
app/                  Next.js 页面与全局样式
components/           阅读器界面和通用组件
lib/                  EPUB 引擎适配与本地书库
public/vendor/        浏览器端 EPUB 依赖
design/               设计规范与界面参考图
```

## 隐私说明

导入的 EPUB 文件、封面和阅读进度存储在当前浏览器的 IndexedDB 中，不会由本项目上传到服务器。清除站点数据会同时删除本地书架，请自行保留原始 EPUB 文件。

## 许可证

本项目采用 [GNU Affero General Public License v3.0](LICENSE)（`AGPL-3.0-only`）许可。修改或通过网络提供本软件时，请遵守 AGPL-3.0 的源代码公开要求。

`public/vendor/` 中的第三方组件不因本项目许可证而改变，具体条款请参阅该目录内随附的许可证文件。
