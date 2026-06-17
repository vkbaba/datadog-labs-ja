---
title: 第4章 - インテグレーション
description: Datadog の OOTB インテグレーションの使い方を学び、Docker でのインテグレーション設定と Autodiscovery の仕組みを理解します。
head: []
---

## ステップ 1: 概要

Storedog は Docker 上で動作しており、Agent はコンテナで実行されているサービスからデータを収集しています。現時点では、Agent はそれらがどのような種類のサービスなのかを把握していません。

インテグレーションは、Agent が監視対象のサービスをより正確に把握できるようにします。このラボでは PostgreSQL インテグレーションに焦点を当てます。これは Datadog のコアインテグレーションの代表的な例であり、「Install the Agent on VM」ラボで設定した経験があるためです。

まず、Datadog が PostgreSQL について標準でどこまで把握しているかを確認しましょう。

1. ターミナルで次のコマンドを実行します。

    ```bash
    docker-compose ps
    ```

    Storedog のコンテナがすでに実行されており、`lab_db_1` という名前のコンテナで PostgreSQL が動作していることがわかります。

    すべてのコンテナが実行されていない場合は、次のコマンドでコンテナを再起動できます。

    ```bash
    docker-compose down && docker-compose up -d
    ```

1. Datadog の [Containers](https://app.datadoghq.com/containers) ページを開きます。コンテナ `lab_db_1` をクリックして詳細を確認します。

    ![インテグレーション設定前の DB サービステンプレート](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/postgres-pre-integration.png)

    Agent は db コンテナで実行されているプロセス（例: `postgres: stats collector`）を確認できますが、これを既知のインテグレーションとして識別するには助けが必要です。

1. [Logs Explorer](https://app.datadoghq.com/logs) を開き、左側のファセットパネルで `postgres` サービスをクリックして結果をフィルタリングします。

    **Note:** エントリが表示されない場合は、ページ上部のドロップダウンで時間枠を **Past 1 Hour** に広げてください。

    ![整っていない状態の DB ログ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/postgres-logs-pre-integration.png)

`postgres` サービスのログは少し雑然としています。Agent はこれらを特別な処理を加えずにそのまま収集しています。その結果、多くのログが誤ってエラーとしてタグ付けされています。

このログ行の詳細の下部には、役立つメモが表示されています。

> No attributes have been extracted from the log message. Set the source value to an integration name to benefit from automatic setup.

この設定はこの後すぐに行います。

さらに、ログ行の `service` は `postgres` として識別されています。`docker-compose.yml` ファイルでは `database` とタグ付けされているにもかかわらずです。これは、Agent がデフォルトで `service` タグにコンテナの `short_image` 名を使用するためです。これも修正します。

### 既存のインテグレーションを確認する

PostgreSQL サービスを設定する前に、Datadog が自動的にインストールしてくれたインテグレーションを確認しておきましょう。

1. [Integrations](https://app.datadoghq.com/account/settings#integrations) ページに移動します。

1. **Installed** の下に、インストール済みであることを示すインジケーター付きで **Docker** が表示されているはずです。これは Datadog が設定なしでインストールできるインテグレーションの 1 つです。ラボ開始時に説明し、「Agent on Docker」ラボで設定したホストの `docker.sock` ファイルをマウントすると、Agent はすぐにこれを認識します。

    ![Autodiscovery された Docker インテグレーション](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/docker-autodiscovered.png)

    Agent コンテナに `docker.sock` をマウントすると、Docker デーモンが実行しているすべてのコンテナに対する Autodiscovery も有効になります。Agent は各コンテナの Autodiscovery ラベルを使用して、そのコンテナのチェックを設定します。Autodiscovery のラベルキーは、以下で確認するとおり `com.datadoghq.ad` で始まります。

1. PostgreSQL はすでに **Installed** の下に表示されているはずです。これは Autodiscovery によるものです。インテグレーションは、**Configuration** タブの下部にある **Uninstall Integration** ボタンをクリックして手動でアンインストールしない限り、インストールされたままになります。

## ステップ 2: サービス向けにインテグレーションを設定する

### Postgres インテグレーションを確認する

1. PostgreSQL カードをクリックします。カードが見つからない場合は、Integrations ページ上部の検索フィールドに `postgres` と入力してください。

1. Postgres のインストール手順を表示するには、**Configuration** タブをクリックします。**Prepare Postgres** の下には、Agent が統計情報をクエリするためのユーザーを作成する `psql` コマンドがあります。これらのコマンドはラボ開始時にすでに実行済みです。

    さらに下にスクロールすると、Agent on a Host ラボで実行した手順が表示されます。

1. **Docker** セクションまでスクロールし、**Metric collection**、**Log collection**、**Trace collection** の手順を確認します。次にこれらの手順を実行します。

### Postgres インテグレーションを設定する
Postgres インテグレーションの手順に従って設定します。
1. IDE タブをクリックし、`docker-compose.yml` ファイルを開きます。次に `db` サービスのセクションまでスクロールします。

1. 次の Autodiscovery ラベルは `docker-compose.yml` 向けに調整済みです。これらを `# postgres integration template here` というコメントの下にある `db` サービスの `labels` ブロックに追加します。

    ```yaml
    com.datadoghq.ad.check_names: '["postgres"]'
          com.datadoghq.ad.init_configs: '[{}]'
          com.datadoghq.ad.instances: '[{"host":"%%host%%", "port":5432,"username":"datadog","password":"datadog"}]'
    ```

    これらの Autodiscovery ラベルは、このコンテナで `postgres` チェックを実行するよう Agent に指示し、メトリクスをクエリするための認証情報を提供します。

1. 同じ `labels` セクションの `# postgres logs label here` というコメントの下に、次の行を追加します。

    ```yaml
    com.datadoghq.ad.logs: '[{"source": "postgresql", "service": "database"}]'
    ```

    これは、このサービスのログをより賢く解析するために PostgreSQL インテグレーションのログパイプラインを使用し、ログ行に `service:database` をタグ付けするよう Datadog に指示します。

1. 最後に、`agent` サービスに環境変数を追加する必要があります。次の行をコピーし、`# agent non-local apm here` というコメントの下にある `environment` ブロックに追加します。

    ```yaml
    - DD_APM_NON_LOCAL_TRAFFIC=true
    ```

    これにより、Agent は他のコンテナからの APM トレースを受け入れられるようになります。データベースに接続する、計装されたアプリケーションを通じて APM が PostgreSQL をどのようにトレースするかは、後で確認します。

### 結果を確認する
1. ターミナルで、次のコマンドを実行してアプリケーションスタックを再起動します。

    ```bash
    docker-compose down && docker-compose up -d
    ```

1. docker-compose の再起動が完了したら、次のコマンドで Datadog Agent のステータスを確認します。

    ```bash
    docker-compose exec datadog agent status
    ```

1. **Running Checks** セクションまでスクロールし、新しい **postgres** セクションを見つけます。

    ![Postgres チェック OK](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/postgres-check-ok.png)

    最初の実行で表示されない場合は、Agent がまだ起動中だったためです。コマンドを再実行すれば表示されるはずです。

1. Datadog の [Integrations](https://app.datadoghq.com/account/settings#integrations) ページに戻ります。Postgres インテグレーションがインストールされていることがわかるはずです（まだの場合）。再度カードをクリックし、**Data Collected** タブを開きます。このインテグレーションで新たに収集され、プラットフォーム上で利用可能になったメトリクスを確認できます。

1. [Metrics > Explorer](https://app.datadoghq.com/metric/explorer) に移動します。**Graph** フィールドに `postgresql.table.count` と入力し、Enter キーを押します。時間経過とともに 4 テーブルで安定したグラフが表示されるはずです。

1. [Dashboards](https://app.datadoghq.com/dashboard/lists) に移動し、**Postgres - Overview** と **Postgres - Metrics** を見つけます。これらはインテグレーションが提供する標準ダッシュボードです。開いて、何が提供されているか確認しましょう。

1. [Logs](https://app.datadoghq.com/logs) に移動し、左側の新しい `database` サービスファセットをクリックして、そのサービスタグのログ行をフィルタリングします。これは以前 `postgres` としてタグ付けされていたサービスです。時間枠ドロップダウンを **Past 1 Hour** 以上に設定すると、古い `postgres` サービスタグも引き続き表示されます。

1. ログ行をクリックして詳細パネルを確認します。`database` サービスとして正しく識別され、**Event Attributes** が JSON としてフォーマットされていることがわかります。これは、Datadog がこのインテグレーションを検出した際にインストールされたログパイプラインの利点です。

    ![より見やすくなった Postgres ログ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/postgres-log-post-config.png)

1. [Logs > Configuration](https://app.datadoghq.com/logs/pipelines) に移動し、新しい **Postgresql** パイプラインをクリックします。ログパイプラインの動作については、Logs ラボでさらに詳しく学びます。

## ステップ 3: すべてのサービスを設定する

残りの Storedog サービスは Ruby または Python で動作しており、どちらにも Datadog インテグレーションがあります。ただし、PostgreSQL、Apache、Nginx などの普及した明確に定義されたアプリケーションとは異なり、Ruby や Python は単にアプリケーションを実行するプロセスにすぎません。これらのアプリケーションは独自のものであることもあれば、Rails や Flask などのフレームワークであることもあります。これらのアプリケーションを計装して、Application Performance Monitoring（APM）を使用して Datadog と通信させるかどうかは、アプリケーション開発者次第です。

APM については、このコースの後半でさらに詳しく学びます。ここでは、Ruby と Python のインテグレーションのログパイプライン機能を有効にできます。これは、`docker-compose.yml` ファイル内の各サービスにラベルを 1 つ追加することで実現します。

### Discounts サービスにラベルを付ける
まず、discounts サービスに Autodiscovery ラベルを追加します。

1. タブで `docker-compose.yml` を開きます。

1. `# discounts log label here` というコメントの下にある `discounts` サービスのラベルに、次の行を追加します。

    ```yaml
    com.datadoghq.ad.logs: '[{"source": "python", "service": "discounts-service"}]'
    ```

    このラベルは、このサービスのログを Python パイプラインを使用して解析するよう Datadog に指示します。また、各ログ行に `service:discounts-service` をタグ付けします。

1. ターミナルで、次のコマンドを使ってスタックを再起動します。

    ```bash
    docker-compose down && docker-compose up -d
    ```

    続行する前に、ターミナルに `Creating lab_discounts_1` が表示されるまで待ちます。

1. Datadog アプリで [Logs](https://app.datadoghq.com/logs) に移動し、時間枠セレクターを `Past 15 Minutes` に設定します。

1. ファセットパネルの **Service** セクションで、新しい `discounts-service` ファセットをクリックして、そのサービスにログをフィルタリングします。

1. `discounts-service` のログ行をクリックして詳細を表示します。

    ![ログインテグレーション設定後の discounts サービス](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts-post-log-integration.png)

1. 右上の Python ロゴによって、Datadog がソースを正しく識別したことがわかります。また、サービスはコンテナの `short_image` 名から取得されたデフォルトの `discounts` ではなく、正しく `discounts-service` としてタグ付けされるようになりました。

    ただし、ログは構造化された JSON に解析されていません。[Logs > Configuration](https://app.datadoghq.com/logs/pipelines) を見ると、Python パイプラインは確かに有効になっています。

    問題は、discounts サービスが標準的な形式でログを出力していないことです。Datadog が解析できる形式でログを出力するかどうかは、アプリケーション開発者次第です。これに対処する方法は Logs ラボと APM ラボで学びます。[Python インテグレーションのドキュメント](https://docs.datadoghq.com/logs/log_collection/python/?tab=jsonlogformatter)でも解決策が提供されています。

### すべてのサービスにラベルを付ける
これで、他のサービスにも Autodiscovery ラベルを追加できます。

1. IDE タブの `docker-compose.yml` で、`# advertisements log label here` というコメントの下に次の行を追加して `advertisements` サービスにラベルを付けます。

    ```yaml
    com.datadoghq.ad.logs: '[{"source": "python", "service": "advertisements-service"}]'
    ```

1. `# frontend log label here` というコメントの下に次の行を追加して `frontend` サービスにラベルを付けます。

    ```yaml
    com.datadoghq.ad.logs: '[{"source": "ruby", "service": "store-frontend"}]'
    ```

    `service` の値は、各サービスの `com.datadoghq.tags.service` ラベル値と同じであることに注意してください。

1. ターミナルで、次のコマンドを使ってスタックをもう一度再起動します。

    ```bash
    docker-compose down && docker-compose up -d
    ```

1. 次のコマンドを実行して、datadog agent のステータスを確認します。

    ```bash
    docker-compose exec datadog agent status
    ```

    **Logs Agent** セクションまでスクロールすると、`com.datadoghq.ad.logs` ラベルを追加した各コンテナが個別のエントリを持ち、それぞれのステータスと統計情報を表示していることがわかります。以前は、これらのコンテナは **container_collect_all** の下にまとめられ、統計情報が集約されていました。

    ![個別のコンテナログエントリ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/individual_log_checks.png)

    `Inputs:` の下に表示される値を、次のコマンドで表示される `CONTAINER ID` の値と比較することで、これを確認できます。

    ```bash
    docker ps
    ```

1. Datadog アプリで [Integrations](https://app.datadoghq.com/account/settings#integrations) ページを見て、新しくインストールされた Python と Ruby のインテグレーションを確認します。

1. [Dashboards](https://app.datadoghq.com/dashboard/lists) に移動し、新しい **Python Runtime Metrics** と **Ruby Runtime Metrics** ダッシュボードを確認します。まだ何もグラフ化されていませんが、コースの後半で APM を設定すればグラフ化されます。

1. [Logs Explorer](https://app.datadoghq.com/logs) に移動し、最新の `advertisements-service` と `store-frontend` のログ行を見ます。クリックして詳細を確認します。ログ行は Python と Ruby のソースとして正しく識別され、正しい `service:` タグが付けられるようになりました。

`discounts-service` と同様に、これらのサービスでも Python と Ruby のログパイプラインが有効になっていますが、ログ出力は統一された形式になっていません。`store-frontend` のログは、コースの後半で APM を設定するとはるかに見やすくなります。

## ラボのまとめ

おめでとうございます！Datadog インテグレーションのインストール方法に関するコースのセクションを完了しました。

また、コンテナの詳細とログエントリの両方で、ラベル値がタグとして Datadog アプリに表示されることも確認しました。

完了したら、ターミナルで次のコマンドを入力します。

```bash
finish
```

ラボの右下隅にある **Check** ボタンをクリックし、結果が表示されるまで待ちます。
