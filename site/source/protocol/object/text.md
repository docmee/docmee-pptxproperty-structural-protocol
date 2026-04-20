# 文本对象

文本由三层节点组成：

```text
text
└── p[]
    └── r[]
```

- `text` 表示文本框或文本形状，负责位置、形状、背景、边框、阴影和文本容器设置。
- `p` 表示段落，负责段落对齐、项目符号、缩进、行距和段间距。
- `r` 表示文本片段，负责实际字符串和字符级样式。

## `text`

```ts
type TextElement = ElementNode & {
  type: "text"
  point: Box
  extInfo: {
    property: TextProperty
  }
  children: ParagraphNode[]
}
```

```ts
type TextProperty = {
  realType: "Auto" | "TextBox"
  anchor: Box
  placeholder?: Placeholder
  shapeType?: string
  fillStyle?: FillStyle
  strokeStyle?: StrokeStyle
  geometry?: Geometry
  shadow?: Shadow
  effectLst?: Record<string, unknown>
  rotation?: number
  textAutofit?: "NONE" | "NORMAL" | "SHAPE"
  textDirection?: "HORIZONTAL" | "EA_VERTICAL"
  textVerticalAlignment?: "TOP" | "MIDDLE" | "BOTTOM"
  textWordWrap?: boolean
  textInsets?: [number, number, number, number]
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `realType` | 显式文本框使用 `TextBox`；占位符或自动形状文本使用 `Auto`。 | 控制 PPTX 语义类型。 |
| `anchor` | `[x, y, width, height]`。 | 定义文本容器区域。 |
| `placeholder` | 文本表示版式占位符时设置。 | 用于版式匹配和默认样式继承。 |
| `shapeType` | 通常为 `rect`。 | 决定外框形状类别。 |
| `fillStyle` | 使用 `noFill`、`color`、`gradient` 或 `texture`。 | 设置文本框背景。 |
| `strokeStyle` | 设置线条填充、线宽和虚线样式。 | 设置文本框边框。 |
| `geometry` | 通常为 `{ "name": "rect" }`。 | 定义形状轮廓和文本边界。 |
| `shadow` | 设置公共阴影对象。 | 给文本框形状添加阴影。 |
| `rotation` | 角度数值。 | 旋转整个文本框。 |
| `textAutofit` | `NONE`、`NORMAL` 或 `SHAPE`。 | 控制文本如何适应框大小。 |
| `textDirection` | `HORIZONTAL` 或 `EA_VERTICAL`。 | 横排或东亚竖排文本。 |
| `textVerticalAlignment` | `TOP`、`MIDDLE`、`BOTTOM`。 | 控制文本在框内的垂直位置。 |
| `textWordWrap` | `true` 或 `false`。 | 启用或禁用自动换行。 |
| `textInsets` | `[top, right, bottom, left]`。 | 设置边框和文本之间的内边距。 |

### 文本自适应

| 值 | 行为 |
| --- | --- |
| `NONE` | 文本保持原字号，可能溢出文本框。 |
| `NORMAL` | 文本可以缩小以适配可用区域。 |
| `SHAPE` | 形状或文本框可以调整，使内容更容易完整显示。 |

需要精确保留字号时使用 `NONE`。导入 PPTX 内容且希望尽量保持文字可见时使用 `SHAPE`。

### 自动换行和内边距

```json
{
  "textWordWrap": true,
  "textInsets": [3.6, 7.2, 3.6, 7.2]
}
```

- `textWordWrap: true` 让长文本在 `anchor.width` 范围内自动换行。
- `textWordWrap: false` 允许长行横向溢出。
- 左右内边距越大，可用文本宽度越小。
- 上下内边距越大，可用文本高度越小。

## `p`

```ts
type ParagraphNode = ElementNode & {
  type: "p"
  text?: string
  extInfo: {
    property: ParagraphProperty
  }
  children: RunNode[]
}
```

```ts
type ParagraphProperty = {
  fontAlign?: "AUTO"
  textAlign?: "LEFT" | "CENTER" | "RIGHT"
  indent?: number
  indentLevel?: number
  bulletStyle?: BulletStyle
  leftMargin?: number
  lineSpacing?: number
  spaceBefore?: number
  spaceAfter?: number
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `fontAlign` | `AUTO`。 | 使用自动字体对齐。 |
| `textAlign` | `LEFT`、`CENTER`、`RIGHT`。 | 控制段落水平对齐。 |
| `indent` | 数值，可为负数。 | 控制首行或项目符号缩进。 |
| `indentLevel` | 非负整数。 | 控制段落嵌套层级。 |
| `bulletStyle` | `{ "buNone": true }` 或项目符号字符配置。 | 禁用或启用项目符号。 |
| `leftMargin` | 数值。 | 让段落内容离左边缘更远。 |
| `lineSpacing` | 数值。 | 控制行间距。值越大行距越松。 |
| `spaceBefore` | 数值。 | 增加段前间距。 |
| `spaceAfter` | 数值。 | 增加段后间距。可使用负数压缩段落间距。 |

### 项目符号样式

```ts
type BulletStyle =
  | { buNone: true }
  | { bulletCharacter: string; bulletFont: string }
```

无项目符号：

```json
{
  "bulletStyle": { "buNone": true }
}
```

项目符号列表：

```json
{
  "indent": -22.5,
  "leftMargin": 22.5,
  "bulletStyle": {
    "bulletCharacter": "•",
    "bulletFont": "Arial"
  }
}
```

设置项目符号时，通常同时设置：

- `leftMargin`：正文整体左移距离。
- `indent`：项目符号和正文的相对位置。负数会让项目符号位于正文左侧。
- `bulletCharacter`：项目符号字符。
- `bulletFont`：项目符号字体。

## `r`

```ts
type RunNode = ElementNode & {
  type: "r"
  text: string
  extInfo: {
    property: RunProperty
  }
  children: []
}
```

```ts
type RunProperty = {
  fontSize?: number
  bold?: boolean
  characterSpacing?: number
  fontFamily?: string
  fontColor?: { type: "color"; color: ColorValue }
  highlightColor?: number
  slideNum?: boolean
  lang?: string
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `fontSize` | 数值。 | 设置文本字号。 |
| `bold` | `true` 或缺失。 | 让该文本片段加粗。 |
| `characterSpacing` | 数值。 | 增加字符间距。 |
| `fontFamily` | 字体名称。 | 设置文本片段字体。 |
| `fontColor` | 颜色填充对象。 | 设置文本颜色。 |
| `highlightColor` | 颜色数值。 | 在文字字形后添加高亮。 |
| `slideNum` | `true`。 | 标记该文本片段为页码占位文本。 |
| `lang` | 类似 BCP-47 的语言标签，例如 `zh-CN` 或 `en-US`。 | 帮助字体回退和文本排版。 |

## 富文本组合

一段富文本应该用一个 `p` 包住多个 `r`。每个 `r` 只负责一段连续样式一致的文本。

```json
{
  "id": "text-1",
  "type": "text",
  "depth": 1,
  "point": [80, 80, 360, 120],
  "extInfo": {
    "property": {
      "realType": "TextBox",
      "shapeType": "rect",
      "anchor": [80, 80, 360, 120],
      "fillStyle": { "type": "noFill" },
      "geometry": { "name": "rect", "data": null, "avLst": null, "textBounds": null },
      "textAutofit": "SHAPE",
      "textDirection": "HORIZONTAL",
      "textVerticalAlignment": "TOP",
      "textWordWrap": true,
      "textInsets": [3.6, 7.2, 3.6, 7.2]
    }
  },
  "children": [
    {
      "id": "p-1",
      "pid": "text-1",
      "type": "p",
      "depth": 2,
      "extInfo": {
        "property": {
          "textAlign": "LEFT",
          "leftMargin": 0,
          "lineSpacing": 120
        }
      },
      "children": [
        {
          "id": "r-1",
          "pid": "p-1",
          "type": "r",
          "text": "你好，",
          "depth": 3,
          "extInfo": {
            "property": {
              "fontSize": 18,
              "bold": true,
              "fontFamily": "苹方-简",
              "fontColor": {
                "type": "color",
                "color": { "realColor": -16777216, "color": -16777216 }
              },
              "lang": "zh-CN"
            }
          },
          "children": []
        },
        {
          "id": "r-2",
          "pid": "p-1",
          "type": "r",
          "text": "世界",
          "depth": 3,
          "extInfo": {
            "property": {
              "fontSize": 18,
              "fontFamily": "苹方-简",
              "fontColor": {
                "type": "color",
                "color": { "scheme": "accent1", "realColor": -12028725, "color": -12028725 }
              },
              "highlightColor": -256,
              "lang": "zh-CN"
            }
          },
          "children": []
        }
      ]
    }
  ]
}
```

渲染结果：

- `你好，` 加粗。
- `世界` 使用主题色并带高亮。
- 两段文字在同一段落中连续排版。

## 多段文本

多段文本用多个 `p` 表示。每个段落可以有不同对齐、项目符号和行距。

```json
{
  "children": [
    {
      "id": "p-title",
      "type": "p",
      "depth": 2,
      "extInfo": { "property": { "textAlign": "CENTER", "spaceAfter": 8 } },
      "children": [
        { "id": "r-title", "type": "r", "text": "标题", "depth": 3, "extInfo": { "property": { "fontSize": 28, "bold": true } }, "children": [] }
      ]
    },
    {
      "id": "p-body",
      "type": "p",
      "depth": 2,
      "extInfo": {
        "property": {
          "textAlign": "LEFT",
          "leftMargin": 22.5,
          "indent": -22.5,
          "bulletStyle": { "bulletCharacter": "•", "bulletFont": "Arial" }
        }
      },
      "children": [
        { "id": "r-body", "type": "r", "text": "项目内容", "depth": 3, "extInfo": { "property": { "fontSize": 18 } }, "children": [] }
      ]
    }
  ]
}
```

## 空段落

空段落可以使用：

```json
{
  "id": "p-empty",
  "type": "p",
  "text": "",
  "depth": 2,
  "extInfo": {
    "property": {
      "textAlign": "LEFT",
      "leftMargin": 0
    }
  },
  "children": []
}
```

空段落用于保留换行、占位内容或编辑器光标位置。
