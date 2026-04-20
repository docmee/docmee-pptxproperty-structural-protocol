# 对象协议

`object` 描述 `pptxProperty` 中的页面对象树。页面、母版、版式里的可视内容都使用同一套节点结构，并通过 `type` 区分对象类型。

## 文档入口

| 文档 | 主题 |
| --- | --- |
| [common-property.md](common-property.md) | 对象公共属性：位置、尺寸、旋转、填充、边框、阴影、占位符、超链接。 |
| [text.md](text.md) | 文本对象、段落 `p`、文本片段 `r`、富文本组合方式。 |
| [image.md](image.md) | 图片对象、图片资源、透明度、裁剪、图片填充。 |
| [table.md](table.md) | 表格、行、单元格、合并单元格、边框和单元格文本。 |
| [container.md](container.md) | 分组对象、坐标系、位置、缩放和子对象组合。 |
| [other-objects.md](other-objects.md) | 音频、视频等媒体类对象和轻量对象说明。 |

## 对象节点

```ts
type ElementNode = {
  id: string
  pid?: string
  type: ElementType
  depth: number
  point?: Box
  noDraw?: boolean
  text?: string
  extInfo: ElementExtInfo
  children: ElementNode[]
}

type ElementType =
  | "text"
  | "image"
  | "table"
  | "tableRow"
  | "tableColumn"
  | "p"
  | "r"
  | "container"
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 对象唯一标识。应在同一文档内保持唯一。 |
| `pid` | `string` | 父对象 id。页面顶层对象通常不设置。 |
| `type` | `ElementType` | 对象类型。解析时先根据该字段分派到对应协议。 |
| `depth` | `number` | 节点深度。页面直接子对象通常为 `1`，子节点逐级递增。 |
| `point` | `Box` | 对象在父坐标系中的外框。文本段落、文本片段、表格行等结构节点可以没有该字段。 |
| `noDraw` | `boolean` | 为 `true` 时表示该对象作为模板或占位定义存在，不应直接作为页面实物绘制。 |
| `text` | `string` | 文本内容。主要用于 `p` 空段落和 `r` 文本片段。 |
| `extInfo` | `ElementExtInfo` | 对象扩展信息。样式、资源和行为通常在 `extInfo.property`。 |
| `children` | `ElementNode[]` | 子对象数组。叶子节点使用空数组。 |

```ts
type ElementExtInfo = {
  property?: Record<string, unknown>
  rowSpan?: number
  gridSpan?: number
  [key: string]: unknown
}
```

## 树结构规则

```text
pages[].children
├── text -> p[] -> r[]
├── image
├── table -> tableRow[] -> tableColumn[] -> p[] -> r[]
└── container -> (text | image | table | container)[]

slideMasters[].children
└── text 占位符

slideMasters[].slideLayouts[].children
└── text 占位符
```

## 解析规则

1. 读取 `type`，选择对应对象协议。
2. 读取 `point`，建立对象外框。没有 `point` 的结构节点继承父对象布局上下文。
3. 读取 `extInfo.property`，解析该对象的真实类型、几何、样式、资源和行为。
4. 递归处理 `children`。
5. 未识别字段应保留透传，避免破坏向前兼容。

## 对象类别

| 类别 | 类型 | 说明 |
| --- | --- | --- |
| 文本 | `text`, `p`, `r` | 文本框、段落、富文本片段。 |
| 图片 | `image` | 图片，也可作为音频或视频的封面对象。 |
| 表格 | `table`, `tableRow`, `tableColumn` | 表格、行、单元格。 |
| 分组 | `container` | 分组和嵌套分组。 |
| 媒体 | `image` 上的 `audio`、`video` 字段 | 媒体资源通常挂载在图片对象的 `property` 上。 |

## 公共属性概览

常见对象属性可分为：

| 分组 | 属性 |
| --- | --- |
| 几何 | `realType`, `anchor`, `shapeType`, `geometry`, `rotation` |
| 布局 | `point`, `anchor`, `interiorAnchor`, `textInsets` |
| 外观 | `fillStyle`, `strokeStyle`, `shadow`, `effectLst`, `imageAlpha`, `fillAlpha` |
| 占位 | `placeholder`, `noDraw` |
| 交互 | `hyperlink`、媒体动画字段 |

公共属性的详细说明见 [common-property.md](common-property.md)。
