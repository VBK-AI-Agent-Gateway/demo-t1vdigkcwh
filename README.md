# demo-t1vdigkcwh · 交付站点

部署入口：`deliver/`

## 目录结构

- `deliver/` — 主站（deploy.sh 持续交付控制台落地页）
  - `index.html` / `style.css` / `app.js`
- `deliver/block-breaker/` — 打砖块小游戏（纯 Canvas）
- `deliver/war3-td/` — War3 风格塔防（克制链 / 四族塔 / 装备合成 / 波次 Boss）

## 本地预览

```bash
cd deliver && python3 -m http.server 8080
```

打开 http://localhost:8080 即可。