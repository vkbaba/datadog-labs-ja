---
title: 第1章 - ラボ環境の確認
description: ラボ環境に慣れ、Swagstore アプリケーションを確認し、Datadog にログインします。
head: []
---

## ステップ 1 - ラボ環境を確認する

このワークショップでは、ユーザーが商品を閲覧・カートに追加・購入できる EC アプリケーション「Swagstore」を使います。

アプリケーションが正常に動作していることを確認し、操作に慣れましょう。

1. メインパネルの上部に複数のタブがあります:

    - `Terminal` - 認証情報の取得やホストへのコマンド実行用ターミナル
    - `Swagstore` - プロビジョニングされた個人ラボホスト上で動作する Web アプリケーション
    - `Datadog` - Datadog UI へのリンク
    - `Help` - ラボで問題が発生した場合のヒントページ

2. `Swagstore` タブをクリックして Swagstore アプリケーションを新しいブラウザウィンドウで開いてください。問題が発生した場合はページを更新してみてください。それでも解決しない場合は、手を挙げるか、バーチャル参加の場合はチャットでお知らせください。

    ![Swagstore マイクロサービスのアーキテクチャ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/arch.png)

    Swagstore は Java、C#、Go、Node.js、Python で書かれた 12 個のマイクロサービスで構成されています。
    アプリケーションのアーキテクチャについて詳しくは、[microservices-demo Git リポジトリ](https://github.com/DataDog/dpn/tree/master/sandbox-apps/tsre-microservices) をご覧ください。

3. アプリケーションを簡単に操作してみましょう（商品をカートに追加してチェックアウトするなど）。操作に慣れたら、以下のステップ 2 に進んでください。

## ステップ 2 - データ収集を確認する

Swagstore アプリが動作していることを確認したので、次はインストルメンテーションが正常に完了し、Datadog が Swagstore のデータを収集していることを確認します。

1. ラボ開始時に Datadog アプリへのログイン用認証情報がプロビジョニングされています。左側のターミナルで以下のコマンドを実行して認証情報を取得してください:

    ```sh
    creds
    ```

2. 新しいブラウザウィンドウまたはタブで、取得した認証情報を使って [Datadog](https://app.datadoghq.com/account/login) にログインします。

    _ヒント:_ ユーザー名とパスワードをダブルクリックするとクリップボードにコピーされます。

    :::note
    すでに Datadog ユーザーの場合は、まず自分のアカウントからログアウトし、このラボ用の認証情報でログインし直してください（シークレットモードは使用しないでください）。
    :::

3. Datadog の **[Logs > Explorer](https://app.datadoghq.com/logs)** に移動して、Swagstore アプリのログが取り込まれていることを確認します。

    :::note
    「Getting Started」ページが表示された場合は、**Get Started** ボタンをクリックし、次に表示されるモーダルで再度 **Get Started** をクリックしてください。
    :::

4. Datadog の各 Analytics ページには、上部の検索バーと、データをフィルタリングするための左側の属性リスト（**ファセット**）があります。一覧から **Service** ファセットを展開します。

    以下のサービスが表示されていることを確認してください:

    ![Logs Services](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/logs-services.png)

## ラボまとめ

Datadog が Swagstore のライブデータを収集できるようになりました。これでラボを進める準備が整いました！

準備ができたら、ラボ右下の `Next` をクリックして次のラボに進んでください。
