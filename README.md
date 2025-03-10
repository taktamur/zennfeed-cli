# まだ実装中でバグっています。

# Claude Code を利用して生成させています。

# ZennFeed CLI

[![Deno Tests](https://github.com/taktamur/zennfeed-cli/actions/workflows/test.yml/badge.svg)](https://github.com/taktamur/zennfeed-cli/actions/workflows/test.yml)

Zenn.dev の最新記事を RSS フィードから取得する Deno ベースの CLI ツール

## 機能

- Zenn.dev の最新記事を取得
- 記事数の指定
- 日本語フォーマットの日付表示
- JSON 出力
- 記事本文のテキスト抽出（HTML からプレーンテキストへ変換）
- 記事情報の構造化（タイトル、本文、著者、タグ等）

## インストール

### 方法 1: リポジトリからインストール

```bash
# リポジトリをクローン
git clone https://github.com/taktamur/zennfeed-cli.git
cd zennfeed-cli

# 必須: Denoをインストール
# https://deno.land/manual/getting_started/installation

# ローカルチェックアウトしたコードをzennfeedコマンドとしてインストール
deno install --allow-net --global -n zennfeed ./mod.ts
```

### 方法 2: Deno コマンドとしてインストール（推奨）

```bash
# どこからでも `zennfeed` コマンドとして使えるようにインストール
deno install --allow-net --global -n zennfeed https://raw.githubusercontent.com/taktamur/zennfeed-cli/main/mod.ts

# インストール後の使い方
zennfeed feed
zennfeed article --url https://zenn.dev/taktamur/articles/b5a26613e7261e
```

※ インストール時のパスが通っていない場合は、以下のメッセージが表示されます：

```
ℹ️ Add /Users/username/.deno/bin to PATH
    export PATH="/Users/username/.deno/bin:$PATH"
```

表示されたパスを `.zshrc` または `.bash_profile` に追加してください。

### アンインストール方法

```bash
# zennfeedコマンドをアンインストール
deno uninstall --global zennfeed
```

## 使い方

ZennFeed CLI はサブコマンド構造を採用しています。

### フィード取得コマンド

```bash
# 基本的な使用法（デフォルトで20件取得）
zennfeed feed

# 取得する記事数を指定
zennfeed feed --count=10

# トピックを指定して取得（例: TypeScript関連の記事）
zennfeed feed --type=topic --keyword=typescript

# 特定ユーザーの記事を取得
zennfeed feed --type=user --keyword=taktamur

# 最初の記事の内容も同時に取得
zennfeed feed --first

# 注意: topic/userタイプの場合はkeywordが必須
# 以下のコマンドはエラーになります
# zennfeed feed --type=topic
```

### 記事取得コマンド

```bash
# URLから記事本文を抽出
zennfeed article --url https://zenn.dev/taktamur/articles/b5a26613e7261e
```

### ヘルプの表示

```bash
# 全体のヘルプ
zennfeed --help

# feedコマンドのヘルプ
zennfeed feed --help

# articleコマンドのヘルプ
zennfeed article --help
```

## 開発

詳細な開発方法については [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

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
  "message": "記事の詳細を取得するには: zennfeed article --url <記事のURL>"
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
  "message": "記事の詳細を取得するには: zennfeed article --url <記事のURL>",
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
  "tags": ["macOS", "Docker", "tech"]
}
```

## ライセンス

MIT
