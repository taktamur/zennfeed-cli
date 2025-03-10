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

ZennFeed CLIはサブコマンド構造を採用しています。

### フィード取得コマンド

```bash
# 基本的な使用法（デフォルトで20件取得）
deno run --allow-net mod.ts feed

# 取得する記事数を指定
deno run --allow-net mod.ts feed --count=10

# トピックを指定して取得（例: TypeScript関連の記事）
deno run --allow-net mod.ts feed --type=topic --keyword=typescript

# 特定ユーザーの記事を取得
deno run --allow-net mod.ts feed --type=user --keyword=taktamur

# 最初の記事の内容も同時に取得
deno run --allow-net mod.ts feed --first

# 注意: topic/userタイプの場合はkeywordが必須
# 以下のコマンドはエラーになります
# deno run --allow-net mod.ts feed --type=topic
```

### 記事取得コマンド

```bash
# URLから記事本文を抽出
deno run --allow-net mod.ts article --url https://zenn.dev/taktamur/articles/b5a26613e7261e
```

### ヘルプの表示

```bash
# 全体のヘルプ
deno run --allow-net mod.ts --help

# feedコマンドのヘルプ
deno run --allow-net mod.ts feed --help

# articleコマンドのヘルプ
deno run --allow-net mod.ts article --help
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

### フィード出力（feed コマンド）

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
  ],
  "message": "記事の詳細を取得するには: deno run --allow-net mod.ts article --url <記事のURL>"
}
```

### フィード出力（--first オプション付き）

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
  ],
  "message": "記事の詳細を取得するには: deno run --allow-net mod.ts article --url <記事のURL>",
  "firstArticle": {
    "title": "サンプル記事タイトル",
    "content": "記事の本文テキスト...",
    "author": "username",
    "published": "2023-04-01",
    "url": "https://zenn.dev/username/articles/article-id",
    "tags": ["tag1", "tag2", "tag3"]
  }
}
```

### 記事本文（article コマンド）

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