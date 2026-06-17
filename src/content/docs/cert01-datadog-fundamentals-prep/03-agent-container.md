---
title: 第3章 - コンテナ上の Datadog Agent
description: Datadog Agent を Docker コンテナとしてインストールし、環境変数とラベルで設定する方法を学びます。
head: []
---

## docker-compose.yml を設定する

前のラボでは、YAML 設定ファイルを使用して Agent を設定しました。このラボでは、環境変数とラベルを使用して Agent や他のコンテナを設定します。Agent コンテナの「インストール」は、どの Docker イメージを使用するかを指定することで行います。コンテナ版の Agent は、設定ファイルではなく、環境変数とコンテナラベルに依存します。

1.  IDE で `docker-compose.yml` を開きます。

1.  このファイルの構造に慣れておきましょう。`discounts`、`frontend`、`advertisements`、`db` という各 Storedog サービスごとにブロックがあります。

    `puppeteer` は無視してかまいません。これは Storedog アプリケーションに対してトラフィックを生成しているものです。

1.  Datadog Agent をサービスとして追加するには、次のコードブロックをクリックしてコピーします。

    ```yaml
    datadog:
        image: 'datadog/agent:7.71.1'
        environment:
          - DD_API_KEY
          - DD_HOSTNAME=dd101-sre-host
          - DD_LOGS_ENABLED=true
          - DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true
          - DD_PROCESS_AGENT_ENABLED=true
          - DD_DOCKER_LABELS_AS_TAGS={"my.custom.label.team":"team"}
          - DD_TAGS=env:dd101-sre
        volumes:
          - /var/run/docker.sock:/var/run/docker.sock:ro
          - /proc/:/host/proc/:ro
          - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
    ```

1. `docker-compose.yml` 内のコメント `# paste agent block here` の下に貼り付けます。

    次のスクリーンショットのように、他のサービスと位置が揃っていることを確認してください。

    ![docker-compose.yml に Agent ブロックを貼り付ける](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/paste_agent_block.png)

    :::tip
    IDE では複数行を選択して TAB を押すとインデントを増やすことができ、SHIFT-TAB で減らすことができます。
    :::

詳細を見てみましょう。

* `image: 'datadog/agent:7.71.1` は、コンテナに使用する特定の Agent Docker イメージを指定します。

* `environment` ブロックは、Agent コンテナ内に指定した環境変数を設定します。

    - `DD_API_KEY`: Agent が Datadog にメトリクスやイベントを送信するために必要です。ホスト環境で設定されており、ターミナルで `env |grep DD_API_KEY` を実行すると確認できます。`environment` セクションで値が設定されていないため、Docker Compose はホストの環境変数の値を使用します。

    - `DD_HOSTNAME`: この仮想マシンのホスト名を明示的に設定します。

    - `DD_LOGS_ENABLED`: ログを収集するかどうか。

    - `DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL`: 検出したすべてのコンテナが出力するログを収集するかどうか。

    - `DD_PROCESS_AGENT_ENABLED`: ライブプロセス情報を収集するかどうか。

    - `DD_DOCKER_LABELS_AS_TAGS`: カスタムコンテナラベルをカスタムタグとして扱うように Agent を設定します。この場合、Agent がラベル `my.custom.label.team` を読み取ると、その値をタグ `team` に割り当てます。

    - `DD_TAGS`: ホストから出力されるすべてのデータに対してグローバルな `env` タグを設定します。この場合、特別な `env` タグを `dd101-sre` に設定しています。

        このコースを通して、Datadog においてタグがいかに価値あるものかを見ていきます。今は、この環境でタグをどのように設定するかに焦点を当てましょう。

* `volumes` ブロックは、ホストファイルシステム上のファイルをコンテナにマウントします。これにより Agent は強力な能力を得て、Docker 環境に関するデータを Docker デーモンに問い合わせたり、ホスト自体のプロセスデータを取得したりできるようになります。

Storedog インフラストラクチャに Agent コンテナを追加できたので、アプリケーションを起動して結果を探索できます。

## Storedog を起動する

このセクションでは、Storedog アプリケーションを起動し、そのインフラストラクチャとログを Datadog で探索します。

1.  ターミナルで、`/root/lab` ディレクトリにいることを確認します。そうでない場合は、次のコマンドを実行します。

    ```bash
    cd /root/lab
    ```

2.  アプリケーションスタックを起動するには、次のコマンドを実行します。

    ```bash
    docker-compose up -d
    ```

3.  コンテナが実行されたら、Agent の `status` コマンドを実行します。

    ```bash
    docker-compose exec datadog agent status
    ```

    このコマンドは `docker-compose` に対して、`datadog` コンテナ内で `agent status` というコマンドを実行するよう指示します。

    これは、前のラボで実行した `datadog-agent status` コマンドと同等です。コンテナ内では `datadog-agent` が単に `agent` という名前に変更されています。

4.  ステータス出力の **Logs Agent** セクションまでスクロールし、**container_collect_all** ブロックに注目してください。

    :::note
    **Logs Agent** の下に **container_collect_all** ブロックが表示されない場合は、数秒待ってから再度 Agent の `status` コマンドを実行してください。表示されるまでに少し時間がかかります。
    :::

    個々のサービスを Agent 用に設定していないにもかかわらず、Agent の `DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL=true` 環境変数により、Agent はその横で実行されているすべてのコンテナのログをすべて取得します。

5.  さらに上にスクロールして **Forwarder** セクションを表示します。これはすべてを Datadog に送信するプロセスです。

    このセクションの一番下にある **API Keys status** を見つけてください。これはホストから渡された `DD_API_KEY` 環境変数の末尾の数文字を表示します。これは Datadog トレーニングアカウントの認証情報の API キーと同じはずです。

6.  Agent の設定を確認するには、Agent の `config` コマンドを実行します。

    ```bash
    docker-compose exec datadog agent config
    ```

7. `tags` 設定を見つけます。`env:dd101-sre` がリストされていることを確認してください。

## Datadog App を探索する

Agent が設定どおりに実行されていることを確認できたので、Datadog App が受信している内容を見てみましょう。

1. ターミナルに表示されている Datadog トレーニングアカウントの認証情報を使用して、[Datadog](https://app.datadoghq.com) にログインします。

1.  **[Infrastructure](https://app.datadoghq.com/infrastructure)** に移動します。このラボの仮想マシン用に設定したホスト名 `dd101-sre-host` が表示されます。

    Agent コンテナは、Docker デーモンを実行しているホストにアクセスできるのです。

1.  **[Infrastructure > Containers](https://app.datadoghq.com/containers)** に移動します。ここでは、すべてのサービスコンテナを確認できます。

1.  `lab_advertisements_1` をクリックし、**ALL TAGS** の下に Agent がデフォルトで取得するメタデータがあることに注目してください。すべてのタグを表示するには、省略リストを展開する必要があるかもしれません。

1. Agent が収集したすべてのイベント、メトリクス、ログに適用された `env:dd101-sre` タグを見つけてください。

    ![設定前の discounts コンテナ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts-container-pre-config.png)

1. このサイドパネルで **Logs** タブをクリックすると、次の警告が表示されることがあります。

    ![ログが有効になっていない](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/logs_not_enabled.png)

1. その場合は、**Get started with Log Management to view container logs** リンクをクリックします。これによりログが有効になります。ログが有効になったら、戻って `lab_advertisements_1` のログを表示します。

1.  **[Logs](https://app.datadoghq.com/logs)** に移動して、そこにあるログエントリを確認します。

1. 左側のファセットパネルで **Service** セクションを展開し、**discounts** を選択して、discounts サービスのログだけを表示します。

    Agent がすべてのコンテナからログを取得するように設定されているため、`discounts` サービスのログを確認できます。ただし、赤いマークで示されているように、それらのほとんどが **ERROR** と判定されていることに注目してください。

    :::note
    これらのサービス名は、コンテナの短いイメージ名から推測されたものです。これらのデフォルトのサービス名は、まもなく上書きします。
    :::

1.  `discounts` のログエントリをクリックします。ログの内容に加えて、Agent はサービス名に基づいて **CONTAINER NAME**、**DOCKER IMAGE**、**SERVICE**、**SOURCE** などの多くのメタデータを取得できています。

    **Event Attributes** の下に、source をインテグレーション名に設定すべきというメッセージが表示されていることに注目してください。

    ![設定前の discounts ログ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts-logs-pre-configure.png)

    これをどのように行うかは、このコースの後半で見ていきます。

Agent の設定ができたので、他のサービスコンテナのラベルを設定して、Agent が正しくタグ付けできるようにしましょう。

## Discounts サービスを設定する

Agent は単純なヒューリスティックを使用して、他のコンテナを自動的にタグ付けします。たとえば、コンテナの名前を `service` タグとして使用します。これらのタグは、コンテナにラベルを追加することで上書きできます。

discounts サービスから始めて、`docker-compose.yml` 内の各サービスに `env`、`service`、`version` タグを追加します。これらのタグは Unified Service Tagging を可能にします。これについては、このコースの後半で APM とログを扱う際に学びます。

1.  IDE で `docker-compose.yml` を開きます。

2.  コメント `# paste discounts labels here` の下にある `discounts` サービスに、次のラベルを追加します。

    ```yaml
    labels:
          com.datadoghq.tags.env: 'dd101-sre'
          com.datadoghq.tags.service: 'discounts-service'
          com.datadoghq.tags.version: '2.1'
          my.custom.label.team: 'discounts'
    ```

    インデントが正しいことを確認してください。ラベルは次のスクリーンショットのようになるはずです。

    ![正しくインデントされた discounts ラベル](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/correctly_indented_discounts_labels.png)

    :::note
    `com.datadoghq.tags.env: 'dd101-sre'` はサービスの `env` タグを設定し、`my.custom.label.team: 'discounts'` は `agent` サービスの `DD_DOCKER_LABELS_AS_TAGS` で宣言されているとおり、カスタムタグ `team:discounts` を設定します。
    :::

3.  ターミナルで、次のコマンドを実行してアプリケーションスタックを再起動します。

    ```bash
    docker-compose down && docker-compose up -d
    ```

    続行する前に、Docker Compose が完了するのを待ってください。

4.  Datadog で **[Infrastructure > Containers](https://app.datadoghq.com/containers)** に移動します。新しいコンテナが表示されるのを待ちます。**STARTED (AGO)** 列は、コンテナが1分前に起動したことを示すはずです。

5. **lab_discounts_1** をクリックします。**ALL TAGS** の下に追加された新しい `service`、`team`、`version` タグに注目してください。すべてのタグを表示するには、省略リストを展開する必要があるかもしれません。

    ![設定後の discounts コンテナ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/discounts-container-post-config.png)

6.  **[Logs](https://app.datadoghq.com/logs)** に移動します。

7.  左側のファセットパネルで `discounts` サービスでフィルタリングし、ログエントリをクリックします。

    `service:discounts-service` を含む、追加した新しいタグが表示されます。アプリケーションからのデフォルトの `service:discounts` タグは、このコースの後半で APM を使って上書きするまで残り続けます。

discounts サービスコンテナが正しくラベル付けおよびタグ付けされたので、残りのサービスを設定できます。

## 残りのサービスを設定する

discounts サービスに固有のタグを付与できたので、残りのアプリケーションサービスを設定できます。

便宜上、完全に設定済みの Docker Compose ファイルがすでにファイルシステム内に用意されています。

1.  ターミナルで、次のコマンドを実行してアプリケーションサービスを停止します。

    ```bash
    docker-compose down
    ```

2.  次のコマンドを実行して、既存の `docker-compose.yml` を完全に設定済みの Docker Compose ファイルで置き換えます。

    ```bash
    cp /root/docker-compose-complete.yml /root/lab/docker-compose.yml
    ```

3.  次のコマンドを実行して、アプリケーションサービスを再度起動します。

    ```bash
    docker-compose up -d
    ```

4.  起動して Datadog にデータを送信するのを待っている間に、IDE で新しい `docker-compose.yml` ファイルを開きます。ファイルがすでに開いている場合は、更新するか再度開く必要があるかもしれません。

    すべてのサービスが、`discounts` サービスと同様にラベルを使用して設定されていることに注目してください。

    各サービスには `depends-on` の下に `datadog` がリストされるようになりました。これにより、Agent がデータを収集できるようになる前にサービスが起動するのを防ぎます。

5. Datadog に戻って、各サービスのログとタグを確認してください。

## ラボのまとめ

おめでとうございます。これで、Datadog Agent コンテナをインストールして設定する方法がわかりました。環境変数を使用して Agent を設定する方法と、ラベルを使用して Agent が監視する各コンテナに固有のタグを付ける方法を学びました。また、ラベルの値がコンテナの詳細とログエントリの両方で、Datadog App 上のタグとして表現されることも確認しました。

完了したら、ターミナルで次のコマンドを入力してください。

```bash
finish
```

ラボの右下隅にある **Check** ボタンをクリックし、次のレッスンに進む前にラボが終了するのを待ってください。
