# 開発ガイド

## 開発環境のセットアップ

### Git フック

コミット前に自動的に `deno fmt` を実行するように設定することをお勧めします：

```bash
# .git/hooks/pre-commitファイルを作成
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh

# コミット前に自動的にdeno fmtを実行
files=$(git diff --cached --name-only --diff-filter=ACM | grep '\.ts$' || true)
if [ -n "$files" ]; then
  echo "Running deno fmt..."
  deno fmt $files
  # ファイルをステージング領域に再度追加
  echo $files | xargs git add
fi
EOF

# 実行権限を付与
chmod +x .git/hooks/pre-commit
```

この設定により、コミット時に変更されたTypeScriptファイルに対して自動的にフォーマットが適用されます。

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
