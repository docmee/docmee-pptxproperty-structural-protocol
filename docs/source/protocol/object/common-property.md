# 对象公共属性

本文档描述多个对象类型共享的 `extInfo.property` 字段。具体对象文档只说明对象专有字段；遇到公共字段时应以本文为准。

## 属性位置

对象样式通常位于：

```text
ElementNode.extInfo.property
```

例如：

```json
{
  "type": "text",
  "point": [80, 60, 320, 120],
  "extInfo": {
    "property": {
      "realType": "TextBox",
      "anchor": [80, 60, 320, 120],
      "rotation": 15,
      "fillStyle": { "type": "color", "color": { "realColor": -1, "color": -1 } }
    }
  },
  "children": []
}
```

## `realType`

```ts
type RealType =
  | "Auto"
  | "TextBox"
  | "Picture"
  | "table"
  | "TableCell"
  | "Group"
  | "Background"
```

| 值 | 适用对象 | 说明 |
| --- | --- | --- |
| `Auto` | `text` | 自动形状文本或占位符文本。 |
| `TextBox` | `text` | 显式文本框。 |
| `Picture` | `image` | 图片对象。音频/视频封面也可以使用该类型。 |
| `table` | `table` | 表格对象。 |
| `TableCell` | `tableColumn` | 表格单元格。 |
| `Group` | `container` | 分组对象。 |
| `Background` | 背景 | 背景。 |

`type` 决定节点协议，`realType` 决定该节点在 PPTX 语义中的真实形态。实现方不应只依赖 `realType` 判断对象类型，因为文本、形状、占位符都可能使用相近的真实类型。

## `anchor`

```ts
type Box = [x: number, y: number, width: number, height: number]
```

`anchor` 描述对象的几何区域。它与节点级 `point` 都是 `[x, y, width, height]`，但用途不同：

| 字段 | 作用 |
| --- | --- |
| `point` | 对象在当前坐标系中的外框，主要用于布局和快速定位。 |
| `property.anchor` | 对象真实几何锚点，生成 PPTX 或精确渲染时应使用该字段。 |

顶层对象的 `point` 和 `anchor` 通常一致。分组内部对象的 `anchor` 可以是相对坐标或归一化坐标，需要结合父分组的 `interiorAnchor` 转换。

### 设置位置和尺寸

```json
{
  "point": [100, 80, 240, 120],
  "extInfo": {
    "property": {
      "anchor": [100, 80, 240, 120]
    }
  }
}
```

- `x`、`y` 决定对象左上角。
- `width`、`height` 决定对象尺寸。
- 宽高应大于 `0`。宽高为 `0` 时对象不可见或无法被正确选择。
- 负坐标可以表示对象部分位于页面外，但第三方渲染器应明确是否支持。

## `rotation`

```ts
type Rotation = number
```

`rotation` 表示对象绕自身中心旋转的角度，单位为度。正值通常表示顺时针旋转。

```json
{
  "rotation": 45
}
```

设置效果：

| 值 | 效果 |
| --- | --- |
| `0` 或缺失 | 不旋转。 |
| `45` | 顺时针旋转 45 度。 |
| `90` | 旋转为竖向。 |
| `-30` | 逆时针旋转 30 度。 |

建议将角度规范化到 `-360..360` 或 `0..360`，避免不同渲染器对大角度值处理不一致。

## `shapeType`

`shapeType` 描述对象外框形状。当前常用值为 `rect`。当对象需要以圆角矩形、椭圆或其他形状裁剪时，可扩展为对应形状名称。

```json
{
  "shapeType": "rect"
}
```

`shapeType` 应与 `geometry.name` 保持一致。若两者冲突，建议以 `geometry.name` 作为精确几何，以 `shapeType` 作为快速分类。

## `geometry`

```ts
type Geometry = {
  name: string
  data: unknown | null
  avLst: unknown | null
  textBounds: unknown | null
}
```

| 字段 | 说明 |
| --- | --- |
| `name` | 几何类型，例如 `rect`、`tableColumn`。 |
| `data` | 自定义路径或几何数据。没有自定义几何时为 `null`。 |
| `avLst` | 形状调节点列表。没有调节点时为 `null`。 |
| `textBounds` | 文本边界信息。没有额外文本边界时为 `null`。 |

`geometry` 决定对象实际轮廓。对于图片对象，几何会影响图片裁剪范围；对于文本对象，几何会影响背景填充、边框和文本排版区域。

## `placeholder`

```ts
type Placeholder = {
  type: string
  idx?: number
  size?: string
  visible: boolean
}
```

| 字段 | 说明 |
| --- | --- |
| `type` | 占位符语义，例如 `TITLE`、`BODY`、`CENTERED_TITLE`、`SUBTITLE`、`CONTENT`、`PICTURE`、`DATETIME`、`FOOTER`、`SLIDE_NUMBER`。 |
| `idx` | 占位符索引。同一版式内多个相同类型占位符用它区分。 |
| `size` | 占位符尺寸级别，例如 `half`、`quarter`。 |
| `visible` | 占位符是否可见。 |

设置方式：

```json
{
  "placeholder": {
    "type": "TITLE",
    "visible": false
  }
}
```

使用限制：

- `placeholder` 主要用于母版、版式和页面中的占位文本或占位内容对象。
- `idx` 应在同一版式范围内稳定，便于页面对象与占位符匹配。
- `visible: false` 表示占位符默认不作为实物内容展示；编辑器仍可使用它提供插入位置和默认样式。

## `fillStyle`

```ts
type FillStyle =
  | { type: "noFill" }
  | { type: "color"; color: ColorValue }
  | { type: "gradient"; gradient: GradientFill }
  | { type: "texture"; texture: TextureFill }
```

`fillStyle` 控制对象内部填充。文本框、形状、表格单元格、背景和图片都可以使用填充。图片对象通常使用 `texture` 填充。

### 无填充

```json
{
  "fillStyle": { "type": "noFill" }
}
```

效果：对象内部透明，只显示文本、边框或子内容。适用于无背景文本框。

限制：

- `noFill` 不应同时带 `color`、`gradient` 或 `texture`。
- 若对象没有边框也没有文本，`noFill` 会让对象不可见，但对象仍可能可被选中。

### 纯色填充

```json
{
  "fillStyle": {
    "type": "color",
    "color": {
      "scheme": "accent1",
      "realColor": -12028725,
      "color": -12028725
    }
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `scheme` | 可选。引用主题色槽位。 |
| `realColor` | 实际渲染颜色。 |
| `color` | 原始颜色或主题基础颜色。 |
| `alpha` | 可选。透明度，范围建议 `0..100000`，值越大越不透明。 |
| `lumMod` | 可选。亮度乘数。 |
| `lumOff` | 可选。亮度偏移。 |
| `shade` | 可选。变暗比例。 |
| `tint` | 可选。变亮比例。 |

设置效果：

- 只设置 `realColor` / `color`：使用纯色。
- 设置 `scheme`：颜色可随主题变化。
- 设置 `alpha`：颜色半透明，能看到底层内容。
- 设置 `lumMod` / `lumOff`：在主题色基础上变亮或变暗。

`realColor` 和 `color` 都使用核心协议中的 32 位有符号 ARGB 十进制颜色。常用转换示例：

- `#FFFFFF` 写为 `-1`。
- `#000000` 写为 `-16777216`。
- `#4874CB` 写为 `-12028725`。
- `rgba(0,0,0,0.17)` 可写为 `realColor: 721420288`，并同时写入 `alpha: 17000` 保留透明度语义。

具体换算公式、十六进制和 `rgba()` 的处理规则见 [../core.md](../core.md) 的“颜色”章节。

### 渐变填充

```json
{
  "fillStyle": {
    "type": "gradient",
    "gradient": {
      "angle": 90,
      "colors": [
        { "realColor": -1, "color": -1 },
        { "realColor": -12028725, "color": -12028725 }
      ],
      "fractions": [0, 1],
      "gradientType": "linear",
      "insets": null,
      "flip": null,
      "tileRect": null,
      "rotWithShape": null
    }
  }
}
```

| 字段 | 说明 |
| --- | --- |
| `angle` | 渐变角度。常用于线性渐变方向。 |
| `colors` | 渐变色标数组。 |
| `fractions` | 色标位置数组，长度应与 `colors` 一致。通常使用 `0..1`。 |
| `gradientType` | 渐变类型，例如 `linear`。 |
| `insets` | 渐变区域内缩。没有内缩时为 `null`。 |
| `flip` | 翻转模式。没有翻转时为 `null`。 |
| `tileRect` | 平铺区域。没有平铺时为 `null`。 |
| `rotWithShape` | 是否随形状旋转。 |

限制：

- `colors.length` 与 `fractions.length` 应一致。
- `fractions` 应按从小到大排列。
- 只有当目标渲染器支持渐变时才应使用复杂渐变；否则建议降级为首个色标或平均色。

### 纹理填充

```ts
type TextureFill = {
  imageData: string
  contentType: string
  alpha: number
  flipMode: string
  stretch?: [left: number, top: number, right: number, bottom: number]
  insets?: [left: number, top: number, right: number, bottom: number]
  offset?: [x: number, y: number]
  scale?: [x: number, y: number]
  alignment?: string
  alphaModFix?: number
  rotWithShape?: boolean
}
```

| 字段 | 说明 |
| --- | --- |
| `imageData` | 图片资源。可以是 URL，也可以是 `data:image/...;base64,...`。 |
| `contentType` | MIME 类型，例如 `image/png`、`image/jpeg`。 |
| `alpha` | 图片透明度，`100000` 表示完全不透明。 |
| `flipMode` | 翻转模式。常用 `NONE`。 |
| `stretch` | 拉伸填充参数。通常 `[0,0,0,0]` 表示完整图片拉伸到对象区域。 |
| `insets` | 裁剪内缩参数。常用于图片裁剪。 |
| `offset` | 平铺或缩放时的偏移。 |
| `scale` | 平铺或缩放时的比例。 |
| `alignment` | 对齐方式，例如 `CENTER`。 |
| `alphaModFix` | 透明度修正值。 |
| `rotWithShape` | 是否随对象旋转。 |

#### 拉伸图片填充

```json
{
  "type": "texture",
  "texture": {
    "imageData": "data:image/png;base64,...",
    "contentType": "image/png",
    "alpha": 100000,
    "flipMode": "NONE",
    "stretch": [0, 0, 0, 0]
  }
}
```

效果：图片被拉伸填满对象区域。对象宽高比与图片宽高比不一致时，图片会被压缩或拉伸变形。

#### 裁剪图片填充

```json
{
  "type": "texture",
  "texture": {
    "imageData": "data:image/png;base64,...",
    "contentType": "image/png",
    "alpha": 100000,
    "flipMode": "NONE",
    "insets": [71667, 0, 0, 48134]
  }
}
```

效果：先按 `insets` 裁剪图片，再填充到对象区域。裁剪值通常使用 PPTX 百分比单位，正值表示从对应边向内裁剪。

#### 平铺或缩放图片填充

```json
{
  "type": "texture",
  "texture": {
    "imageData": "https://example.com/image.jpg",
    "contentType": "image/jpeg",
    "alpha": 100000,
    "flipMode": "NONE",
    "offset": [0, 0],
    "scale": [0.1, 0.1],
    "alignment": "CENTER",
    "rotWithShape": true
  }
}
```

效果：图片按 `scale` 缩放后填充对象，可结合 `offset` 和 `alignment` 控制位置。适用于纹理、图案或保持图片原始比例的场景。

限制：

- `stretch` 和 `scale` / `offset` 不建议同时使用。若同时出现，应明确一个优先级。
- `imageData` 为远程 URL 时，渲染端需要具备下载和缓存能力。
- `alpha`、`alphaModFix` 都会影响透明度，合成时应避免重复应用。

## `strokeStyle`

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

| 字段 | 说明 |
| --- | --- |
| `paint` | 线条填充。使用 `{ "type": "noFill" }` 表示无边框。 |
| `lineWidth` | 线宽。值越大边框越粗。 |
| `lineCap` | 线端样式，例如 `FLAT`。 |
| `lineJoin` | 转角连接样式，例如 `ROUND`。 |
| `lineDash` | 虚线样式，例如 `SOLID`。 |
| `lineCompound` | 复合线样式，例如 `SINGLE`、`DOUBLE`。 |

示例：

```json
{
  "strokeStyle": {
    "paint": {
      "type": "color",
      "color": { "realColor": -16777216, "color": -16777216 }
    },
    "lineWidth": 2,
    "lineDash": "SOLID",
    "lineCompound": "SINGLE"
  }
}
```

## `shadow`

`shadow` 表示对象阴影。文本框、图片、形状、表格单元格等可视对象都可以支持阴影。

```ts
type Shadow = {
  algn?: string
  blur?: number
  angle?: number
  distance?: number
  rotWithShape?: boolean
  scaleX?: number
  scaleY?: number
  fillStyle: FillStyle
}
```

| 字段 | 说明 |
| --- | --- |
| `algn` | 阴影相对对象的对齐位置。例如 `t` 表示顶部方向的对齐基准。 |
| `blur` | 模糊半径。值越大，阴影边缘越柔和。 |
| `angle` | 阴影方向角度。 |
| `distance` | 阴影相对对象的偏移距离。 |
| `rotWithShape` | 对象旋转时阴影是否一起旋转。 |
| `scaleX` | 阴影横向缩放比例。大于 `1` 时阴影比对象更宽。 |
| `scaleY` | 阴影纵向缩放比例。大于 `1` 时阴影比对象更高。 |
| `fillStyle` | 阴影颜色和透明度。通常使用半透明颜色填充。 |

示例：

```json
{
  "shadow": {
    "algn": "t",
    "blur": 47,
    "angle": 90,
    "distance": 4,
    "rotWithShape": false,
    "scaleX": 1.08,
    "scaleY": 1.08,
    "fillStyle": {
      "type": "color",
      "color": {
        "realColor": 721420288,
        "color": -16777216,
        "alpha": 17000
      }
    }
  }
}
```

设置效果：

- 增大 `blur`：阴影更柔和，扩散范围更大。
- 增大 `distance`：阴影离对象更远，方向由 `angle` 决定。
- 设置较低 `alpha`：阴影更淡。
- 设置 `scaleX` / `scaleY` 大于 `1`：阴影面积略大于对象，类似外阴影。

限制：

- `fillStyle` 应使用颜色填充。渐变或图片阴影可能无法被所有渲染器支持。
- `blur` 和 `distance` 不建议使用负数。
- 如果对象本身透明或无填充，阴影仍应按对象几何轮廓计算。

## `effectLst`

```ts
type EffectList = Record<string, unknown>
```

`effectLst` 用于保留额外效果列表。当前可为空对象。第三方实现如果不能识别其中的效果，应保留原值并透传。

## `hyperlink`

```ts
type Hyperlink = {
  type: string
  label?: string
  address: string
  action?: string
}
```

| 字段 | 说明 |
| --- | --- |
| `type` | 链接类型，例如 `URL`。 |
| `label` | 链接显示名称。可以为空字符串。 |
| `address` | 链接地址或动作地址。 |
| `action` | 动作指令。媒体播放可使用 `ppaction://media`。 |

示例：

```json
{
  "hyperlink": {
    "type": "URL",
    "label": "",
    "address": "ppaction://media",
    "action": "ppaction://media"
  }
}
```

媒体对象通常使用 `ppaction://media` 触发播放行为。普通网页跳转可把 `address` 设置为 URL。
