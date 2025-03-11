# ZennFeed CLI プロジェクトガイドライン

## コマンド

- 起動: `deno run --allow-net mod.ts`
- 開発モード: `deno run --watch --allow-net mod.ts`
- リント: `deno lint`
- フォーマット: `deno fmt`
- テスト全体: `deno test`
- 特定のテスト: `deno test --filter "テスト名"`
- 型チェック: `deno check mod.ts`
- バンドル: `deno bundle mod.ts dist.js`
- コンパイル: `deno compile --allow-net mod.ts`

## GitHub操作

- プッシュ: `gh repo push` または `git push origin main`
- PR作成: `gh pr create --title "PRタイトル" --body "PR詳細\n\n🤖 Generated with [Claude Code](https://claude.ai/code)"` (テスト項目は不要)
- Issue書き込み: コメントの最後に `🤖 Generated with [Claude Code](https://claude.ai/code)` を追加
- Issue確認時: 不明瞭な箇所があれば質問をコメントで返す
- PR確認: `gh pr view`
- コミット履歴: `gh repo view --commits`

## コードスタイル

- TypeScriptネイティブ構文の活用
- Top-levelのawaitを使用
- ESモジュールをURLで直接インポート
- エラー処理: Result/Eitherパターンを推奨
- 命名規則: 変数/関数はcamelCase、クラス/型はPascalCase
- JSDocスタイルのコメントでAPI文書化
