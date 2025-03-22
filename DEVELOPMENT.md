# 開発ガイド

## 開発環境のセットアップ

### Git フック

コミット前に自動的に `deno fmt` と `deno lint` を実行するようになっています：

```bash
# .huskyディレクトリが用意されていて、pre-commitフックが設定されています
# 以下のように動作します:
# 1. コミットされるTypeScriptファイルに対して自動的にフォーマットを適用
# 2. フォーマットされたファイルを再度ステージング
# 3. lintを実行し、エラーがあればコミットを中止
```

この設定により、GitHub Actionsのチェックでエラーが発生することを防止できます。

## 開発コマンド

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

## 今後の改善予定

- 公開日の抽出方法を改善
  - メタタグからの抽出を試す (og:published_time など)
  - 日付のフォーマットを標準化 (ISO 8601 形式など)
  - タイムゾーン処理の追加
- HTML スクレイピング処理の堅牢性向上
- 記事タグの抽出精度の向上
- ~~出力形式の選択肢追加（JSON 以外）~~ ✅ issue #14 で実装完了
- ~~feedコマンドでフィードURLを表示~~ ✅ issue #22 で実装完了
- ~~キーワード検索機能の追加~~ ✅ issue #16 で実装完了

## キーワード検索機能 (issue #16)

`--search` または `-s` オプションを使用して、取得した記事の中からキーワードを含む記事をフィルタリングできます。
現在の実装では、記事タイトルと著者名に対する検索をサポートしています。

```bash
# 例: 「Docker」を含む記事を検索
zennfeed feed --search "Docker"

# 例: typeと組み合わせて使用
zennfeed feed typescript --search "API"
```
