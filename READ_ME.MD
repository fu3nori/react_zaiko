# 在庫君 取扱説明書
## オンライン在庫管理アプリケーション
このアプリケーションではmysqlまたは,mariadbを使います  
任意の名称のDBを作成後、直下のinstall.sqlからテーブルをインポートしてください  
直下の.envの次の項目を自分で設定した通りに記述して下さい  

`#接続するDB情報を記述例
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=zaiko`
またランダムシードをなるべく長い半角英数で記載して下さい  

`#ランダムシードを記述
JWT_SECRET=ghskcmffstghhkkkkswsgjjyyh`


## チェックポイント
SE LINUX: disable

セキュリティグループ：Outbound 443 許可 

セキュリティグループ：Inbound 443 許可

セキュリティグループ：Outbound 3306 許可

セキュリティグループ：Inbound 3306 許可

Apache: mod_ssl, mod_proxy, mod_proxy_http, mod_rewrite 有効

vhost の /api → http://127.0.0.1:3001/api リバースプロキシ設定

React: .env.production に VITE_API_BASE=/api

開発: .env.development に VITE_API_BASE=http://localhost:3001

フロントの API 呼び出しは すべて api インスタンス経由（直URL/ポート直書き禁止）

サーバ .env に JWT_SECRET, JWT_EXPIRES_IN, Gmail 用 OAuth クレデンシャル

Gmail API は HTTPS(443) を利用（SMTP 465/587 とは別）

パスワードリセットフロー：/api/password/reset-request（メール送信） → /api/password/reset（トークン検証＆更新）

## パスワードリマインダー用のgmail API 設定

### 事前準備
gmailのアカウントを取って下さい  
GCP プロジェクト作成
https://console.cloud.google.com/ にアクセスし、右上のアカウント設定で取得したメールアドレスのアカウントを選ぶ  
二段階認証を求められるので応じて設定  
再度　https://console.cloud.google.com/　にアクセス  
新規プロジェクト作成（例: zaikokun-prod）  
左メニュー「API とサービス」→APIとサービスを有効にする  
API ライブラリに遷移するので　Gmail API　で検索 
Gmail APIが出てくるので選択して、APIを有効化を選択  
画面左の　OAuth 同意画面を選択
開始をクリック  
アプリ名にリマインダーと入力  
ユーザーサポートメールはセレクトボックスで今回使うGmailを選択
対象を外部に設定して次へを選択  
連絡先情報に先ほど選択したメールアドレスを手動入力  
次へをクリック  
終了画面でチェック僕巣を入れて続行ボタンをクリック  
作成をクリック  
データアクセスをクリック  
スコープを追加をクリック  
フィルターに　gmail.send　と入力すると  
https://www.googleapis.com/auth/gmail.send と出てくるのでそれを選ぶ  
下のチェックボックスにチェックを入れる  
更新をクリック  
画面左の　Google Auth Platform　をクリックしOAuth クライアント IDを作成をクリック  
アプリケーションの種類をウェブアプリケーションを選択  
名前をリマインダーに設定  
承認済みの JavaScript 生成元と承認済みのリダイレクト URIは後回しにして作成をクリック  
クライアントIDとクライアントシークレットの値が一度だけ表示されるのでメモ帳に保存しておくこと  
https://developers.google.com/?hl=ja　にアクセスし、今回取得したアカウントに切り替える（画面右上）
https://developers.google.com/oauthplayground にアクセス  
左下のフォームに　https://www.googleapis.com/auth/gmail.send　と入力し横の青いボタンをクリック
アカウントの選択を求められるので　今回取得したアカウントを選ぶ  
Authorization codeが表示されるのでメモ帳に保存  
下のボタンをクリックするとRefresh tokenとAccess tokenが生成されるのでそれもメモ帳に保存  
