---
title: 第5章 - アプリケーションパフォーマンスモニタリング (APM)
description: APM を使用してサービスからトレースを収集し、Datadog アプリでアプリケーショントレースを確認する方法を学びます。
head: []
---

## トレースについて

アプリケーションがトレースを Datadog Agent に送信するよう正しく構成されていると、Datadog はそれらのトレースをインフラストラクチャに関するすべての情報と関連付けることができます。トレース、ログ、プロセス、メトリクス、イベントの間をシームレスに移動し、任意の時点で何が起きていたかの全体像を把握できます。

アプリケーションのトレーシングは、アプリケーションコードで Datadog の APM ライブラリを使用することで有効になります。これらのライブラリは、収集したトレースをどこへどのように送信するかを認識できるように構成する必要があります。コンテナ化された環境では、ライブラリが自身を構成するために参照する環境変数を設定することでこれを実現できます。

Storedog のコードは `docker-compose.yml` ファイルを使用して、すでに計装および構成されています。このファイルを調べて、どのように行われたかを確認しましょう。

## 構成済みのサービスを調べる

まず、PostgreSQL データベースに接続する Python Flask アプリケーションである `discounts` サービスに注目します。`frontend` サービスは、ディスカウントコード情報を取得するためにこのサービスに HTTP リクエストを送信します。

1.  IDE タブをクリックして `docker-compose.yml` ファイルを開きます。

2.  `discounts` サービスを見て、サービスが APM 向けにどのように構成されているかを確認します。

    ![docker compose に適用されたウィザード構成](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/wizard_in_docker_compose.png)

    `DD_AGENT_HOST` が追加されている点に注目してください。これは `ddtrace` ライブラリに対して、トレースを `datadog` サービスに送信するよう指示します。

    また、44 行目の `DD_SERVICE_MAPPING` にも注目してください。これは `ddtrace` に対して、PostgreSQL 接続を検出した際にデフォルトで使用される `postgres` の代わりに、サービス名 `database` を使用するよう指示します。

    :::note
    `ddtrace` については、次のステップで詳しく学びます。
    :::

    52 行目の `command` は、コンテナのデフォルトコマンドをオーバーライドし、アプリケーションを起動するコマンドに `ddtrace-run` を追加します。

3.  discounts サービスのアプリケーションが APM にトレースを送信していることを確認します。ラボのターミナルで、Agent の `status` コマンドを実行します。

    ```bash
    docker-compose exec datadog agent status
    ```

    **APM Agent** セクションまでスクロールします。discounts サービスから Python トレースを受信しています。

    ![APM の Agent チェック](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/agent_check_apm.png)

Datadog は APM ウィザードを通じてこの構成を構築する手助けもできます。ワークショップの後に詳しく試してみてください！

APM Agent セクションに discount サービスからの Python トレースが表示されない場合は、Docker コンテナが実行されていることを確認してください。次のコマンドでコンテナを再起動できます。

```bash
docker-compose down && docker-compose up -d
```

次に、これらのトレースが Datadog アプリでどのように見えるかを確認します。

## Datadog アプリでトレースを探索する

コンテナ化されたアプリケーションで APM をどのように構成するかを確認したので、その結果として得られるトレースを Datadog アプリで見てみましょう。

1. ラボが作成したトライアル認証情報を使用して [Datadog](https://app.datadoghq.com) にログインします。Datadog トレーニングアカウントの認証情報を取得する必要があるときは、いつでもラボのターミナルで `creds` を実行できます。

1. 始める前に、ログがまだ有効になっていない場合は有効にする必要があります。

    **[Logs](https://app.datadoghq.com/logs)** に移動します。

1. **Get Started** ボタンをクリックします。

    ![Datadog Log Management ページを見つける](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/enable-log-management.png)

1. ポップアップモーダルで、再度 **Get Started** をクリックします。

    ![Log Management の使用を開始するポップアップモーダル](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/log-management-modal.png)

1. いくつかのログイベントがリストされた Logs Search ページが表示されるはずです。

    ![ログが入ってくる Log Explorer ページ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/log-explorer-page.png)

    ログが有効になったら、次のステップに進めます。

1. **[APM > Software Catalog](https://app.datadoghq.com/services)** に移動します。過去 2 週間以内に他のワークショップを受講したことがある場合、複数の選択肢を持つ **Show data from** セレクターが表示されている可能性があります。`env:dd101-sre` が選択されていることを確認してください。

1. `docker-compose.yml` ファイルで確認した `discounts-service` と、その他の Storedog サービスが表示されます。

   ![APM Service Catalog の discounts と database](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_apm_services.png)

   また、`active_record` や `database` のように、`docker-compose.yml` で APM 向けに構成されていないサービスも表示されます。これらはどうやってトレースを送信できるのでしょうか？実は、これらは送信していません！しかし、これらに接続するサービスは送信しており、それらとの通信がトレースライブラリによってキャプチャされているのです。

1. リスト内の **discounts-service** にカーソルを合わせ、**Service Page** をクリックします。続いて表示される詳細ページの左上で、スコープが `env:dd101-sre` に、オペレーションが **operation:flask.request** に設定されていることを確認します。

1. **Resources** までスクロールダウンします。ここには、APM がトレースしたサービスのすべてのアプリケーションエンドポイントが表示されます。このサービスには `GET /discount` という 1 つのエンドポイントがあります。

   ![discounts サービスのリソース](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_apm_services_resources.png)

1. **[APM > Traces](https://app.datadoghq.com/apm/traces)** に移動します。検索フィールドに `env:dd101-sre` 以外のものが含まれている場合は、クリアして `env:dd101-sre` を入力します。

   ![環境が正しく設定された Traces](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/traces_env_setting.png)

   ここには、APM が過去 15 分間にキャプチャしたトレースのライブストリームが表示されます。

   ![discounts の APM トレース](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_apm_traces.png)

1. `discounts-service` のトレースのみを表示するには、左側のペインの **Service** セクションで `discounts-service` ファセットをクリックします。これにより、`service:discounts-service` のタグが付いたすべてのトレースがフィルタリングされます。

1. `discounts-service` のトレースをクリックして、トレース詳細のサイドパネルを開きます。フレームグラフ (flame graph) には、このトレースで各サービスに費やされた時間が表示されます。

   ![discounts の APM トレースのフレームグラフ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_apm_traces_flamegraph.png)

   このトレースは discounts-service の `/discount` エンドポイントをキャプチャしていますが、そこから始まっているわけではない点に注目してください。一番上のルートスパン (root span) は、Storedog のホームページを提供する store-frontend の `Spree:HomeController#index` エンドポイントから来ています。これら両方のサービスが APM 向けに計装されているため、Datadog はリクエストの最初から最後まで、関与するすべてのサービスにまたがってワークフロー全体を組み立てることができます。

## APM トレースからログエントリへたどる

少し時間を取って、トレースのログを調べてみましょう。

1.  **Span:** の横にある **Logs** タブをクリックします。

    :::note
    「Get started with Log Management...」のようなメッセージが表示された場合は、リンクをクリックしてロギングを有効にしてください。その後、**[APM > Traces](https://app.datadoghq.com/apm/traces?query=env%3Add101-sre%20service%3Adiscounts-service)** に戻り、再度 `discounts-service` のトレースを開きます。**Logs** タブをクリックしてください。
    :::

    これらは、トレースの時間枠の間にキャプチャされた関連ログ行です。

    ![discounts の APM トレース詳細のログタブ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_apm_traces_logs_tab.png)

    :::note
    水平の区切り線を上下にドラッグすることで、下部パネルのサイズを変更できます。
    :::

2.  各エントリにカーソルを合わせて、フレームグラフを見てみましょう。ログ行が出力されたトレース内の正確な時点を示す縦線が表示されます。これは `DD_LOGS_INJECTION` 構成オプションによって有効になっています。

3. Logs テーブルで、次の画像に示すように、**Hosts** 列の右上にある **Go to Logs Explorer** をクリックします。

    ![トレースのログを Explorer で開く](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_trace_logs.png)

    これにより、`trace_id` に基づいて、先ほど表示したトレースに関連付けられたログを含む Logs Explorer ページが新しいタブで開きます。

    ![ログ検索フィールドのトレース ID](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/trace_id_in_log_search.png)

4. 検索フィールドに以下を追加して、結果をさらにフィルタリングします。

    ```bash
    @filename:discounts.py
    ```

4. ログエントリの 1 つをクリックして、ログエントリ詳細パネルを開きます。

    ![discounts のトレースからログ行へ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_trace_to_logline.png)

    `ddtrace` ライブラリは環境変数 `DD_LOGS_INJECTION=true` を見つけると、トレースデータを自動的にログ行に注入し、出力を JSON としてフォーマットします。Python 向けの `ddtrace` については、[Datadog Python APM Client のドキュメント](https://ddtrace.readthedocs.io/en/stable/index.html)で詳しく学べます。

## ログエントリから APM トレースへたどる

APM トレースから関連するログへ移動する方法が分かったので、今度はログ行から関連する APM トレースへ移動してみましょう。

1.  Log Explorer ページに戻り、検索フィールドをクリアして、右上の時間枠のドロップダウンを `Past 15 Minutes` に変更し、最新のログをすべて表示します。

2.  左側のペインの **Service** セクションで `discounts-service` ファセットをクリックして、`discounts-service` のログのみを表示します。

3.  `Discounts available...` と表示されている `discounts-service` のログ行をクリックします。

4.  ログエントリ詳細パネルで、**Trace** タブをクリックします。

5.  ログの詳細ビューの中で、このログ行のトレースが表示されます！

    **View Trace in APM** をクリックして、APM のトレース詳細ページでトレースを表示します。

    ![ログ内のトレース](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts_apm_traces_in_logs.png)

これで、discounts サービスの APM トレースとログの間を行き来できるようになりました。次のセクションでは、残りの Storedog サービスからトレースを収集します。

## 他のサービスのトレーシング

前のセクションでは、Python 向けの `ddtrace` ライブラリを使用する Storedog の discounts サービスをトレースする方法を学びました。advertisements サービスは非常によく似ており、同じライブラリを使用します。frontend サービスは Ruby フレームワーク上に構築されており、Datadog は Ruby 向けの `ddtrace` クライアントも保守しています。

IDE タブで `docker-compose.yml` ファイルを確認すると、他のサービスが APM 向けにどのように構成されているかを見ることができます。

### Service Map

APM で計装されたすべてのサービスが互いにどのように相互作用しているかを、Service Map で確認できます。

**[APM > Service Map](https://app.datadoghq.com/apm/map)** に移動して、サービスが互いに通信している様子を可視化します。

![クラスターモードでのすべてのサービスマップ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/service_map_cluster.png)

:::note
新しく計装されたサービスが Service Map に表示されるまでには時間がかかることがあります。後でこのページに戻ってきても構いません。
:::

Service Map には 2 つのレイアウトがあります。上の図に示した、小規模なマップに最適化された **Cluster** と、大規模なマップに最適化された **Flow** です。右上の **Flow** コントロールをクリックして、そのレイアウトを確認してみましょう。

![フローモードでのすべてのサービスマップ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/service_map_flow.png)

次のセクションでは、Continuous Profiler が表示するメトリクスを見ていきます。

## SRE と Continuous Profiling

Datadog の Continuous Profiler は強力な APM 機能です。トレースの枠を超えて、アプリケーションのシステムリソース消費に関するインサイトを提供します。CPU 時間、メモリ割り当て、ファイル IO、ガベージコレクション、ネットワークスループットなどを確認できます。

これらのメトリクスは、アプリケーション開発者がコードのパフォーマンスを評価し改善するのに役立ちます。また、SRE がインフラストラクチャに影響を与える問題をより深く掘り下げるのにも役立ちます。より多くの情報があれば、より良い意思決定や、他チームへのより効率的な委任が可能になります。

Continuous Profiler は、課金に影響を与える可能性のある非効率なコードを警告したり、リソース割り当てに関する意思決定に役立てたりすることもできます。

Datadog のライブラリは、Go、Java、node、Python、Ruby のプロファイリングをサポートしています。これらの言語のプロファイリング構成については、[Profiling ドキュメント](https://docs.datadoghq.com/tracing/profiler/)で詳しく学べます。

:::note
プロファイリングは、APM トレースを送信する Storedog の Python サービスに対して自動的に有効になります。
:::

1. **[APM > Profiles](https://app.datadoghq.com/profiling/explorer)** に移動します。

    :::note
    「Discover Datadog Continuous Profiler」ページが表示された場合は、ページを更新してください。
    :::

2. 右上の時間枠のドロップダウンで、`Past 15 Minutes` を選択します。

3. 左側のパネルの **Service** ファセットセクションで、`discounts-service` と `advertisements-service` を選択します。

4. **Visualize as** で、**Timeseries** を選択します。

5. **Measure** で、2 つのサービスを比較するために **Sum of** `CPU - Cores` by `Service` を選択します。

    ![APM プロファイル検索ページ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/apm_profile_search.png)

    **Measure** は、`Allocation Rate` や `Wall Time` など、さまざまな他のメトリクスに変更することもできる点に注意してください。

6. **Visualize as** を **Profile List** に切り替え、`advertisements-service` のプロファイルをクリックします。サイドパネルで開きます。

    ![プロファイルの詳細](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/profile_detail.png)

7. フレームグラフ内のスパンにカーソルを合わせると、より詳しい情報が表示されます。

8. 右側の **CPU Time by** ドロップダウンで、**Function** を別の 1 つか 2 つのオプションに変更して、内訳がどのように変化するかを確認します。これにより、異なるファイル、ライブラリ、さらには関数内の特定の行がどのように動作しているかについて、より深いインサイトが得られます。

Continuous Profiler について覚えておくべき重要なポイントは、有効化の方法と、それが何を提供するかです。これは Datadog ツールボックスのもう 1 つの強力なツールであり、まだ知らない開発者には知らせてあげるとよいでしょう！

## ラボのまとめ

Storedog のすべてのサービスで APM がどのように有効化されたかを確認し、Datadog アプリでそれらのトレースとログエントリの間をシームレスに移動できるようになりました。

また、APM がプロファイリングを提供すること、そしてアプリケーション向けにそれを構成するためのドキュメントがどこにあるかも理解しました。これは、開発者がコードを最適化し、リソースへの負荷を軽減するための優れたリソースです。

完了したら、ターミナルで次のコマンドを入力します。

```bash
finish
```

ラボの右下にある **Check** ボタンをクリックし、結果が出るまで待ちます。
