# mcp-client-ts

Model Context Protocol (MCP)を使用したTypeScriptクライアントアプリケーションです。Anthropic APIと連携して、対話型のAIアシスタントを実装しています。

## 機能

- Anthropic APIとの連携
- Model Context Protocol (MCP)サーバーとの通信
- 対話型のチャットインターフェース
- ツールの動的な呼び出しと実行

## 必要条件

- Bun v1.1.21以上
- Anthropic APIキー（環境変数として設定）

## インストール

```bash
bun install
```

## 使用方法

1. 環境変数の設定:
```bash
export ANTHROPIC_API_KEY=your_api_key_here
```

2. サーバースクリプトを指定して実行:
```bash
bun run index.ts <path_to_server_script>
```

## プロジェクト構造

- `index.ts`: メインのクライアントアプリケーション
- `MCPClient`クラス: クライアントの主要な機能を実装
  - サーバー接続管理
  - クエリ処理
  - チャットループ
  - リソース管理

## 主要な関数とメソッド

### メイン関数
- `main()`: プログラムのエントリーポイント
  - コマンドライン引数の処理
  - MCPClientの初期化と実行
  - 終了時のクリーンアップ処理

### MCPClientクラスのメソッド
- `constructor()`: クラスの初期化
  - Anthropic APIクライアントの設定
  - MCPクライアントの初期化

- `connectToServer(serverScriptPath: string)`: サーバー接続処理
  - 指定されたサーバースクリプトの実行
  - 利用可能なツールの取得と保存
  - 接続状態の管理

> [!NOTE]
> このMCPサーバーなに使えるかの部分が、各Client（Cursor, VSCode, Claude Desktop）で違う
> 今回は cli の引数で受け取っているが、 config ファイルにしてしまうこともできる

- `processQuery(query: string)`: クエリ処理
  - ユーザー入力の処理
  - Anthropic APIとの通信
  - ツールの呼び出しと結果の処理
  - 応答の生成

> [!NOTE]
> ユーザーからの入力値を受け取る
> WebServerであれば、HTTPリクエストのボディから取得する

- `chatLoop()`: 対話型インターフェース
  - ユーザー入力の待ち受け
  - クエリの処理と応答の表示
  - 終了条件の管理

> [!NOTE]
> チャットが生きている限り、続くもの
> Webサーバーでリロードしてもチャットを活かすには、DBに保存しておくなど工夫が必要（ChatIDなどをキーに取り出す）

- `cleanup()`: リソース解放
  - クライアント接続の終了
  - リソースの解放

> [!NOTE]
> チャットが終了したら、リソースを解放する

## 開発情報

このプロジェクトは`bun init`を使用して作成されました。[Bun](https://bun.sh)は高速なオールインワンJavaScriptランタイムです。
