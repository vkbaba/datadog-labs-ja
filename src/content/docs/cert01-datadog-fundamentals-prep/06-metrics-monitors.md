---
title: 第6章 - メトリクスとモニター
description: Storedog から収集したメトリクスを詳しく確認し、グラフ化、モニターと SLO の作成までを実践します。
head: []
---

このラボでは、Storedog から収集しているメトリクスを詳しく確認し、自分にとって重要な変化が起きたときにアラートを出すためのモニターを作成します。

**学習目標**:

* Datadog にどのようなデータを収集・送信できるかを理解する
* 収集したデータをグラフ化し、ダッシュボードにエクスポートする
* データに対してアラートを出すモニターを作成する
* そのモニターを Service Level Objective (SLO) の Service Level Indicator (SLI) として活用する

環境の準備ができたら、下の **Start** ボタンをクリックしてください。

## 探索、クエリ、グラフ化

メトリクスはシステム全体の状況を把握するための手段です。ユーザーがどれだけ速くウェブサイトを読み込めているか、サーバーの平均メモリ消費量はどれくらいか、といったように、環境の健全性を一目で評価するために利用できます。問題を特定したら、Logs や APM を使ってさらに詳しくトラブルシューティングできます。

### どのようなデータを収集できるか

各インテグレーションが提供するメトリクスは、その **Data Collected** タブ、またはインテグレーションのドキュメントで確認できます。

- [Postgres インテグレーション](https://app.datadoghq.com/account/settings#integrations/postgres) の **Data Collected** タブで、Postgres のメトリクスを確認してみましょう。

- [Docker インテグレーションのドキュメント](https://docs.datadoghq.com/agent/docker/data_collected/) で、Docker インテグレーションが提供する Docker のメトリクスを確認してみましょう。

### どのようなデータを収集しているか

1. 一定期間にインフラから収集されたメトリクスを確認するには、**[Metrics > Summary](https://app.datadoghq.com/metric/summary)** に移動します。

    ここでは、過去数時間・数日・数週間にわたって Datadog が収集したデータを確認できます。

    ![メトリクスサマリーのタイムフレーム](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/metrics_summary_timeframes.png)

1. 検索バーに `docker.cpu` と入力し始めて、リストを絞り込みます。

1. `docker.cpu.system` をクリックして、詳細サイドパネルを表示します。

    ![メトリクスサマリーの詳細](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/metric_summary_details.png)

    ここでは、レポートされている個別のメトリクス、どのホストから送信されているか、そしてそれらのメトリクスに関連付けられたすべてのタグの値を確認できます。

### メトリクスをグラフ化する

1. メトリクスの詳細サイドパネルで、右上隅にある **Open in Metrics Explorer** ボタンをクリックします。

   これにより、選択したメトリクスが **Graph** フィールドに設定され、ページ上部で選択したタイムフレームにわたってメトリクスの値がグラフ化されます。

1. タイムフレームを `Past 30 Minutes` に変更します。

    ![メトリクスをグラフ化する Metrics Explorer](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/metrics_explorer_all.png)

1. これを単一のサービスに絞り込みます。**from** フィールドに `service:discounts-service` と入力します。

1. **+ Add Query** ボタンを選択して新しいクエリを追加し、今度は **from** フィールドに `service:advertisements-service` を設定します。

1. クエリの右側にある X アイコンをクリックして、追加したクエリを削除します。

1. **avg by** フィールドを使うと、タグごとに値を分割できます。**from** フィールドから何も指定しない状態にして、**avg by** フィールドに `service` を追加します。これにより、各サービスがそれぞれ独自の線でグラフ化されます。結果として得られるグラフは、次の画像のようになります。

    ![4 つのサービスをグラフ化した Metrics Explorer](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/metrics_explorer_services.png)

### ダッシュボードにエクスポートする

1. グラフの上にある **More...** ボタンをクリックし、**Save to Dashboard** を選択します。

1. 「+New dashboard」を選択します。

    ![メトリクスをダッシュボードにエクスポートするダイアログ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/export_metric_dialog.png)

1. **Save and Open** ボタンをクリックします。

### 別のメトリクスをグラフ化する

1. [Metrics Explorer](https://app.datadoghq.com/metric/explorer) ページに戻り、`service:discounts-service` と `service:advertisments-service` の `trace.flask.request` メトリクスについて、同じ手順を実行します。

   ![trace.flask.request のグラフ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/trace_flask_request.png)

1. これらを同じダッシュボードにエクスポートします。ダッシュボードを表示すると、新しいグラフが追加されているはずです。

## モニターとアラート

これらのグラフが危険な水準まで急上昇していないかを一日中見張っているわけにはいきません。それはモニターに任せましょう。

discounts サービスの Flask リクエスト時間が 2 秒を超えたときにアラートを出すモニターを作成します。

1. [Monitors > New Monitor](https://app.datadoghq.com/monitors/create) に移動します。Datadog が提供する多くのモニタータイプに注目してください。各タイプにマウスオーバーすると、その概要を確認できます。

1. **Metric** を選択します。

1. **Choose the detection method** では、デフォルト値の **Threshold Alert** のままにします。

1. **Define the metric** では、**Metric** に `trace.flask.request`、**From** に `service:discounts-service` を設定します。

1. **Set alert conditions** では、**Alert threshold** を `2`、**Warning threshold** を `1.5` に設定します。

    ここまでで、新しい Metric Monitor の設定は次のようになっているはずです。

    ![ここまでの新しい Metric Monitor](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/new-metric-monitor-so-far.png)

1. **Configure notifications & automations** で、モニターに名前を付けます。

    ```
    Discounts service request time
    ```

1. discounts サービスの APM ページへのリンクと、エスカレーション担当者のメールアドレスを含むモニターメッセージを記述します。メールアドレスの前に付ける `@` は、そのユーザーが組織のメンバーであれば、そのユーザーの Datadog プロフィールへのリンクとして表示されます。(このラボでは、参照しているユーザーは存在しません。)

    たとえば、Markdown で次のように入力できます。

    ```md
    Investigate the source. Usually good info in [APM](https://app.datadoghq.com/apm/service/discounts-service/flask.request?env=dd101-sre&topGraphs=latency%3Alatency%2CbreakdownAs%3Apercentage%2Cerrors%3Acount%2Chits%3Acount&paused=false).

    Contact @incident@example.com after triage.
    ```

    :::note
    コピー＆ペーストすると書式が崩れる場合があります。上記のメッセージと同様の内容を手入力してください。
    :::

    通知テキストエリアの特別な構文機能について詳しくは、[Notifications のドキュメント](https://docs.datadoghq.com/monitors/notify/) を参照してください。これらのドキュメントでは、Slack や PagerDuty などの強力な通知インテグレーションについても説明しています。

1. 残りの設定はデフォルトのままにします。

1. **Create** をクリックします。

    モニターは次のような表示になるはずです。

    ![discounts サービスのモニター](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_service_monitor.png)

    **Status & History** セクションの **EVALUATION GRAPH** にデータポイントが表示されるまでには、数分かかります。

1. モニターページの一番下までスクロールし、**Events** セクションを確認します。**Events** セクションには、このモニターに関連するすべてのイベントが表示され、その作成や更新の概要も含まれます。

### モニターと APM

Datadog は、いくつかの APM ページにおいて、サービスのモニターの状態を自動的に表示します。これらのインジケーターは、関連するモニターのステータスページにリンクしています。

* [Software Catalog](https://app.datadoghq.com/services?env=dd101-sre&lens=Reliability) ページの **Reliability** タブにある **MONITORS** カラム:

    ![サービスカタログ内のモニターリンク](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/green_in_service_list.png)

* サービス詳細ページの上部:

    ![サービス詳細ページ上部のモニターインジケーター](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/monitor_link_service_detail.png)

APM の各ページ全体でモニターのステータスを表示することで、自分にとって重要な主要メトリクスのステータスや履歴を非常に簡単に確認できます。

## Service Level Objectives (SLOs)

SLO は、アプリケーションのパフォーマンスに関する明確な目標を定義するためのフレームワークを提供します。一定期間にわたるメトリクスの目標達成率を測定し、サービスが消費者に対する責務をどれだけ果たしているかを追跡します。

SLO の例としては、「discounts サービスは、任意の 7 日間において 99% の時間稼働しているべきである」といったものが挙げられます。

discounts サービスのリクエスト時間に対するモニターを作成したので、それを新しい SLO の Service Level Indicator (SLI) として利用できます。

discounts サービスに対して、この SLO を作成します。

1. **[Service Mgmt > SLOs](https://app.datadoghq.com/slo/manage)** に移動し、**New SLO** ボタンをクリックします。

1. **1. Define the source** で、`By Monitor Uptime` を選択します。

1. ドロップダウンから `Discounts service request time` モニターを選択します。

1. **2. Set your target & time window** では、デフォルト値の「7 日間にわたって 99.9%」のままにします。

1. **3. Add name and tags** で、**Name** に次の値を設定します。

    ```
    SLO: Discount service request time
    ```

    New SLO ページは次のような表示になるはずです。

    ![New SLO ページ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/new_slo_page.png)

1. **Create and Set Alert** をクリックします。

1. **1. Select SLO** で、作成した SLO が選択されていることを確認します。

1. **2. Set alert conditions** はデフォルト値のままにします。

1. **3. Configure notifications & automations** で、モニターに名前を付けます。

    ```
    SLO: Discounts service request time
    ```

1. メッセージテキストエリアに次のメッセージを貼り付けます。

    ```
    Discounts service request time budget depleted
    ```

1. 残りの設定はデフォルトのままにします。

1. **Create** をクリックします。

1. [SLO モニターページ](https://app.datadoghq.com/slo/manage) に戻ります。

1. **SLO: Discount service request time** リンクをクリックして、SLO サイドパネルを開きます。

1. **Overview** タブをクリックして、SLO の動作を確認します。

    ![SLO 詳細パネルの Status & History タブ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/slo_in_action.png)

SLO が開発時間の優先順位付けにどのように役立つかについて詳しくは、[SLO のドキュメント](https://docs.datadoghq.com/monitors/service_level_objectives/) をお読みください。

## ラボのまとめ

このラボでは、利用できるメトリクスにはどのようなものがあるか、それらをどのようにグラフ化するか、そしてそれらのグラフをモニターやダッシュボードにどのようにエクスポートするかを学びました。モニターを使えば、主要なメトリクスに対するアラートを設定できます。ダッシュボードを使えば、関連するデータやグラフを 1 か所にまとめて表示でき、監視や共有が容易になります。

完了したら、ターミナルで次のコマンドを入力します。

```bash
finish
```

ラボの右下隅にある **Check** ボタンをクリックし、結果が表示されるまで待ちます。
