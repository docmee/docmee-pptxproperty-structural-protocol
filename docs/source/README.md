# docmee-pptxProperty 结构协议

Docmee `pptxProperty` JSON 结构协议文档，用于帮助第三方开发者读取、生成、转换和校验 PPTX 结构数据。

**[在线阅读文档 »](https://docmee.github.io/docmee-pptxproperty-structural-protocol/)**

[在线文档](https://docmee.github.io/docmee-pptxproperty-structural-protocol/) · [协议入口](protocol/README.md) · [参考 JSON](example/example.json)

## Table of Contents

- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Preview](#local-preview)
- [Usage](#usage)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

## About The Project

`docmee-pptxProperty-structural-protocol` 维护 Docmee `pptxProperty` 的结构协议说明。

`pptxProperty` 描述一个演示文稿的页面尺寸、页面内容、幻灯片母版、版式、主题、背景和页面对象。它不是 PPTX 文件本身，而是 Docmee 系统在编辑、解析和生成 PPTX 时使用的结构化数据格式。

本仓库的目标是让开发者可以：

- 理解 `pptxProperty` 的顶层结构、索引关系和兼容性规则。
- 按对象类型解析文本、图片、表格、分组、音频和视频等页面内容。
- 生成符合 Docmee 预期的数据结构，并在读写过程中保留未知字段。
- 通过在线文档快速检索字段、对象类型和示例。

### Built With

本项目以 Markdown 协议文档为源文件，并使用零运行时依赖的静态站点生成脚本发布在线文档。

- Markdown
- Node.js
- GitHub Pages

## Getting Started

可以直接访问线上文档：

[https://docmee.github.io/docmee-pptxproperty-structural-protocol/](https://docmee.github.io/docmee-pptxproperty-structural-protocol/)

也可以在本地克隆仓库后阅读 Markdown 源文档，或重新生成静态文档站点。

### Prerequisites

- Node.js 18 或更高版本
- Python 3，仅用于本地静态文件预览

### Local Preview

1. Clone the repo

   ```sh
   git clone https://github.com/docmee/docmee-pptxproperty-structural-protocol.git
   cd docmee-pptxproperty-structural-protocol
   ```

2. Build the documentation site

   ```sh
   npm run build:site
   ```

3. Preview the generated site

   ```sh
   python3 -m http.server 4173 --directory docs
   ```

4. Open the local URL

   ```text
   http://127.0.0.1:4173/
   ```

## Usage

建议按以下顺序阅读协议：

1. 阅读 [protocol/core.md](protocol/core.md)，理解顶层字段、坐标、颜色、填充、边框等通用结构。
2. 阅读 [protocol/slideMaster.md](protocol/slideMaster.md)，理解母版、版式、主题与占位符的组织方式。
3. 阅读 [protocol/page.md](protocol/page.md)，理解页面如何引用母版和版式，以及页面内容如何挂载。
4. 阅读 [protocol/object/README.md](protocol/object/README.md)，理解对象树和各对象类型的文档入口。
5. 对照 [example/example.json](example/example.json)，验证实际 JSON 与协议字段的对应关系。

开发集成时，推荐的处理流程是：

1. 读取顶层 `width`、`height`，建立页面画布。
2. 遍历 `pages`，读取每个页面的 `extInfo.slideMasterIdx` 和 `extInfo.slideLayoutIdx`。
3. 根据索引解析对应的 `slideMasters[]` 和 `slideMasters[].slideLayouts[]`。
4. 合成母版、版式、页面三层背景和占位符信息。
5. 遍历 `pages[].children`，按对象协议解析并渲染对象树。

**重要：** `slideMasterIdx` 和 `slideLayoutIdx` 是数组下标引用。处理过程中不应重新排序相关数组，除非同步更新所有页面引用。

## Documentation

| 路径 | 用途 |
| --- | --- |
| [在线文档](https://docmee.github.io/docmee-pptxproperty-structural-protocol/) | 可在线观看和搜索的完整协议文档。 |
| [protocol/README.md](protocol/README.md) | 协议文档入口和阅读顺序。 |
| [protocol/core.md](protocol/core.md) | 顶层结构、索引关系、坐标约定和通用类型。 |
| [protocol/slideMaster.md](protocol/slideMaster.md) | `slideMasters`、`slideLayouts`、主题和母版结构。 |
| [protocol/page.md](protocol/page.md) | `pages`、页面扩展信息和页面内容组织方式。 |
| [protocol/object/README.md](protocol/object/README.md) | 页面对象协议入口。 |
| [protocol/object/common-property.md](protocol/object/common-property.md) | 对象公共属性，例如位置、填充、阴影、超链接。 |
| [protocol/object/text.md](protocol/object/text.md) | 文本对象、段落、文本片段和富文本组合。 |
| [protocol/object/image.md](protocol/object/image.md) | 图片对象、图片资源、裁剪和透明度。 |
| [protocol/object/table.md](protocol/object/table.md) | 表格、行、单元格、合并单元格。 |
| [protocol/object/container.md](protocol/object/container.md) | 分组对象、位置、缩放和嵌套。 |
| [protocol/object/other-objects.md](protocol/object/other-objects.md) | 音频、视频和媒体播放扩展。 |
| [example/example.json](example/example.json) | 参考 `pptxProperty` JSON。 |
| [example/audio_shadow.json](example/audio_shadow.json) | 含音频和阴影对象的参考 JSON。 |

## Roadmap

- [x] 梳理顶层结构、页面、母版和对象协议。
- [x] 补充文本、图片、表格、分组和媒体对象说明。
- [x] 生成可通过 GitHub Pages 访问的在线文档站点。
- [ ] 补充 JSON Schema。
- [ ] 补充最小对象样例。
- [ ] 补充自动校验脚本。

## Contributing

欢迎通过 issue 或 pull request 补充字段说明、示例和兼容性经验。

建议贡献流程：

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

提交协议变更时，请尽量同时补充：

- 字段路径和类型。
- 是否必填，以及缺失或为 `null` 时的处理方式。
- 与 PPTX、Docmee 编辑器或导入导出流程相关的兼容性说明。
- 可复现的最小 JSON 示例。

## License

Distributed under the Apache-2.0 License. See [LICENSE](LICENSE) for more information.

## Contact

Project Link: [https://github.com/docmee/docmee-pptxproperty-structural-protocol](https://github.com/docmee/docmee-pptxproperty-structural-protocol)

Documentation: [https://docmee.github.io/docmee-pptxproperty-structural-protocol/](https://docmee.github.io/docmee-pptxproperty-structural-protocol/)

## Acknowledgments

- [Best README Template](https://github.com/othneildrew/Best-README-Template) 提供 README 组织结构参考。
- [GitHub Pages](https://pages.github.com/) 用于托管在线文档。
