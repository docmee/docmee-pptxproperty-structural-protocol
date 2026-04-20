# docmee-pptxProperty 结构协议

`docmee-pptxProperty-structural-protocol` 用于维护 Docmee `pptxProperty` JSON 结构协议，帮助第三方开发者理解、读取、生成和校验 PPTX 结构数据。

`pptxProperty` 描述一个演示文稿的页面尺寸、页面内容、幻灯片母版、版式、主题、背景和页面对象。它不是 PPTX 文件本身，而是 Docmee 系统在编辑、解析和生成 PPTX 时使用的结构化数据格式。

## 仓库结构

```text
.
├── README.md
├── example/
│   ├── example.json
│   └── audio_shadow.json
└── protocol/
    ├── README.md
    ├── core.md
    ├── slideMaster.md
    ├── page.md
    └── object/
        ├── README.md
        ├── common-property.md
        ├── text.md
        ├── image.md
        ├── table.md
        ├── container.md
        └── other-objects.md
```

| 路径 | 用途 |
| --- | --- |
| [README.md](README.md) | 项目用途、目录说明和阅读方式。 |
| [example/example.json](example/example.json) | 基础 `pptxProperty` 参考文件。 |
| [example/audio_shadow.json](example/audio_shadow.json) | 音频、媒体播放和阴影属性参考文件。 |
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

## 使用方式

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
5. 遍历 `pages[].children`，按 `object` 协议解析并渲染对象树。

## 兼容性说明

- 协议字段名区分大小写，第三方实现应保持原始字段名。
- 未识别字段建议保留透传，避免破坏向前兼容。
- 读取对象时应优先判断 `type`，再解析对应的 `extInfo.property`。
- `slideMasterIdx` 和 `slideLayoutIdx` 是数组下标引用，处理过程中不应重新排序相关数组。
- 颜色、透明度、坐标等数值单位请以协议文档为准，不建议自行转换含义。

## 当前状态

本仓库目前提供结构协议文档和一份参考 JSON。后续可以继续补充 JSON Schema、最小对象样例和自动校验脚本。
