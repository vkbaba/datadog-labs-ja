---
title: 第2章 - SLO の作成
description: ログとトレースで問題を調査し、APM メトリクスをもとに SLO とバーンレートモニターを作成します。
head: []
---

## 課題の背景

Ops チームは SRE を採用するにあたって、Swagstore 全体の可視性を向上させるために Datadog を導入しました。

しかし課題が発生しています。Swagstore のカスタマーサービスに、注文を完了できないという顧客からのクレームが急増しています。これは顧客体験に直接影響する **クリティカルユーザージャーニー（CUJ）** です。

Ops チームはこの問題に追われており、私たちに助けを求めています。SLO を設定し、アラートを構成することで、Swagstore のサービス信頼性をより深く理解し監視できるようにする必要があります。

根本原因を特定し、今後の障害に対処するための可視性を提供することで、スムーズな顧客体験を確保することが目標です。

さっそく始めましょう！

## 不安定性の問題をトラブルシューティングする

Ops チームの Alberto が予備調査中に異常を発見しました。`paymentservice` が断続的にエラーをスローしており、それがトランザクション失敗の根本原因である可能性があります。

Alberto の調査内容を確認しましょう。

1. **[Logs > Explorer](https://app.datadoghq.com/logs)** をクリックして Logs Explorer を開きます。

2. 左側のログファセットでサービス名にカーソルを合わせ `Only` をクリックして `paymentservice` でフィルタリングします（上部のフィルターバーに `service:paymentservice` と入力することもできます）。
    :::note
    リストには payment**db**service も存在するため、正しいサービスを選択してください。
    :::

3. 右上の時間範囲セレクターを `Past 1 Hour`（過去1時間）に設定します。
    - Datadog が自動的に表示するバーチャートを確認してください。断続的なエラーが見えますか？

    ![Paymentservice のログ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/paymentservice-logs.png)

4. 検索バー下の **Group Into** の横にある **Patterns** を選択します。フィルターとグループ設定は次のようになっているはずです:
    ![ログのフィルタリング](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/logs-filtering.png)

5. これにより、類似パターンのログがグループ化され、繰り返し発生している予期しないイベントを特定できます。

    表示されているパターンの中に、`javax.persistence.LockTimeoutException occurred. Cannot process payment transaction.` エラーの件数が多いことに気づきましたか？

    このエラーパターンが Alberto の言及していた問題のようで、顧客が Swagstore でトランザクションを完了できない原因である可能性があります。

    ![Log Explorer のパターン](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/log-explorer-patterns.png)

    :::note
    パターングループ化は、調査が必要な繰り返しエラーやログパターンを特定する際に特に役立ちます。
    :::

6. ログ結果の上部に **Watchdog Insights** が表示されます。
    ![Watchdog Insight](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/watchdog-insight.png)
    :::note
    Watchdog Insights は、設定したフィルターに基づく Datadog の ML エンジンの結果であり、ログに異常が検出された場合に表示されます。
    :::

7. **Watchdog Insights** セクションの `Logs Error Outlier` ボックスをクリックします。

8. Watchdog が特定した内容とエラーシグナルの説明、および関連するログが表示されます。
   ![Watchdog の出力](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/watchdog-output.png)

9. `javax.persistence.LockTimeoutException` ログパターンをクリックして、関連するすべてのログを表示します。

10. リストからログメッセージの1つをクリックして、ログメッセージの詳細を表示します。

    上部にはログの発生元（ホスト、コンテナ、サービスなど）の詳細が表示されます。下部にはすべての **イベント属性** の JSON 表現があり、関連するアプリケーション **トレース** を表示できます。

11. **Trace** タブから **View Trace in APM** リンクをクリックします。

    ![トレースを表示](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/logs-traces-view-traces.png)

    新しいタブで開きます:

    ![LockTimeoutException のトレース](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/traces.png)

    色付きのバーが並ぶ大きなグラフィックは **フレームグラフ** と呼ばれます。フレームグラフはリクエストの実行パスを可視化し、サービス呼び出しを1つの分散トレースに統合します。各スパン（バー）は、API 呼び出しやデータベースクエリなど、リクエスト実行中の個別の作業単位を表します。

    関連するすべてのサービスにわたるリクエスト全体の流れが確認できます。

    `paymentservice` は `checkout` サービスからの charge リクエストを処理しており、`checkout` は **ユーザー** がチェックアウトを送信した後に `frontend` からリクエストを受け取ります。したがって、私たちの **クリティカルユーザージャーニー** において `paymentservice` は非常に重要です。

    次に、`paymentservice` の **可用性**（正常に形成されたリクエストが成功する割合として定義されることが多い）を **サービスレベル指標（SLI）** として SLO を作成しましょう。

## SLO を作成する

:::note
前のステップに時間をかけすぎて SLO とモニターを作成する時間がない場合は心配しないでください。アーティファクトは自動的に作成されます。以下の **ラボまとめ** ステップに進んでください。
:::

1. `hipstershop.PaymentService/Charge` リクエストのスパンをクリックします（下から2番目のスパン）。

    ![Checkout の Charge 呼び出しスパン](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/trace-charge-span.png)

2. 下部のタブで、`paymentservice` タブの **ミートボールメニュー**（縦に3つの点）をクリックし、**-> Go to Service page** をクリックします。

    ![サービスページへ移動](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/trace-span-go-to-service-page.png)

3. これは、サービスのヘルスやその他の情報を1ページにまとめた自動生成の **サービス概要ダッシュボード** です。

    サービスページ上部の **Service Summary** セクションで、**Watchdog** がすでに `paymentservice` のエラー率に異常を検出していることがわかります。

    **Requests and Errors** と **Errors** グラフで断続的なエラーの概要が確認できます:
    ![Paymentservice のサービスサマリー](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/paymentservice-service-summary.png)

4. `paymentservice` サービスページの SLOs ボックス内で **Create** をクリックします。

    Datadog は SLO を作成するための事前定義オプション（可用性とレイテンシー）を提供します:
    ![可用性 SLO の作成](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/create-slo-availability.png)

    :::note
    レイテンシー SLI はリクエストに対するレスポンスを返すまでの時間を計測します。
    :::

5. **Add New Availability SLO** をクリックします。
    SLO 作成フォームが開きます。Datadog がすでに値を入力してくれています。
    ![SLO フォーム](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/new-slo-populated.png)

    :::note
    **By Count** は **可用性** SLI に最適です。SLI が **レイテンシー** の場合は、by time slice の方が適しています。
    :::

    画面右側に SLO のプレビューが表示されていることに注目してください。現在の状況はどうですか？

    :::note
    **server.hits** メトリクスにはエラーを含むすべてのリクエストが含まれています。**Good Events** のみを対象とするため、総ヒット数から **server.errors** を引きます。
    :::

6. **Create & Set Alert** をクリックすると、SLO の作成が完了です！

## バーンレートモニターを作成する

SLO モニターのフォームが表示されているはずです。これにより、SLO のエラーバジェットの消費が速すぎる場合に Alberto のチームへ通知し、チェックアウトプロセスの問題を事前に知らせることができます。

:::note
**Create & Save Alerts** の代わりに **Save** をクリックした場合は、**[Monitors > +New Monitor](https://app.datadoghq.com/monitors/create)** に移動し、**SLO** を選択してください。
:::

1. **Set alert conditions** で **Burn Rate** を選択します。

2. **Alert Condition** を以下のように設定します:

    - 直近 `1` 時間と直近 5m を *7-day target (primary)* で評価
    - 両方のバーンレートが `5` 以上の場合に **Alert**

    :::note
    **バーンレート** は消費係数として機能します。バーンレートが 7 の場合、7 日間のウィンドウにおいて、バーンレートが一定のまま維持されると、たった 1 日でエラーバジェット全体が枯渇することを意味します。
    :::

    設定は次のようになっているはずです:
    ![SLO モニターのアラート条件](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/slo_monitor_alert_conditions.png)

2. **Configure notifications & automations** で以下を入力します:

    - Monitor Name:
    ```
    Swagstore Checkouts Failing!
    ```

    - Monitor Message:
    ```
    Swagstore Checkouts Failing. Look into this ASAP!

    ```

    - オプション: **Add Mention** をクリックしてメールアドレスを入力すると、次回モニターがトリガーされた際に通知を受け取れます。

3. `Add SLO Tags` をクリックして、SLO に設定したタグを取得します。

4. 設定が以下と一致していることを確認します:
 ![SLO モニターの通知と自動化](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/slo_monitor_notification.png)

5. ページ右下の **Create and Publish** をクリックします。

## ラボまとめ

おめでとうございます！Datadog で SLO とモニターを定義しました！

これにより、ユーザーが Swagstore のチェックアウトプロセスで問題に遭遇した瞬間に Ops チームへ通知されるようになります。

準備ができたら、ラボ右下の `Next` をクリックして次のラボに進んでください。
