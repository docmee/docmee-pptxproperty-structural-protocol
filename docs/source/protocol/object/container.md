# 分组对象

`container` 表示分组对象。分组用于把多个对象作为一个整体移动、缩放或嵌套。

## 结构

```ts
type ContainerElement = ElementNode & {
  type: "container"
  point: Box
  extInfo: {
    property: ContainerProperty
  }
  children: ElementNode[]
}
```

```ts
type ContainerProperty = {
  realType: "Group"
  anchor: Box
  interiorAnchor: Box
  rotation?: number
  shadow?: Shadow
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `realType` | `Group`。 | 标记该对象为分组。 |
| `anchor` | `[x, y, width, height]`。 | 定义分组在父坐标系中的外框。 |
| `interiorAnchor` | `[x, y, width, height]`。 | 定义子对象使用的内层坐标系。 |
| `rotation` | 角度数值。 | 同时旋转分组及其所有子对象。 |
| `shadow` | 公共阴影对象。 | 渲染器支持分组效果时，为分组边界添加阴影。 |

## 坐标模型

分组有两个区域：

| 字段 | 坐标系 | 说明 |
| --- | --- | --- |
| `point` | 父坐标系 | 分组可见外框。 |
| `anchor` | 父坐标系或父级归一化空间 | 分组放置区域。 |
| `interiorAnchor` | 分组内部坐标系 | 映射子对象坐标时使用的基准区域。 |

顶层分组通常使用页面坐标：

```json
{
  "point": [300, 400, 200, 80],
  "extInfo": {
    "property": {
      "realType": "Group",
      "anchor": [300, 400, 200, 80],
      "interiorAnchor": [300, 400, 200, 80]
    }
  }
}
```

嵌套分组或导入数据中可能使用归一化坐标。归一化坐标需要结合父分组尺寸换算。

## 位置

移动分组时，应同步更新：

- `point[0]` / `point[1]`
- `property.anchor[0]` / `property.anchor[1]`

如果分组使用绝对坐标，子对象 `point` 可以保持不变或按同样偏移更新，取决于实现方是否把子对象存储为绝对坐标。推荐策略：

| 存储策略 | 移动分组 | 移动子对象 |
| --- | --- | --- |
| 子对象使用绝对坐标 | 同时更新分组和子对象坐标。 | 是 |
| 子对象使用相对坐标 | 只更新分组坐标。 | 否 |

实现方应在写入时保持同一种策略，避免同一分组内混合绝对和相对坐标。

## 缩放

缩放分组时，应调整 `anchor` / `point` 的宽高，并按比例映射子对象。

```text
scaleX = newGroupWidth / oldGroupWidth
scaleY = newGroupHeight / oldGroupHeight

child.x = group.x + (child.x - oldGroup.x) * scaleX
child.y = group.y + (child.y - oldGroup.y) * scaleY
child.width = child.width * scaleX
child.height = child.height * scaleY
```

如果子对象使用归一化坐标，缩放只需要更新父分组 `anchor` / `point`，子对象归一化坐标保持不变。

## 嵌套分组

分组可以嵌套：

```json
{
  "id": "group-1",
  "type": "container",
  "depth": 1,
  "point": [100, 100, 400, 120],
  "extInfo": {
    "property": {
      "realType": "Group",
      "anchor": [100, 100, 400, 120],
      "interiorAnchor": [100, 100, 400, 120]
    }
  },
  "children": [
    {
      "id": "group-2",
      "pid": "group-1",
      "type": "container",
      "depth": 2,
      "point": [120, 110, 180, 80],
      "extInfo": {
        "property": {
          "realType": "Group",
          "anchor": [120, 110, 180, 80],
          "interiorAnchor": [120, 110, 180, 80]
        }
      },
      "children": []
    }
  ]
}
```

嵌套分组解析时，应从外到内逐层建立坐标系。

## 包含文本子对象的分组

```json
{
  "id": "group-1",
  "type": "container",
  "depth": 1,
  "point": [80, 420, 360, 60],
  "extInfo": {
    "property": {
      "realType": "Group",
      "anchor": [80, 420, 360, 60],
      "interiorAnchor": [80, 420, 360, 60]
    }
  },
  "children": [
    {
      "id": "label-1",
      "pid": "group-1",
      "type": "text",
      "depth": 2,
      "point": [80, 420, 170, 60],
      "extInfo": {
        "property": {
          "realType": "Auto",
          "shapeType": "rect",
          "anchor": [80, 420, 170, 60],
          "fillStyle": { "type": "color", "color": { "realColor": -12028725, "color": -12028725 } },
          "geometry": { "name": "rect", "data": null, "avLst": null, "textBounds": null },
          "textVerticalAlignment": "MIDDLE",
          "textInsets": [3.6, 7.2, 3.6, 7.2]
        }
      },
      "children": []
    }
  ]
}
```

## 限制

- 除非分组是临时编辑产物，否则 `container.children` 不应为空。
- `anchor.width` 和 `anchor.height` 应大于 `0`。
- 子对象 `pid` 应指向分组 id。
- 移动和缩放分组时，应保持子对象顺序不变。
- 如果分组有旋转，子对象命中测试和渲染应先应用分组变换，再应用子对象自身变换。
