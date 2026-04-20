# 核心协议

`core` 描述 `pptxProperty` 的顶层结构、全局约定和跨模块复用的通用类型。

## 顶层结构

```ts
type PptxProperty = {
  version: string
  width: number
  height: number
  font: FontResource[]
  pages: Page[]
  slideMasters: SlideMaster[]
}
```

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `version` | `string` | 是 | 协议版本。 |
| `width` | `number` | 是 | 页面画布宽度。 |
| `height` | `number` | 是 | 页面画布高度。 |
| `font` | `FontResource[]` | 是 | 全局字体资源列表。没有字体资源时使用空数组。 |
| `pages` | `Page[]` | 是 | 实际页面数组。 |
| `slideMasters` | `SlideMaster[]` | 是 | 幻灯片母版数组。每个母版可以包含多个 `slideLayouts`。 |

```ts
type FontResource = Record<string, unknown>
```

## 索引关系

页面通过下标引用母版和版式：

```text
pages[n].extInfo.slideMasterIdx
  -> slideMasters[slideMasterIdx]

pages[n].extInfo.slideLayoutIdx
  -> slideMasters[slideMasterIdx].slideLayouts[slideLayoutIdx]
```

实现方应保持 `slideMasters` 和 `slideLayouts` 的顺序稳定。若需要过滤、排序或重建数组，应同步更新所有页面上的 `slideMasterIdx` 与 `slideLayoutIdx`。

## 坐标约定

```ts
type Box = [x: number, y: number, width: number, height: number]
```

| 字段 | 格式 | 说明 |
| --- | --- | --- |
| `point` | `Box` | 对象在页面坐标系中的外框。 |
| `anchor` | `Box` | 属性内的几何锚点。顶层对象通常与 `point` 一致。 |
| `interiorAnchor` | `Box` | 分组内部坐标系区域。 |
| `textInsets` | `[top, right, bottom, left]` | 文本内边距。 |

页面坐标原点位于左上角，`x` 向右增加，`y` 向下增加。`width` 和 `height` 使用与顶层画布一致的单位。

分组对象内部可以出现相对坐标或归一化坐标。渲染分组对象时，应先建立分组坐标系，再解析其子对象位置。

## 通用节点约定

所有对象节点都使用 `children` 表达树形关系。没有子节点时，`children` 使用空数组。

```ts
type ElementNode = {
  id: string
  pid?: string
  type: string
  depth: number
  point?: Box
  noDraw?: boolean
  text?: string
  extInfo: Record<string, unknown>
  children: ElementNode[]
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | 节点唯一标识。 |
| `pid` | `string` | 父节点 id。顶层页面对象可以没有该字段。 |
| `type` | `string` | 节点类型。 |
| `depth` | `number` | 节点深度。页面直接子对象通常为 `1`。 |
| `point` | `Box` | 对象外框。结构性节点可以没有该字段。 |
| `noDraw` | `boolean` | 为 `true` 时表示该节点不直接绘制，常用于母版或版式占位符。 |
| `text` | `string` | 文本内容。主要用于段落节点和文本片段节点。 |
| `extInfo` | `object` | 扩展信息。对象样式和行为主要位于 `extInfo.property`。 |
| `children` | `ElementNode[]` | 子节点数组。 |

## 背景

```ts
type Background = {
  realType: "Background"
  anchor: Box
  fillStyle: FillStyle
  strokeStyle: StrokeStyle
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `realType` | `"Background"` | 标识背景属性。 |
| `anchor` | `Box` | 背景覆盖区域，通常覆盖完整画布。 |
| `fillStyle` | `FillStyle` | 背景填充。 |
| `strokeStyle` | `StrokeStyle` | 背景边框。没有边框时可为空对象。 |

## 颜色

```ts
type ColorValue = {
  scheme?: string
  realColor: number
  color: number
  lumMod?: number
  lumOff?: number
  shade?: number
  tint?: number
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `scheme` | `string` | 主题色引用，例如 `accent1`、`tx1`、`bg1`。 |
| `realColor` | `number` | 计算后的实际颜色值。 |
| `color` | `number` | 原始颜色值或主题基础颜色值。 |
| `lumMod` | `number` | 亮度乘数。 |
| `lumOff` | `number` | 亮度偏移。 |
| `shade` | `number` | 阴影或变暗比例。 |
| `tint` | `number` | 着色或变亮比例。 |

颜色使用 32 位有符号整数表示。协议中的 `realColor` 和 `color` 存储的是 ARGB 整数，即高 8 位为透明通道，后 24 位依次为红、绿、蓝通道。常见不透明颜色可以理解为 `0xFFRRGGBB` 转成有符号十进制后的结果。

换算步骤如下：

1. 从输入颜色得到 `R`、`G`、`B`，每个通道范围为 `0..255`。
2. 从输入透明度得到 `A`，范围也是 `0..255`。没有透明度时使用 `255`。
3. 组合无符号整数：`argb = (A << 24) | (R << 16) | (G << 8) | B`。
4. 如果 `argb >= 2147483648`，写入协议时使用 `argb - 4294967296`；否则直接写入 `argb`。

从十六进制颜色转换时：

- `#RRGGBB`：`A = 255`，再按 `0xFFRRGGBB` 组合。
- `#RGB`：先展开为 `#RRGGBB`，例如 `#0AF` 等同于 `#00AAFF`。
- `#RRGGBBAA`：若来源明确使用 CSS 八位十六进制格式，则最后两位是透明通道，需要转换成协议使用的 `AARRGGBB` 再写入十进制值。
- 不建议混用未标明来源的八位十六进制颜色，因为有些系统使用 `#AARRGGBB`，有些系统使用 `#RRGGBBAA`。

从 `rgba(r,g,b,a)` 转换时：

- `r`、`g`、`b` 直接作为 `R`、`G`、`B`。
- CSS 中的 `a` 通常为 `0..1`，换算为 `A = round(a * 255)`。
- 协议中的独立 `alpha` 字段使用 `0..100000`，可写为 `round(a * 100000)`；`100000` 表示完全不透明，`0` 表示完全透明。

常见示例：

| 输入 | ARGB 十六进制 | 协议十进制 |
| --- | --- | --- |
| `#FFFFFF` | `0xFFFFFFFF` | `-1` |
| `#000000` | `0xFF000000` | `-16777216` |
| `#4874CB` | `0xFF4874CB` | `-12028725` |
| `rgba(0,0,0,0.17)` | `0x2B000000` | `721420288` |

实现方可以按自身语言的颜色工具转换为 RGB 或 ARGB，但应保留原始数值以便回写。

## 填充样式

```ts
type FillStyle =
  | { type: "noFill" }
  | { type: "color"; color: ColorValue }
  | { type: "gradient"; gradient: GradientFill }
  | { type: "texture"; texture: TextureFill }
```

| `type` | 说明 |
| --- | --- |
| `noFill` | 无填充。 |
| `color` | 纯色填充。 |
| `gradient` | 渐变填充。 |
| `texture` | 图片或纹理填充。 |

### 渐变填充

```ts
type GradientFill = {
  angle: number
  colors: ColorValue[]
  fractions: number[]
  gradientType: string
  insets: number[] | null
  flip: string | null
  tileRect: number[] | null
  rotWithShape: boolean | null
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `angle` | `number` | 渐变角度。 |
| `colors` | `ColorValue[]` | 渐变色标。 |
| `fractions` | `number[]` | 色标位置，顺序与 `colors` 对应。 |
| `gradientType` | `string` | 渐变类型，例如 `linear`。 |
| `insets` | `number[] | null` | 渐变区域内缩。 |
| `flip` | `string | null` | 翻转模式。 |
| `tileRect` | `number[] | null` | 平铺区域。 |
| `rotWithShape` | `boolean | null` | 是否随形状旋转。 |

### 纹理填充

```ts
type TextureFill = {
  imageData: string
  contentType: string
  alpha: number
  flipMode: string
  stretch?: number[]
  insets?: number[]
  offset?: [number, number]
  scale?: [number, number]
  alignment?: string
  alphaModFix?: number
  rotWithShape?: boolean
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `imageData` | `string` | 图片资源，可以是 URL 或 `data:image/...;base64,...`。 |
| `contentType` | `string` | MIME 类型，例如 `image/png`、`image/jpeg`。 |
| `alpha` | `number` | 纹理透明度。`100000` 表示完全不透明。 |
| `flipMode` | `string` | 翻转模式。 |
| `stretch` | `number[]` | 拉伸或裁切参数。 |
| `insets` | `number[]` | 图片裁切内缩参数。 |
| `offset` | `[number, number]` | 纹理偏移。 |
| `scale` | `[number, number]` | 纹理缩放。 |
| `alignment` | `string` | 对齐方式。 |
| `alphaModFix` | `number` | 透明度修正值。 |
| `rotWithShape` | `boolean` | 是否随形状旋转。 |

## 边框样式

```ts
type StrokeStyle = {
  paint?: FillStyle
  lineWidth?: number
  lineCap?: string
  lineJoin?: string
  lineDash?: string
  lineCompound?: string
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `paint` | `FillStyle` | 线条填充。 |
| `lineWidth` | `number` | 线宽。 |
| `lineCap` | `string` | 线端样式。 |
| `lineJoin` | `string` | 连接样式。 |
| `lineDash` | `string` | 虚线样式。 |
| `lineCompound` | `string` | 复合线样式。 |

## 几何

```ts
type Geometry = {
  name: string
  data: unknown | null
  avLst: unknown | null
  textBounds: unknown | null
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | 几何类型名称，例如 `rect`、`tableColumn`。 |
| `data` | `unknown | null` | 自定义几何数据。 |
| `avLst` | `unknown | null` | 可调参数列表。 |
| `textBounds` | `unknown | null` | 文本边界信息。 |

## 占位符

```ts
type Placeholder = {
  type: string
  idx?: number
  size?: string
  visible: boolean
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `type` | `string` | 占位符类型，例如 `TITLE`、`BODY`、`CENTERED_TITLE`、`SUBTITLE`、`CONTENT`、`PICTURE`、`DATETIME`、`FOOTER`、`SLIDE_NUMBER`。 |
| `idx` | `number` | 占位符索引。 |
| `size` | `string` | 占位符尺寸级别，例如 `half`、`quarter`。 |
| `visible` | `boolean` | 占位符是否可见。 |

## 兼容性要求

- 字段名必须按协议原样读取和写入。
- 未识别字段应保留透传。
- 数组顺序具有语义，尤其是 `pages`、`slideMasters`、`slideLayouts` 和对象 `children`。
- 对象渲染应优先基于 `type` 分派，再解析对应的 `extInfo.property`。
- `null` 与字段缺失应区别处理。`null` 通常表示该结构被显式保留但当前没有值。
