---
title: 第3章 - 環境の分析
description: SLO バーンレートを分析し、サービスマップで依存関係を確認し、自動修復ワークフローを構築します。
head: []
---

**Paymentservice Reliability SLO** の設定中に、すでに SLO が違反状態になっていることに気づいたかもしれません。何が原因だったのかを調査しましょう。

## SLO バーンレートの分析

:::note
**サービスパネル** のステータスが以下のスクリーンショットと一致するまでに 1〜2 分かかる場合があります。まだ反映されていない場合は、少し待ってからラボの手順に従いページを更新するか、次のステップに進んで最後に確認してください。
:::

1. **[APM > Software Catalog](https://app.datadoghq.com/services?env=ddenv&lens=Reliability)** を開きます。

    :::note
    Software Catalog は、すべてのサービス、そのヘルスステータス、主要メトリクスの一元的なビューを提供します。アプリケーション全体の信頼性を俯瞰するのに特に役立ちます。
    :::

    以下のように **Reliability** タブに表示されていることを確認します:
    ![Software Catalog の Reliability タブ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/service-catalog-reliability-tab.png)

2. 結果のパネルから `paymentservice` をクリックします。

3. 先ほど設定した **SLO** と **SLO モニター** のステータスが表示されます。

    Alberto の `paymentservice` が問題の根本原因であるという推測は正しかったことがわかります。`paymentservice` の SLO が **違反（Breached）** 状態になっています。このサービスはしばらくの間エラーバジェットを消費し続けており、信頼性が低いことを示しています。

4. Deployments では、`0.7.0`、`0.7.1`、`0.8.0` の 3 つのバージョンが確認できます。バージョン `0.7.1` はエラー率が高く、`0.7.0` と `0.8.0` にはエラーがありません:
    ![Paymentservice サービスページの SLO](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/paymentservice-service-summary-deployments.png)

    これは、不安定なバージョンの `paymentservice` が本番環境にデプロイされた、つまりコード関連の問題であることを示唆しています。

    根本原因を特定したので、次はサービスの依存関係を調べることで `paymentservice` の問題がより広範にどのような影響を与えているかを把握しましょう。

## サービスマップの分析

1. `paymentservice` タブから、右上のドロップダウンメニューで **Service Map** を選択します。

    ![サービスページのタブ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/service-page-tab.png)

2. `paymentservice` には 2 つのダウンストリームサービス（`paymentdb` と `paypal`）があることがわかります。また、**Critical** 状態にある上流サービス `checkoutservice` も確認できます。
    ![Checkout の Critical 状態](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/checkout-critical.png)

3. より広い視野で確認するには、`checkoutservice` をクリックして `inspect` を選択します。
    これにより、`paymentservice` を中心とした Swagstore 全体の依存関係が表示されます。
    ![依存関係マップ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/dependency-map.png)

4. `paymentservice` はフロントエンドのチェックアウトフロー（`frontend` → `checkout` → `paymentservice`）のクリティカルパスに位置しています。

    これにより、`paymentservice` が顧客トランザクションの完了に不可欠であることがわかります。これが失敗すると、チェックアウトプロセス全体が壊れ、顧客体験とビジネス収益に直接影響します。

根本原因（不安定なデプロイバージョン 0.7.1）とビジネスへの影響（チェックアウトフローの破壊）の両方を特定しました。SLO とアラートにより問題を素早く検出できるようになりましたが、さらに多くのことができます。

次のセクションでは、問題が検出されたときにサービスを迅速に復旧させるための自動修復を実装します。

## 自動修復の実装

バージョン 0.7.1 の `paymentservice` がクリティカルなチェックアウトフローに影響を与えたことを特定しました。将来また不安定な `paymentservice` が本番環境にデプロイされた場合に備えて、問題発生時の影響を最小化するための即時対応策が必要です。

Datadog の [Workflow Automation](https://docs.datadoghq.com/service_management/workflows/) を使用すると、不安定なバージョンが誤って本番環境にリリースされた場合に自動的に修復し、問題の検出から解決までの時間を短縮できます。

Datadog に設定済みの SLO モニターを活用することで、不安定なバージョンがデプロイされた場合に `paymentservice` を安定したリリースへ自動ロールバックするアクションをトリガーできます。これにより、チームが根本原因に対処している間も安定性を迅速に回復（MTTR の短縮）できます。

次のワークフローを構築しましょう:

- **Payment reliability SLO Alert!** バーンレートしきい値に達したときにトリガーされる
- 信頼性の問題を調査するための詳細情報を含むインシデントを自動作成する
- `paymentservice` を最後の安定バージョンに自動ロールバックする

以下の手順で **Automation Workflow** を作成します:

1. **[Automation > Actions : + New Workflow](https://app.datadoghq.com/workflow/create)** を開きます。

2. ワークフロートリガーを設定します:

    - Datadog Trigger として **Monitor** を選択します:
      ![ワークフローのモニタートリガー](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-monitor-selection.png)

    :::note
    AI でワークフロー全体を生成することも可能ですが、このケースではモニタートリガーを使用します。
    :::

3. **Mention handle** を以下に変更します:

    ```
    paymentservice-rollback
    ```

4. Automatic Workflow ページの上部でワークフロー名を以下に変更します:

    ```
    Paymentservice Automatic Workflow
    ```

    ![ワークフローの名前変更](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-rename.png)

6. **Monitor** ボックスの下の **+** ボタンをクリックします。

    - `Incident` と入力し始めて、アクション一覧から **Create Incident**（Datadog Incidents）を選択します:
      ![Create Datadog Incident の追加](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-add-create-incident.png)

    - 右側に **Create Incident** フォームが表示されます。以下を設定します:
        - **Title**:
          ```
          Swagstore Checkouts Failing!
          ```
        - **Incident Commander**: トライアルアカウントのユーザー名を選択
        - **Incident Type**: General Incident
        - **Security Level**: SEV-2
          （クリティカルユーザージャーニーが影響を受けている場合、SEV-1 または SEV-2 が適切です）
        - **Notes and Links**:
          ```
          **Paymentservice** monitor burn rate threshold breached, triggering the {{ WorkflowName }} workflow.
          A root cause analysis of the SLO breach is required before closing this incident.
          ```

    設定は次のようになっているはずです:
    ![インシデント作成の詳細](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-create-incident.png)

    このアクションにより、将来の `paymentservice` 信頼性問題では Ops チームが手動でインシデントを報告する必要がなくなります。

7. **Create incident** ボックスの下の **+** ボタンをクリックします。
    :::note
    このステップでは、**Make Request** を使用して `paymentservice` をロールバックするサービスを呼び出します。Workflow Automation では同じことを GitHub Actions でも実現できます。
    :::

    - `HTTP` と入力し始めて、アクション一覧から **Make request**（HTTP）を選択します:
      ![HTTP リクエストの追加](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-add-make-request.png)

    - 右側に **Make HTTP Request** フォームが表示されます。以下を設定します:
        - **Step Name**:
            ```
            Rollback Paymentservice
            ```
        - Connection で **+ New Connection** をクリックします:
          - `HTTP` を選択
          - **Connection Name**:
              ```
              Instruqt Lab Host
              ```
          - **Base URL**:
            - ターミナルで `creds` コマンドを実行します:
              ```sh
              creds
              ```
            - 出力に含まれる `API BASE URL` が **Base URL** です。
          - **Test URL** を `POST` に設定して以下を追加します:
            ```
            /api/v1/service/paymentservice/rollback
            ```

          - **Authentication Type**: `Basic Auth`
          - **Username**:
              ```
              username
              ```
          - **Password**:
              ```
              password
              ```

        設定は次のようになっているはずです:
        ![新しい HTTP 接続](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-new-http-connection.png)

        - **Next, Confirm Access** をクリックします。
        - **Access** を `My org (XXXXXXXX)` に設定します。

        - 最後に **Inputs** セクションの呼び出しを設定します:
        - **URL** を `POST` に設定して以下を追加します:
            ```
            /api/v1/service/paymentservice/rollback
            ```

    ワークフローの設定は次のようになっているはずです:
    ![完成したワークフロー](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-completed.png)

8. ページ右上の **Save** をクリックし、次に **> Run** をクリックします。

    このステップではワークフローのテストに追加データが必要です:
    1. **Manual** を選択して **Run** をクリックします。
    2. 上部に「Success」と最終実行時刻が表示されます。
    3. **Create Incident** アクションボックスをクリックし、**Outputs** タブをクリックします。
    4. *url* をクリックすると、テストで作成されたインシデントが表示されます。
    5. インシデントの内容を確認し、インシデントのステータスを **Active** から **Resolved** に変更します。
    6. ワークフロー実行結果ページに戻り、**Rollback Paymentservice** アクションボックスをクリックします。
    7. **Outputs** タブをクリックします。出力結果に **202** ステータスと以下のテスト結果が表示されるはずです:
        ![HTTP 接続のテスト結果](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-http-connection-test-results.png)

9. ページ右上の **Publish** をクリックします。

10. **Access** を `My org (XXXXXXXX)` に設定し、**Publish** をクリックします。

    ワークフローが正常に動作することを確認したので、次はバーンレートのしきい値を超えたときに自動的にトリガーされるよう、既存の SLO モニターに接続する必要があります。

11. **[Monitors > Monitors List](https://app.datadoghq.com/monitors)** に移動します。

12. **Custom Monitors** の下から、先ほど `paymentservice` に設定した SLO モニター **Swagstore Checkouts Failing!** を選択します。

13. ページ右上の **Edit** ボタンをクリックします。

14. **Configure notifications & automations** セクションで **Add Workflow** をクリックします。

15. 先ほど作成したワークフローを選択します。
    ![モニターへのワークフロー設定](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/monitor-workflow-add.png)

16. **Recipient summary** にワークフローが表示されていることを確認します:
    ![ワークフローの受信者サマリー](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/workflow-recipient.png)

17. **Save** をクリックします。

これで、**Payment reliability SLO Alert!** モニターのしきい値を超えるたびに、自動ワークフローがトリガーされます！

これにより Alberto のチームは最高の環境を手に入れました。SLO モニタリングによる迅速な検出と、自動ワークフローによる素早い修復の両方が実現しました。

## ラボまとめ

Alberto とそのチームはきっと喜んでくれるでしょう！

:::caution
このセクションのすべてのステップを完了してから次に進んでください！
:::

準備ができたら、ラボ右下の `Next` をクリックして次のラボに進んでください。
