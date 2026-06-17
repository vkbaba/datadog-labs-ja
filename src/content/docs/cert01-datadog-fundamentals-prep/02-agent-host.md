---
title: 第2章 - ホスト上の Datadog Agent
description: YAML 設定ファイルを使って仮想マシン上に Datadog Agent をインストールし、ホスト名やログ収集、Agent チェックを設定します。
head: []
---

# Datadog Agent - ホスト

このラボでは、YAML 設定ファイルを使ってホスト上に Agent をインストールし、設定します。

**学習目標**:

* ホストへの Agent のインストール方法を学ぶ
* そのホスト上で Agent の設定を構成する方法を理解する
* Agent のコマンド `status`、`config`、`configcheck` を学ぶ
* ホスト上で実行されているサービス向けに Agent インテグレーションを設定する方法を知る

環境の準備ができたら、下の **Start** ボタンをクリックしてください。

:::note
このラボは 10 分間操作がないとタイムアウトします。
:::

このラボでは、各セクションが一連のステップに分かれています。セクション間を移動するには、各ヘッダーをクリックして展開または折りたたみます。

このラボ用にプロビジョニングされた Datadog トレーニングアカウントの認証情報を使って、[Datadog](https://app.datadoghq.com/account/login/) にログインしていることを確認してください。認証情報はラボのターミナルで `creds` を実行すると確認できます。

## ホストへの Agent のインストール

このラボでのホストは仮想マシンです。以下の手順は物理マシンでもまったく同じです。

1. ターミナルに表示されている Datadog トレーニングアカウントの認証情報を使って、[Datadog](https://app.datadoghq.com) にログインします。

1. **[Integrations > Install Agents](https://app.datadoghq.com/fleet/install-agent/latest?platform=overview)** に移動し、**Linux** をクリックします。

1. **Select API Key** ボタンをクリックして API キーを選択します。**Key**（**Key ID** ではありません）の末尾 4 桁が、Datadog トレーニングアカウントの認証情報と一致しているはずです。

    **Use API Key** ボタンを選択すると、続く **one-step install** コマンドに API キーが自動的に入力されます。

:::caution
APM Instrumentation は有効にしないでください。
:::

1. Agent をインストールするための完全な **one-step install** コマンドをコピーします。

    ![Ubuntu 向けの簡単な one-step Agent インストール](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/easy-one-step-install.png)

2. ラボのターミナルに戻り、コマンドを貼り付けて Enter キーを押し実行します。

    Agent のインストールが完了するまでには約 1 分かかります。完了すると、次のような確認メッセージが表示されます。

    ![Agent がインストールされたことを示す確認メッセージ](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/agentinstalled.png)

3.  すべてが正しく動作していることを確認するため、次のコマンドを実行します。

    ```bash
    datadog-agent status
    ```

4.  上にスクロールして表示内容を確認します。**API Keys status** の下に、API キーの末尾の文字が表示されていることに注目してください。

    また、Logs Agent が実行されていないことにも気付くでしょう。これは後ほど変更します。

5.  実行中の Agent で解決されたすべての設定値を確認するには、次のコマンドを実行します。

    ```bash
    datadog-agent config
    ```

    この出力は冗長ですが、デバッグの際に非常に役立ちます。

## ホスト上での Agent の設定

ホスト上で実行する場合、Datadog Agent は YAML ファイルを編集することで設定します。Linux システムでは、これらのファイルはデフォルトで `/etc/datadog-agent` に配置されます。これらのファイルは、one-line インストーラーを実行したときに作成されました。

:::note
このラボでは、Datadog Agent の設定ディレクトリへのシンボリックリンクが `/root/lab/datadog-agent` に用意されています。これにより、IDE からディレクトリに便利にアクセスできます。
:::

Datadog Agent のあらゆる側面を設定するファイルが `datadog.yaml` です。このファイルには数百もの設定オプションとそのデフォルト値が含まれています。このセクションでは、このファイルを更新して明示的なホスト名を設定し、ログ収集を有効にします。

### ホスト名

重要な設定の 1 つが、Agent が実行されているマシンのホスト名です。明示的に設定されていない場合、Agent はヒューリスティックを使ってメトリクス、ログ、イベントにホスト名のタグを付けます。これらのヒューリスティックについては [Agent ドキュメント](https://docs.datadoghq.com/agent/faq/how-datadog-agent-determines-the-hostname/?tab=agentv6v7) で詳しく学べます。

ここでは、明示的なホスト名を使って Agent を設定します。これにより、Datadog アプリ内でログ、イベント、メトリクスを分離しやすくなります。このコースのすべてのラボで同じホスト名を使用するため、それぞれが固有の仮想マシンであっても、Datadog はそれらを同じホストとして認識します。

1.  IDE で `datadog-agent` ディレクトリを展開します。

2.  `datadog.yaml` を開きます。

3.  11 行目にすでに API キーが設定されていることに注目してください。実行した one-step Agent インストールコマンドには API キーが含まれており、インストールプロセスがこのファイルに書き込んでくれました。

4.  下にスクロールして、`# hostname: <HOSTNAME_NAME>` の行を見つけます。

    この設定オプションは `#` 文字でコメントアウトされているため、Agent に無視されます。

5.  `#` 文字とその後ろのスペースを削除して、この行のコメントを解除します。IDE がファイルを自動的に保存することを忘れないでください。

6.  `<HOSTNAME_NAME>` を次の値に置き換えます。

    ```bash
    dd101-sre-host
    ```

その部分は次のようになっているはずです。

```yaml
## @param hostname - string - optional - default: auto-detected
## @env DD_HOSTNAME - string - optional - default: auto-detected
## Force the hostname name.
#
hostname: dd101-sre-host
```

### ログ収集

ログ収集はデフォルトでは有効になっていないため、`datadog.yaml` を編集してこのホストでログ収集を有効にします。

1.  `datadog.yaml` で、854 行目あたりの **Log Collection Configuration** というタイトルのセクションまで下にスクロールします。

    :::tip
    IDE の検索機能は `Ctrl/Cmd+F` を押すと使用できます。
    :::

2.  `logs_enabled` の行を見つけます。

    値を `true` に設定し、先頭の `#` とスペース文字を削除して行のコメントを解除します。その部分は次のようになっているはずです。

      ```yaml
      ##################################
      ## Log collection Configuration ##
      ##################################

      ## @param logs_enabled - boolean - optional - default: false
      ## @env DD_LOGS_ENABLED - boolean - optional - default: false
      ## Enable Datadog Agent log collection by setting logs_enabled to true.
      #
      logs_enabled: true
      ```

3.  ラボのターミナルに戻り、次のコマンドを実行して Agent を再起動します。

    ```bash
    systemctl restart datadog-agent
    ```

4.  次のコマンドを実行してステータスを確認します。

    ```bash
    datadog-agent status
    ```

    :::note
    `status` コマンドの実行でエラーが発生した場合、パーサーがどこまで解析できたかを示す行が表示されます。YAML ファイルでは空白が非常に重要であることを忘れないでください。
    :::

5.  ステータス出力をスクロールして **Logs Agent** セクションを見つけます。今度は値が表示されていることに注目してください。

6.  出力の先頭までスクロールして **Hostnames** セクションを見つけます。ここには、明示的に設定したホスト名が表示されます。

    ![ステータス出力に表示されるホスト名](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/status_hostname.png)

`host_aliases` の行にも注目してください。これらは Agent が検出した他のホスト名の候補です。これらが、設定したホスト名ほど人間にとってわかりやすくないことがわかります。

IDE に戻り、`datadog.yaml` で "Trace Collection Configuration" というタイトルの設定ブロックを見つけます。

これは `enabled` になっていますが、コメントアウトされていることがわかります。これは Datadog の設定ファイルがデフォルト値をドキュメント化する方法です。変更したい項目だけコメントを解除すればよいのです。ここでは値を変更しないため、このままコメントアウトしておきます。

このファイルを自由にスクロールして、Datadog Agent の設定オプションの感覚をつかんでください。

## Agent チェックの設定

Datadog Agent はデフォルトでコアとなる一連のチェックを実行します。これには `cpu`、`disk`、`memory`、`uptime` などが含まれます。`datadog-agent status` コマンドを実行すると、これらは出力の **Collector \> Running Checks** セクションに表示されます。

これらの各チェックには、対応する設定ファイルが `datadog-agent/conf.d/` のサブディレクトリに配置されています。

1.  Agent が実行しているチェックとその設定ファイルのパスの簡潔な一覧を確認するには、ターミナルで次のコマンドを実行します。

    ```bash
    datadog-agent configcheck
    ```

    各チェックの **Configuration source** が表示されるはずです。**disk check** の場合の次の例のように、サブディレクトリとファイル名に注目してください。

    ![Agent configcheck](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/agent_configcheck_output.png)

2. IDE に戻り、そのファイル `datadog-agent/conf.d/disk.d/conf.yaml.default` を開きます。これらのチェックの設定ファイルがすべて `.default` で終わっていることに注目してください。

    メインの Agent 設定ファイルと同様に、`disk` チェックのデフォルト設定値がこのファイルに記載されています。システムに合わせて `disk` チェックをカスタマイズしたい場合は、オプションのコメントを解除してその値を変更します。

    たとえば、Agent に物理ストレージデバイスのみをチェックさせたい場合は、`include_all_devices` のコメントを解除して値を `false` に設定します。

    :::note
    Agent の設定ファイルを更新した場合は、変更を反映させるために Agent を再起動する必要があります。
    :::

`datadog-agent/conf.d/` 内のすべてのチェックは、Agent ベースのインテグレーションとして知られており、膨大な Datadog インテグレーションエコシステムの一部です。そのため、これらすべてのドキュメントは [インテグレーションドキュメント](https://docs.datadoghq.com/integrations) で見つけられます。インテグレーションドキュメントは、探しているものを素早く見つけるための強力な検索インターフェースを提供します。他のインテグレーションについては、このコースの後半で詳しく学びます。

Datadog インテグレーションでは提供されていないチェックを Agent に実行させたい場合は、独自に作成できます。詳細は [カスタム Agent チェックの作成ドキュメント](https://docs.datadoghq.com/developers/custom_checks/write_agent_check/) を参照してください。

## Datadog アプリでのインフラストラクチャの確認

Agent がメトリクス、イベント、ログを Datadog に送信していることはご存じの通りです。Datadog アプリで結果を簡単に確認してみましょう。

1.  Datadog トレーニングアカウントの認証情報を使って、[Datadog](https://app.datadoghq.com) にログインしていることを確認します。

1.  [Infrastructure](https://app.datadoghq.com/infrastructure) に移動します。

    このリストには複数のホストが表示される場合があります。そのうち 2 つは同じホストですが、名前が異なります。1 つは `datadog.yaml` で設定する前のホスト名、もう 1 つは設定後のホスト名です。Datadog が追いついて古いホスト名を非アクティブにするまでには少し時間がかかります。

    インフラストラクチャリストに 2 つ以上のホストが表示されている場合は、過去 2 時間以内に他のコースを受講した可能性があります。各コースは固有のホスト名を使った仮想マシンでラボを実行します。

    このコースで使用するホスト名は `dd101-sre-host` です。

    ![インフラストラクチャリストに表示される複数のホスト](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/infrastructure_list_hosts.png)

1.  `dd101-sre-host` をクリックして詳細サイドパネルを開きます。**Datadog** の下には、Agent がこのホストに自動的に追加した多数のタグが表示されます。

1.  [Logs](https://app.datadoghq.com/logs) に移動します。

    ログの有効化を促す紹介ページが表示された場合は、**Get started** ボタンをクリックして閉じます。

    まだログはあまり多くないかもしれませんが、次のラボではここに多くのログが表示されます。

Datadog アプリを自由にクリックして操作し、慣れてみてください。これらのプロダクトやページのほとんどは、このコースの残りの部分で詳しく扱います。

## 小テスト - Datadog Flare の生成

Datadog Agent の flare を生成します。

:::note
ケース ID を開きたくないため、メールアドレスは追加しないでください。また、flare の送信を求められたら拒否できます（`n` と入力してください）。
:::

詳細は [こちら](https://docs.datadoghq.com/agent/basic_agent_usage/ubuntu/?tab=agentv6v7) で確認できます。

## ラボのまとめ

おめでとうございます！ これで VM ホスト上で Datadog Agent をインストールし、設定する方法がわかりました。

それでは、flare が正しく生成できたかを確認しましょう。

ラボの右下にある **Check** ボタンをクリックしてください。テストに合格したら、ラボが閉じるのを待ってから次のレッスンに進んでください。
