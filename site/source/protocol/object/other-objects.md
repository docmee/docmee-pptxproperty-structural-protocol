# 其他对象

本文档描述当前协议中不需要单独完整章节的对象和扩展形态，包括音频、视频和媒体播放信息。

## 媒体对象模型

音频和视频通常不是独立的顶层 `type`，而是挂载在 `image` 对象上：

- `image` 对象提供页面上的可见封面、播放按钮或视频首帧。
- `audio` 或 `video` 字段保存媒体资源。
- `extContentType` 保存媒体 MIME 类型。
- `hyperlink` 使用 `ppaction://media` 表示点击触发媒体行为。
- 页面 `extInfo.animationExt` 或 `extInfo.animation` 描述播放动画、音量、循环和播放时长。

## 音频

```ts
type AudioImageProperty = ImageProperty & {
  audio: string
  extContentType: string
  hyperlink: Hyperlink
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `audio` | `data:audio/...;base64,...` 或 URL。 | 提供音频二进制内容或资源地址。 |
| `extContentType` | MIME 类型，例如 `audio/mp3`。 | 告诉消费端如何解码媒体。 |
| `hyperlink.address` | `ppaction://media`。 | 标记点击动作为媒体播放。 |
| `hyperlink.action` | `ppaction://media`。 | 保留 PPTX 动作行为。 |

示例：

```json
{
  "id": "audio-cover",
  "type": "image",
  "depth": 1,
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
      "contentType": "image/png",
      "audio": "data:audio/mp3;base64,...",
      "extContentType": "audio/mp3"
    }
  },
  "children": []
}
```

## 视频

视频使用与音频相同的挂载方式，只是资源字段改为 `video`。

```ts
type VideoImageProperty = ImageProperty & {
  video: string
  extContentType: string
  hyperlink?: Hyperlink
}
```

| 字段 | 设置方式 | 效果 |
| --- | --- | --- |
| `video` | `data:video/...;base64,...` 或 URL。 | 提供视频二进制内容或资源地址。 |
| `extContentType` | MIME 类型，例如 `video/mp4`。 | 告诉消费端如何解码媒体。 |
| `image` | 缩略图、封面图或首帧。 | 在幻灯片上显示媒体对象。 |
| `hyperlink` | 通常为 `ppaction://media`。 | 点击播放行为。 |

示例：

```json
{
  "type": "image",
  "point": [120, 90, 320, 180],
  "extInfo": {
    "property": {
      "realType": "Picture",
      "shapeType": "rect",
      "anchor": [120, 90, 320, 180],
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
      "geometry": { "name": "rect", "data": null, "avLst": null, "textBounds": null },
      "image": "data:image/png;base64,...",
      "video": "data:video/mp4;base64,...",
      "extContentType": "video/mp4"
    }
  },
  "children": []
}
```

## 页面媒体动画

页面级 `extInfo.animationExt` 可描述媒体播放行为。

```ts
type MediaAnimationExt = {
  elementId: string
  presetClass: "mediacall" | string
  presetId: number
  presetSubtype: number
  animation: string
  text: string | null
  startType: number
  attr: {
    media_vol?: string
    media_repeatCount?: string
    cmd?: string
    audio?: string
    video?: string
  }
  duration?: number
}
```

| 字段 | 说明 |
| --- | --- |
| `elementId` | 目标媒体对象 id。 |
| `presetClass` | 媒体播放通常使用 `mediacall`。 |
| `presetId` | 动画预设 id。 |
| `presetSubtype` | 动画预设子类型。 |
| `animation` | 便于阅读的动画名称。 |
| `text` | 可选文本说明。 |
| `startType` | 播放触发类型。实现方应保留该值。 |
| `attr.media_vol` | 音量，通常为 `50%` 这样的百分比字符串。 |
| `attr.media_repeatCount` | 重复次数。 |
| `attr.cmd` | 播放命令，例如 `playFrom(0.0)`。 |
| `attr.audio` | 目标为音频时为 `true`。 |
| `attr.video` | 目标为视频时为 `true`。 |
| `duration` | 媒体播放时长。 |

示例：

```json
{
  "animationExt": [
    {
      "elementId": "audio-cover",
      "presetClass": "mediacall",
      "presetId": 1,
      "presetSubtype": 0,
      "animation": "媒体-播放",
      "text": null,
      "startType": 3,
      "attr": {
        "media_vol": "50%",
        "media_repeatCount": "1000",
        "cmd": "playFrom(0.0)",
        "audio": "true"
      },
      "duration": 3744
    }
  ]
}
```

## 切换和原始动画

页面也可以包含 `transition` 和 `animation`：

```json
{
  "transition": {
    "blinds": { "dir": "horz" },
    "spd": "slow"
  },
  "animation": {
    "tnLst": {}
  }
}
```

这些字段结构可能较深，第三方实现如果不需要编辑动画，建议完整保留并透传。

## 兼容性说明

- 媒体对象仍然按 `image` 对象渲染其封面。
- 播放能力取决于运行环境是否支持对应 MIME 类型。
- 媒体数据 URI 可能非常大，处理时应避免无意义复制。
- 如果无法播放媒体，也应保留 `audio`、`video`、`extContentType`、`hyperlink` 和页面动画字段，以便回写时不丢失信息。
