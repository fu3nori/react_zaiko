# デュアルライセンスについて
本プロジェクトはデュアルライセンスです：
- オープンソース利用：GPL-3.0-only
- 商用・クローズド利用：商用ライセンス（有償、個別契約）

利用者は上記いずれか一方のライセンスを選択して利用できます。  
GPL-3.0を選ぶ場合は、その義務（派生物のソース提供等）に従ってください。  
これらの義務に同意できない場合は、商用ライセンスをご検討ください。  
商用ライセンスの詳細・見積り：<連絡先メール cap.fuminori.usui@gmail.com>

## 在庫君 取扱説明書
## オンライン在庫管理アプリケーション
このアプリケーションではmysqlまたは,mariadbを使います  
任意の名称のDBを作成後、直下のinstall.sqlからテーブルをインポートしてください  
serverディレクトリ直下の.envの次の項目を自分で設定した通りに記述して下さい  

````#接続するDB情報記述例
DB_HOST=localhost  
DB_USER=root   
DB_PASSWORD=  
DB_NAME=zaiko
````
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
server/.envに各種設定記載  

## パスワードリマインダー用のSendGrid API 設定

### 事前準備
メールアカウントを取って下さい  
#### SendGrid にサインアップ  
https://www.twilio.com/ja-jp  
ダッシュボード → Settings → API Keys → 「Create API Key」
API KEYをメモ  
権限：Full Access か Mail Send（送信のみならこれで十分）    
生成された API Key を .env の SENDGRID_API_KEY に設定    
#### 送信者の検証
Single Sender Verification  
Settings → Sender Authentication → Single Sender Verification  
送信者の名前/メール/住所など入力 → そのアドレスに確認メール → Verify
#### env設定
/server/.env の MAIL_FROM に その検証済みアドレス を設定  
SENDGRID_API_KEY にsendgrid で取得したAPI KEYを設定 

sendgridの設定を.envに記載する例
````
SENDGRID_API_KEY=SG.xxxxxxxx              # ダッシュボードで発行してメモした物  
MAIL_FROM="noreply@zaikokun.com" # Single Senderで設定したメールアドレス  
````