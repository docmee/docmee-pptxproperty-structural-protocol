# 表格对象

表格由三层节点组成：

```text
table
└── tableRow[]
    └── tableColumn[]
        └── p[]
            └── r[]
```

`tableColumn` 表示单元格，而不是物理列。单元格文本使用与普通文本相同的 `p -> r` 结构。

## `table`

```ts
type TableElement = ElementNode & {
  type: "table"
  point: Box
  extInfo: {
    property: TableProperty
  }
  children: TableRowNode[]
}
```

```ts
type TableProperty = {
  anchor: Box
  realType: "table"
  numberOfColumns: number
  numberOfRows: number
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `anchor` | `[x, y, width, height]`。 | 定义完整表格区域。 |
| `realType` | `table`。 | 标记该节点为表格。 |
| `numberOfColumns` | 正整数。 | 定义逻辑列数。 |
| `numberOfRows` | 正整数。 | 定义逻辑行数。 |

`numberOfColumns` 和 `numberOfRows` 描述逻辑网格大小。由于存在合并单元格，实际 `tableRow.children.length` 可以小于 `numberOfColumns`。

## `tableRow`

```ts
type TableRowNode = ElementNode & {
  type: "tableRow"
  extInfo: {
    property: TableRowProperty
  }
  children: TableColumnNode[]
}

type TableRowProperty = {
  rowHeight: number
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `rowHeight` | 大于 `0` 的数值。 | 设置行高。除垂直合并单元格外，同一行内所有单元格都应对齐到该高度。 |

## `tableColumn`

```ts
type TableColumnNode = ElementNode & {
  type: "tableColumn"
  extInfo: {
    rowSpan?: number
    gridSpan?: number
    property: TableCellProperty
  }
  children: ParagraphNode[]
}
```

```ts
type TableCellProperty = {
  realType: "TableCell"
  anchor: Box
  fillStyle?: FillStyle
  strokeStyle?: StrokeStyle
  geometry?: Geometry
  textDirection?: "HORIZONTAL" | "EA_VERTICAL"
  textVerticalAlignment?: "TOP" | "MIDDLE" | "BOTTOM"
  textInsets?: [number, number, number, number]
  columnWidth?: number
  borders?: BorderStyle[]
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `rowSpan` | `extInfo` 中的整数。 | 将该单元格向下合并多行。 |
| `gridSpan` | `extInfo` 中的整数。 | 将该单元格向右合并多列。 |
| `realType` | `TableCell`。 | 标记该节点为表格单元格。 |
| `anchor` | `[x, y, width, height]`。 | 定义实际单元格区域。合并单元格应有更大的宽度或高度。 |
| `fillStyle` | 填充样式。 | 设置单元格背景。 |
| `strokeStyle` | 边框样式。 | 设置默认单元格边框样式。 |
| `geometry` | 通常为 `tableColumn`。 | 定义单元格几何。 |
| `textDirection` | `HORIZONTAL` 或 `EA_VERTICAL`。 | 设置单元格文本方向。 |
| `textVerticalAlignment` | `TOP`、`MIDDLE`、`BOTTOM`。 | 设置文本在单元格内的垂直对齐。 |
| `textInsets` | `[top, right, bottom, left]`。 | 设置单元格文本内边距。 |
| `columnWidth` | 数值。 | 一个逻辑列的基础宽度。 |
| `borders` | `BorderStyle[]`。 | 设置每条边的边框。 |

## 边框

```ts
type BorderStyle = {
  color: ColorValue | null
  lineWidth: number | null
  lineCap: string | null
  lineDash: string | null
  lineCompound: string | null
}
```

`borders` 是四边边框数组。实现方应保持数组顺序稳定，并在自身系统中明确边顺序映射。若边框项字段为 `null`，表示该边使用默认样式或无显式设置。

示例：

```json
{
  "borders": [
    { "color": null, "lineWidth": null, "lineCap": null, "lineDash": null, "lineCompound": null },
    { "color": null, "lineWidth": null, "lineCap": null, "lineDash": null, "lineCompound": null },
    { "color": null, "lineWidth": null, "lineCap": null, "lineDash": null, "lineCompound": null },
    { "color": null, "lineWidth": null, "lineCap": null, "lineDash": null, "lineCompound": null }
  ]
}
```

## 合并单元格

### 水平合并

水平合并使用 `gridSpan`。被合并的单元格只保留左上角主单元格，后续被覆盖的逻辑单元格不再单独出现。

```json
{
  "id": "cell-1",
  "type": "tableColumn",
  "depth": 3,
  "extInfo": {
    "gridSpan": 2,
    "rowSpan": 1,
    "property": {
      "realType": "TableCell",
      "anchor": [100, 80, 200, 40],
      "columnWidth": 100,
      "geometry": { "name": "tableColumn", "data": null, "avLst": null, "textBounds": null },
      "textVerticalAlignment": "TOP",
      "textInsets": [3.6, 7.2, 3.6, 7.2]
    }
  },
  "children": []
}
```

设置效果：

- `gridSpan: 2` 表示该单元格占用两个逻辑列。
- `anchor.width` 应等于被合并列宽之和。
- `columnWidth` 可保留单个基础列宽，便于还原网格。

### 垂直合并

垂直合并使用 `rowSpan`。

```json
{
  "id": "cell-vertical",
  "type": "tableColumn",
  "depth": 3,
  "extInfo": {
    "rowSpan": 2,
    "gridSpan": 1,
    "property": {
      "realType": "TableCell",
      "anchor": [100, 80, 100, 80],
      "geometry": { "name": "tableColumn", "data": null, "avLst": null, "textBounds": null }
    }
  },
  "children": []
}
```

设置效果：

- `rowSpan: 2` 表示该单元格占用两行。
- `anchor.height` 应等于被合并行高之和。
- 被覆盖行中不应再创建对应的独立单元格。

## 单元格文本

单元格内容使用段落和文本片段：

```json
{
  "id": "cell-1",
  "type": "tableColumn",
  "depth": 3,
  "extInfo": {
    "rowSpan": 1,
    "gridSpan": 1,
    "property": {
      "realType": "TableCell",
      "anchor": [100, 80, 100, 40],
      "fillStyle": {
        "type": "color",
        "color": { "scheme": "accent1", "realColor": -12028725, "color": -12028725 }
      },
      "geometry": { "name": "tableColumn", "data": null, "avLst": null, "textBounds": null },
      "textVerticalAlignment": "MIDDLE",
      "textInsets": [3.6, 7.2, 3.6, 7.2],
      "columnWidth": 100
    }
  },
  "children": [
    {
      "id": "cell-p-1",
      "pid": "cell-1",
      "type": "p",
      "depth": 4,
      "extInfo": {
        "property": {
          "textAlign": "CENTER",
          "bulletStyle": { "buNone": true },
          "leftMargin": 0
        }
      },
      "children": [
        {
          "id": "cell-r-1",
          "pid": "cell-p-1",
          "type": "r",
          "text": "表头",
          "depth": 5,
          "extInfo": {
            "property": {
              "fontSize": 18,
              "bold": true,
              "fontColor": {
                "type": "color",
                "color": { "realColor": -1, "color": -1 }
              }
            }
          },
          "children": []
        }
      ]
    }
  ]
}
```

## 校验规则

- `table.children.length` 应等于 `numberOfRows`。
- 每一行可见单元格跨度之和应等于 `numberOfColumns`。
- `rowSpan` 和 `gridSpan` 应为正整数。
- 被合并覆盖的网格位置不应重复创建单元格。
- 单元格 `anchor` 应与表格网格对齐。
- 单元格文本应使用 `p -> r`，避免直接把原始文本放在 `tableColumn` 上。
