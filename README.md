# ZennFeed CLI

Zenn.devの最新記事をRSSフィードから取得するDenoベースのCLIツール

## 機能

- Zenn.devの最新記事を取得
- 記事数の指定
- 日本語フォーマットの日付表示
- JSON出力
- 記事本文のテキスト抽出（HTMLからプレーンテキストへ変換）
- 記事情報の構造化（タイトル、本文、著者、タグ等）

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/zennfeed-cli.git
cd zennfeed-cli

# 必須: Denoをインストール
# https://deno.land/manual/getting_started/installation
```

## 使い方

```bash
# 基本的な使用法（デフォルトで20件取得）
deno run --allow-net mod.ts

# 取得する記事数を指定
deno run --allow-net mod.ts --count=10

# トピックを指定して取得（例: TypeScript関連の記事）
deno run --allow-net mod.ts --type=topic --keyword=typescript

# 特定ユーザーの記事を取得
deno run --allow-net mod.ts --type=user --keyword=taktamur

# 注意: topic/userタイプの場合はkeywordが必須
# 以下のコマンドはエラーになります
# deno run --allow-net mod.ts --type=topic

# URLから記事本文を抽出
deno run --allow-net mod.ts --url https://zenn.dev/taktamur/articles/b5a26613e7261e

# 最新記事のリストを取得し、最初の記事の本文も取得
deno run --allow-net mod.ts --content
```

## 開発

```bash
# 開発モード（ファイル変更を監視）
deno run --watch --allow-net mod.ts

# リント
deno lint

# フォーマット
deno fmt

# 型チェック
deno check mod.ts

# テスト
deno test

# バンドル
deno bundle mod.ts dist.js

# 実行ファイルにコンパイル
deno compile --allow-net mod.ts
```

## 出力例

### 記事リスト

```json
{
  "articles": [
    {
      "title": "サンプル記事タイトル",
      "link": "https://zenn.dev/username/articles/article-id",
      "pubDate": "2023-04-01T12:00:00.000Z",
      "pubDateFormatted": "2023/04/01 21:00",
      "author": "username"
    },
    ...
  ]
}
```

### 記事本文（URLから抽出）

```json
{
  "title": "MacでDockerDesktopを雑に消したら、再インストール後起動しなくなった",
  "content": "記事の本文テキスト...",
  "author": "taktamur",
  "published": "2025-01-25",
  "url": "https://zenn.dev/taktamur/articles/b5a26613e7261e",
  "tags": [
    "macOS",
    "Docker",
    "tech"
  ]
}
```

## ライセンス

MIT

## 今後の改善予定

- 公開日の抽出方法を改善
  - メタタグからの抽出を試す (og:published_time など)
  - 日付のフォーマットを標準化 (ISO 8601形式など)
  - タイムゾーン処理の追加
- HTMLスクレイピング処理の堅牢性向上
- 記事タグの抽出精度の向上
- 出力形式の選択肢追加（JSON以外）

## 注意事項

このツールはZenn.devの公開APIとHTMLを利用しています。利用規約に従って適切に使用してください。