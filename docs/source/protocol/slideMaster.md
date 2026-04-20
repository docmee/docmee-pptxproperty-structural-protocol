# 幻灯片母版协议

`slideMaster` 描述幻灯片母版、版式、主题、颜色映射和母版占位对象。页面通过索引引用母版和版式。

## 母版结构

```ts
type SlideMaster = {
  background: Background
  clrMap: ColorMap
  theme: Theme
  children: ElementNode[]
  slideLayouts: SlideLayout[]
  animation: unknown | null
  transition: unknown | null
}
```

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `background` | `Background` | 是 | 母版默认背景。 |
| `clrMap` | `ColorMap` | 是 | 主题颜色映射。 |
| `theme` | `Theme` | 是 | 主题名称、主题颜色和字体映射。 |
| `children` | `ElementNode[]` | 是 | 母版级占位对象。 |
| `slideLayouts` | `SlideLayout[]` | 是 | 母版下的版式集合。 |
| `animation` | `unknown | null` | 是 | 母版动画信息。没有动画时为 `null`。 |
| `transition` | `unknown | null` | 是 | 母版切换信息。没有切换时为 `null`。 |

## 颜色映射

```ts
type ColorMap = Record<string, string>
```

`clrMap` 用于把文档语义色映射到主题色槽位。例如：

```json
{
  "tx1": "dk1",
  "bg2": "lt2",
  "bg1": "lt1",
  "tx2": "dk2"
}
```

| 键 | 说明 |
| --- | --- |
| `tx1` | 主文本色映射。 |
| `tx2` | 次文本色映射。 |
| `bg1` | 主背景色映射。 |
| `bg2` | 次背景色映射。 |

## 主题

```ts
type Theme = {
  name: string
  colors: Record<string, number>
  majorFontMap: FontMap
  minorFontMap: FontMap
}

type FontMap = {
  latin: string
  ea: string
  cs: string
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 主题名称。 |
| `colors` | `Record<string, number>` | 主题色表。常见键包括 `accent1` 到 `accent6`、`lt1`、`lt2`、`dk1`、`dk2`、`tx1`、`tx2`、`bg1`、`bg2`、`hlink`、`folHlink`。 |
| `majorFontMap` | `FontMap` | 主字体映射，通常用于标题。 |
| `minorFontMap` | `FontMap` | 次字体映射，通常用于正文。 |

| 字体映射字段 | 说明 |
| --- | --- |
| `latin` | 西文字体。 |
| `ea` | 东亚字体。 |
| `cs` | 复杂文字字体。 |

## 版式结构

```ts
type SlideLayout = {
  type: string
  name: string
  noMaster: boolean | null
  clrMap: ColorMap | null
  background: Background
  children: ElementNode[]
  animation: unknown | null
  transition: unknown | null
}
```

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `type` | `string` | 是 | 版式类型。 |
| `name` | `string` | 是 | 版式名称。 |
| `noMaster` | `boolean | null` | 是 | 是否不继承母版。为 `null` 时按默认继承规则处理。 |
| `clrMap` | `ColorMap | null` | 是 | 版式级颜色映射。为 `null` 时使用母版颜色映射。 |
| `background` | `Background` | 是 | 版式背景。 |
| `children` | `ElementNode[]` | 是 | 版式占位对象。 |
| `animation` | `unknown | null` | 是 | 版式动画信息。没有动画时为 `null`。 |
| `transition` | `unknown | null` | 是 | 版式切换信息。没有切换时为 `null`。 |

## 版式类型

常见 `slideLayout.type` 包括：

| 类型 | 说明 |
| --- | --- |
| `TITLE` | 标题页。 |
| `TITLE_AND_CONTENT` | 标题和内容。 |
| `SECTION_HEADER` | 章节标题页。 |
| `TWO_OBJ` | 双内容区。 |
| `TWO_TX_TWO_OBJ` | 对比版式。 |
| `TITLE_ONLY` | 仅标题。 |
| `BLANK` | 空白页。 |
| `VERT_TITLE_AND_TX` | 竖排标题与文本。 |
| `CUST` | 自定义版式。 |

## 母版和版式对象

`slideMasters[].children` 和 `slideMasters[].slideLayouts[].children` 使用与页面对象相同的 `ElementNode` 结构。它们通常用于表示占位符、页脚、日期、页码和默认文本样式。

占位对象通常具有以下特征：

- `type` 多为 `text`。
- `noDraw` 可以为 `true`，表示该节点作为模板或占位定义存在。
- `extInfo.property.placeholder` 描述占位符语义。
- 文本样式可通过 `p` 和 `r` 子节点提供默认段落样式和字符样式。

## 占位符解析

页面生成或渲染时，可以按以下顺序处理占位符：

1. 读取母版 `children`，建立全局占位符集合。
2. 读取版式 `children`，覆盖或补充母版占位符集合。
3. 读取页面 `children`，用真实页面对象替换对应占位符。
4. 对没有被页面对象替换的占位符，根据 `visible` 和 `noDraw` 决定是否渲染。

占位符匹配时可结合 `placeholder.type`、`placeholder.idx` 和对象层级判断。
