---
title: 第1章 - 学習環境の確認
description: 学習環境にログインし、ワークショップ全体で使用するアプリケーション Storedog を確認します。
head: []
---

## ステップ1 - ラボ環境に慣れる

まずは、この環境について学びましょう。

1.  ラボの手順はサイドパネルに表示され、メインパネルの上部にターミナルと IDE のタブがあります。

    「Storedog」というタブもあります。これについては後ほど詳しく説明します。

2.  このラボを開始したとき、あなた専用の Datadog アカウントと組織が作成されました。これにより、個人や所属組織の Datadog アカウントとは別に、Datadog の使い方を学ぶことができます。

    ターミナルで `creds` と入力して実行すると、認証情報が表示されます。

    ターミナルに表示された認証情報を使って **[Datadog アカウント](https://app.datadoghq.com)** にログインしてください。

    :::tip
    - 必ず app.datadoghq.**com** を使用してください。
    - 他の組織からはログアウトしていることを確認してください。

    ![ログアウトの方法](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/how_to_log_out.png)

    - SSO を回避するためにシークレットウィンドウを使用することもできます。

    ![Chrome のシークレットウィンドウ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/incognito_window.png)
    :::

3.  一通り見て回ってみましょう。このトレーニングでは、多くのセクションを実際に試していきます。

4.  次に、正しい組織にいることを確認します。[API Keys セクション](https://app.datadoghq.com/organization-settings/api-keys)にアクセスしてください。これはグローバルナビゲーションの **User > Organization Settings > API Keys** から見つけられます。

    ![組織設定](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/navigate_org_settings.png)

    API キーの末尾に表示されている英数字をメモしておきましょう。

    ![API キーの詳細](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/api_key_detail.png)

5.  ターミナルで `echo $DD_API_KEY` コマンドを実行し、API キーの環境変数を確認します。末尾4文字の英数字が Datadog App で見たものと一致することを確認してください。

    これが Datadog アカウントで見た API キーと一致しない場合、間違ったアカウントにログインしている可能性があります。必ず `creds` で提供された認証情報を使用してください。

6.  正しい組織にいることを確認できたら、Datadog プラットフォームを学ぶために使用するアプリケーションについて学びましょう。

## ステップ2 - アプリケーション環境について学ぶ

このコースでは、Docker Compose によって管理されるいくつかの Docker コンテナ上で動作する、完全に機能する e コマースアプリケーション Storedog を扱います。

Storedog を構成するサービスの概要は次のとおりです。

| サービス       | 役割                                                                              |
| -------------- | ------------------------------------------------------------------------------------ |
| db             | discount サービスと advertisement サービスが使用する PostgreSQL データベース         |
| frontend       | Ruby で書かれたオープンソースの e コマースフレームワーク Spree                        |
| discounts      | 店舗の割引情報を提供する Python Flask API                                            |
| advertisements | 広告を提供する Python Flask API                                                      |
| puppeteer      | ユーザーのトラフィックやアプリケーションとのやり取りをシミュレートするために使用する Puppeteer |

1. IDE タブをクリックし、`docker-compose.yml` ファイルを開きます。これらのサービスがどのように構成されているかを確認できます。

2.  (任意) Storedog サービスのコードを見たい場合は、IDE のファイルエクスプローラーから参照できます。

3.  アプリケーションはすでに実行中です。コンテナを確認するには、ターミナルで次のコマンドを実行します。

    ```bash
    docker-compose ps
    ```

4.  Storedog タブをクリックします。これにより、ブラウザの新しいタブでアプリケーションが開きます。frontend サービスが完全に応答するようになるまで、ページの再読み込みが必要な場合があります。

![Storedog のホームページ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/storedog_screenshot.png)

5.  次に進む前に、しばらくアプリケーションを探索してみてください。このアプリケーションは、コースの残りの部分を通じて Datadog プラットフォームについて学ぶために使用します。

## ラボのまとめ

おめでとうございます！ワークショップの最初のセクションを完了しました。これで、ワークショップ環境と、Datadog で観測していくアプリケーションに慣れることができました。

準備ができたら、ラボの右下にある `Next` をクリックして次のラボに進みましょう。
