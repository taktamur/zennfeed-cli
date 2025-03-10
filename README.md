# ZennFeed CLI

Zenn.devの最新記事をRSSフィードから取得するDenoベースのCLIツール

## 機能

- Zenn.devの最新記事を取得
- 記事数の指定
- 日本語フォーマットの日付表示
- JSON出力

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

# トピックを指定して取得（例: LLM関連の記事）
deno run --allow-net mod.ts --type=topic --keyword=llm

# 特定ユーザーの記事を取得
deno run --allow-net mod.ts --type=user --keyword=username

# 注意: topic/userタイプの場合はkeywordが必須
# 以下のコマンドはエラーになります
# deno run --allow-net mod.ts --type=topic
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

## ライセンス

MIT

## 注意事項

このツールはZenn.devの公開APIを利用しています。利用規約に従って適切に使用してください。