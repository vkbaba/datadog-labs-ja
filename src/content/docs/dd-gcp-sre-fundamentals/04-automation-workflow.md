---
title: 第4章 - まとめ - 自動ワークフローの確認
description: 自動ワークフローが別のデプロイ障害をどのように処理したかを確認し、ワークショップを振り返ります。
head: []
---

## Alberto チームからのお礼

Alberto のチームは私たちが実装したツールに大喜びです。トラブルシューティング時間がすでに改善されています。Datadog SLO モニターから SLO 違反のアラートを受け取りましたが、確認する頃には私たちが設定したワークフローがすでに環境を安定させていました。

素晴らしい仕事でした！まとめる前に何が起きたかを簡単に振り返りましょう。

:::note
**Workflow Automation** の実行履歴が更新されるまで最大 2 分かかる場合があります。その場合は少し待ってから、ラボの指示に従いページを再読み込みしてください。
:::

1. **[Automation > Actions : Workflow Automation](https://app.datadoghq.com/workflow)** を開きます。

2. 前のラボで作成した `Paymentservice Automatic Workflow` を選択します。

3. ページ右上の **Executions** をクリックします。

    ワークフローが **Monitor によって自動的に** トリガーされたことが確認できます。期待通りの動作です！

4. 最後の **Success** 実行を選択します。

5. **Rollback Paymentservice** アクションボックスをクリックします。

6. **Outputs** タブをクリックします。出力結果に **200** ステータスと `Rollback successful` というメッセージが表示されているはずです。

    これにより **Workflow Automation** が正常に実行されたことが確認できます！次は **Service Catalog** を確認しましょう。

    :::note
    Workflow Automation はこのワークショップで設定した内容以外にも多くのことができます。たとえば、ロールバック実行前に Slack で特定のチームに承認リクエストを送ったり、インシデント詳細をメール・Slack・Teams で送信したりすることも可能です。Workflow Automation で実現できることについては [Workflow Blueprints](https://app.datadoghq.com/workflow/blueprints) を参照してください。
    :::

7. **[APM > Software Catalog](https://app.datadoghq.com/services?env=ddenv&lens=Reliability)** を開きます。

    以下のように **Reliability** タブに表示されていることを確認します:
    ![Software Catalog の Reliability タブ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/service-catalog-reliability-tab.png)

    :::note
    ワークフロー自動化によってインシデントが作成されたという通知を受け取っている場合があります。
    ![インシデントのポップアップ](/datadog-labs-ja/assets/dd-gcp-sre-fundamentals/popup-incident.png)
    :::

8. 結果のパネルから `paymentservice` をクリックします。
    **Deployments** に新しい不安定バージョン `0.8.1` が表示され、Datadog Workflow Automation が `0.8.0` へのロールバックに成功したことが確認できます。

## 次のステップ

ワークショップを楽しんでいただけましたか？Datadog と今回探索した機能について詳しく学びたい方は、以下のリソースやワークショップを参照してください。

**このワークショップで学んだ Datadog の機能:**
- [Service Level Objectives (SLO)](https://docs.datadoghq.com/service_management/service_level_objectives/)
- [Monitors](https://docs.datadoghq.com/monitors/)
- [Workflow Automation](https://docs.datadoghq.com/service_management/workflows/)
- [DORA Metrics](https://docs.datadoghq.com/dora_metrics/)
- [Quality Gates](https://docs.datadoghq.com/quality_gates)
- [Testing Visibility](https://docs.datadoghq.com/tests)
- [Continuous Testing](https://docs.datadoghq.com/continuous_testing)

また、Datadog でスケールで信頼性の高いサービスを維持する能力を高めるために、[Datadog Site Reliability Engineer ラーニングパス](https://learn.datadoghq.com/bundles/site-reliability-engineer-learning-path)もご覧ください。
