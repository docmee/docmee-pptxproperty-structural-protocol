# 页面协议

`page` 描述实际幻灯片页面。页面负责引用母版与版式，并承载当前页的真实对象树。

## 页面结构

```ts
type Page = {
  page: number
  extInfo: PageExtInfo
  children: ElementNode[]
}
```

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `page` | `number` | 是 | 页码。推荐使用从 `1` 开始的正整数。 |
| `extInfo` | `PageExtInfo` | 是 | 页面扩展信息。 |
| `children` | `ElementNode[]` | 是 | 当前页的真实对象数组。 |

## 页面扩展信息

```ts
type PageExtInfo = {
  slideMasterIdx: number
  slideLayoutIdx: number
  background: Background
}
```

| 字段 | 类型 | 是否必填 | 说明 |
| --- | --- | --- | --- |
| `slideMasterIdx` | `number` | 是 | 引用 `slideMasters` 的数组下标。 |
| `slideLayoutIdx` | `number` | 是 | 引用当前母版下 `slideLayouts` 的数组下标。 |
| `background` | `Background` | 是 | 页面级背景。 |

## 页面解析

处理页面时，应按以下顺序解析：

1. 读取顶层 `width` 和 `height`，建立页面画布。
2. 根据 `extInfo.slideMasterIdx` 读取对应 `slideMaster`。
3. 根据 `extInfo.slideLayoutIdx` 读取该母版下的 `slideLayout`。
4. 合成母版背景、版式背景和页面背景。
5. 合成母版占位符、版式占位符和页面真实对象。
6. 遍历 `children` 渲染页面对象树。

## 背景优先级

背景可出现在三个层级：

| 层级 | 字段 | 优先级 |
| --- | --- | --- |
| 母版 | `slideMasters[].background` | 最低 |
| 版式 | `slideMasters[].slideLayouts[].background` | 中等 |
| 页面 | `pages[].extInfo.background` | 最高 |

当多个层级都提供背景时，页面级背景优先。实现方也可以根据业务需要保留全部层级信息，用于编辑器展示或回写。

## 页面对象

`pages[].children` 是页面实际对象列表。每个对象都遵循 [object/README.md](object/README.md) 中的 `ElementNode` 结构。

页面对象可以包含：

| 类型 | 说明 |
| --- | --- |
| `text` | 文本框、占位文本、形状文本。 |
| `image` | 图片对象。 |
| `table` | 表格对象。 |
| `container` | 分组对象。 |

对象的绘制顺序通常与 `children` 数组顺序相关。实现方若需要调整层级，应明确维护对象顺序或引入额外层级字段。

## 校验清单

处理页面前建议验证：

- `slideMasterIdx` 指向存在的 `slideMasters` 元素。
- `slideLayoutIdx` 指向对应母版下存在的 `slideLayouts` 元素。
- `background.anchor` 与画布尺寸匹配或能被目标渲染器正确处理。
- `children` 是数组。
- `children` 中每个对象都有 `id`、`type`、`depth`、`extInfo` 和 `children`。
