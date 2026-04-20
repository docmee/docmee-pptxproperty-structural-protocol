# 图片对象

`image` 表示图片对象。它也可以作为音频或视频媒体的封面对象，媒体资源通过额外字段挂在 `extInfo.property` 上。

## 结构

```ts
type ImageElement = ElementNode & {
  type: "image"
  point: Box
  extInfo: {
    property: ImageProperty
  }
  children: []
}
```

```ts
type ImageProperty = {
  realType: "Picture"
  shapeType: string
  anchor: Box
  rotation?: number
  fillStyle: { type: "texture"; texture: TextureFill }
  geometry: Geometry
  shadow?: Shadow
  hyperlink?: Hyperlink
  fileName?: string
  image: string
  clipping?: [left: number, top: number, right: number, bottom: number]
  extension?: string
  contentType?: string
  imageAlpha?: number
  fillAlpha?: number
  audio?: string
  video?: string
  extContentType?: string
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `realType` | `Picture`。 | 标记该对象为图片形状。 |
| `shapeType` | 通常为 `rect`。 | 定义外部裁剪形状。 |
| `anchor` | `[x, y, width, height]`。 | 设置图片位置和尺寸。 |
| `rotation` | 角度数值。 | 旋转图片对象。 |
| `fillStyle` | 纹理填充。 | 提供实际显示的图片像素。 |
| `geometry` | 通常为 `rect`。 | 定义图片轮廓。 |
| `shadow` | 公共阴影对象。 | 添加图片阴影。 |
| `hyperlink` | 超链接对象。 | 添加点击动作；媒体对象使用 `ppaction://media`。 |
| `fileName` | 文件名。 | 保留源文件身份。 |
| `image` | URL 或 `data:image/...`。 | 主图片资源。 |
| `clipping` | 四数值裁剪数组。 | 显示前裁剪图片。 |
| `extension` | 文件扩展名。 | 辅助导出和 MIME 推断。 |
| `contentType` | MIME 类型。 | 描述图片类型。 |
| `imageAlpha` | `0..100000`。 | 控制图片不透明度。 |
| `fillAlpha` | `0..100000`。 | 控制纹理填充不透明度。 |
| `audio` | `data:audio/...` 或 URL。 | 让该图片表示音频对象。 |
| `video` | `data:video/...` 或 URL。 | 让该图片表示视频对象。 |
| `extContentType` | MIME 类型。 | 描述外部媒体类型，例如 `audio/mp3`。 |

## 基础图片

```json
{
  "id": "image-1",
  "type": "image",
  "depth": 1,
  "point": [100, 80, 200, 120],
  "extInfo": {
    "property": {
      "realType": "Picture",
      "shapeType": "rect",
      "anchor": [100, 80, 200, 120],
      "fillStyle": {
        "type": "texture",
        "texture": {
          "imageData": "https://example.com/image.png",
          "contentType": "image/png",
          "alpha": 100000,
          "flipMode": "NONE",
          "stretch": [0, 0, 0, 0]
        }
      },
      "geometry": { "name": "rect", "data": null, "avLst": null, "textBounds": null },
      "fileName": "image.png",
      "image": "https://example.com/image.png",
      "extension": ".png",
      "contentType": "image/png",
      "imageAlpha": 100000,
      "fillAlpha": 100000
    }
  },
  "children": []
}
```

## 图片资源字段

除非有意区分缩略图和原图，否则 `image` 与 `fillStyle.texture.imageData` 应指向同一份视觉资源。

| 字段 | 推荐用途 |
| --- | --- |
| `image` | 需要读取图片内容的消费端使用的主资源。 |
| `fillStyle.texture.imageData` | 形状填充或渲染逻辑使用的资源。 |
| `fileName` | 可获得时保留原始文件名。 |
| `extension` | 文件后缀，例如 `.png`、`.jpg`。 |
| `contentType` | MIME 类型，例如 `image/png`、`image/jpeg`。 |

使用 Base64 时，应包含完整的数据 URI 前缀：

```text
data:image/png;base64,...
```

## 不透明度

```json
{
  "imageAlpha": 50000,
  "fillAlpha": 50000,
  "fillStyle": {
    "type": "texture",
    "texture": {
      "alpha": 50000
    }
  }
}
```

不透明度字段使用 `0..100000`：

| 值 | 效果 |
| --- | --- |
| `100000` | 完全不透明。 |
| `50000` | 约 50% 不透明。 |
| `0` | 完全透明。 |

除非渲染器明确需要分开处理，否则建议 `imageAlpha`、`fillAlpha` 和 `texture.alpha` 使用相同值。

## 裁剪

图片裁剪可以通过两个字段表达：

```ts
type Crop = [left: number, top: number, right: number, bottom: number]
```

| 字段 | 位置 | 说明 |
| --- | --- | --- |
| `clipping` | `ImageProperty` | 对图片资源的裁剪参数。 |
| `fillStyle.texture.insets` | `TextureFill` | 纹理填充裁剪参数。 |

推荐同时设置两者，并保持值一致：

```json
{
  "clipping": [71667, 0, 0, 48134],
  "fillStyle": {
    "type": "texture",
    "texture": {
      "imageData": "data:image/png;base64,...",
      "contentType": "image/png",
      "alpha": 100000,
      "flipMode": "NONE",
      "insets": [71667, 0, 0, 48134]
    }
  }
}
```

裁剪效果：

- `left` 增大：从图片左侧向内裁剪。
- `top` 增大：从图片顶部向内裁剪。
- `right` 增大：从图片右侧向内裁剪。
- `bottom` 增大：从图片底部向内裁剪。

限制：

- 裁剪值不应让可见区域宽度或高度变为 `0` 或负数。
- 裁剪后图片仍会被映射到 `anchor` 区域。
- 如果只设置 `clipping` 而不设置 `texture.insets`，部分渲染器可能只在导出阶段裁剪，预览不裁剪。

## 拉伸、裁剪和平铺

| 模式 | 字段 | 效果 |
| --- | --- | --- |
| 拉伸 | `texture.stretch` | 图片拉伸填满对象，可能改变比例。 |
| 裁剪 | `clipping` + `texture.insets` | 裁剪图片后填充对象。 |
| 平铺/缩放 | `texture.scale`, `texture.offset`, `texture.alignment` | 缩放或平铺图片，适合纹理图案。 |

详见 [common-property.md](common-property.md) 的 `TextureFill`。

## 图片作为媒体封面

音频或视频对象可以使用 `image` 作为封面/播放按钮。媒体资源放在 `audio` 或 `video` 字段中。

```json
{
  "type": "image",
  "point": [447.5, 237.5, 65, 65],
  "extInfo": {
    "property": {
      "realType": "Picture",
      "shapeType": "rect",
      "anchor": [447.5, 237.5, 65, 65],
      "fillStyle": {
        "type": "texture",
        "texture": {
          "imageData": "data:image/png;base64,...",
          "contentType": "image/png",
          "alpha": 100000,
          "flipMode": "NONE",
          "stretch": [0, 0, 0, 0]
        }
      },
      "hyperlink": {
        "type": "URL",
        "label": "",
        "address": "ppaction://media",
        "action": "ppaction://media"
      },
      "geometry": { "name": "rect", "data": null, "avLst": null, "textBounds": null },
      "image": "data:image/png;base64,...",
      "audio": "data:audio/mp3;base64,...",
      "extContentType": "audio/mp3"
    }
  },
  "children": []
}
```

媒体播放相关信息还需要在页面 `extInfo.animationExt` 或 `extInfo.animation` 中描述。详见 [other-objects.md](other-objects.md)。
