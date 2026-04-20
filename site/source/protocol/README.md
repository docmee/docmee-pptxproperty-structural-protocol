# pptxProperty 协议

本目录存放 `pptxProperty` 的完整结构协议说明。协议面向需要读取、生成或转换 Docmee PPTX 结构数据的开发者。

## 阅读顺序

| 文档 | 主题 |
| --- | --- |
| [core.md](core.md) | 顶层数据结构、通用类型、坐标、颜色、填充、边框。 |
| [slideMaster.md](slideMaster.md) | 幻灯片母版、版式、主题、颜色映射、母版占位符。 |
| [page.md](page.md) | 页面结构、页面扩展信息、页面与母版/版式的索引关系。 |
| [object/README.md](object/README.md) | 页面对象树、文本、图片、表格、分组以及每类对象的属性。 |

## 结构概览

```text
pptxProperty
├── version
├── width
├── height
├── font
├── pages[]
│   ├── extInfo
│   │   ├── slideMasterIdx
│   │   ├── slideLayoutIdx
│   │   └── background
│   └── children[]
└── slideMasters[]
    ├── theme
    ├── clrMap
    ├── background
    ├── children[]
    └── slideLayouts[]
        ├── type
        ├── name
        ├── background
        └── children[]
```

`pages` 保存实际页面。`slideMasters` 保存母版。每个 `slideMaster` 内部的 `slideLayouts` 保存版式。页面通过 `slideMasterIdx` 和 `slideLayoutIdx` 引用对应的母版和版式。

## 数据合成

渲染或生成页面时，推荐按以下层级合成数据：

1. 读取 `slideMasters[slideMasterIdx]`，获得主题、母版背景和母版占位符。
2. 读取 `slideMasters[slideMasterIdx].slideLayouts[slideLayoutIdx]`，获得版式背景和版式占位符。
3. 读取 `pages[].extInfo.background`，获得页面级背景。
4. 读取 `pages[].children`，获得页面实际对象。

页面内容对象遵循统一的树结构，详见 [object/README.md](object/README.md)。
