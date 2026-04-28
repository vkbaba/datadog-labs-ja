---
title: 第3章 - エージェント AI のモニタリングとトラブルシューティング
description: LLM Observability を使ってエージェント AI アプリケーションを評価し、問題をトラブルシューティングします。
head: []
---

このラボでは、Datadog LLM Observability を使って SwagBot の新しいバージョンを分析します。エラーを調査し、データ品質の問題を修正します。

このセクションの目的:

1. LLM Observability モニター Overview を確認し問題を特定する
2. モニターと Traces エクスプローラーを活用して問題を調査する
3. トレースを分析してエージェント AI ワークフローを把握し、根本原因を特定する

SwagBot の新バージョンがデプロイされたばかりです。何か問題が起きており、ユーザーから苦情が来ているという通知を受けました。

このラボでは、LLM Observability で新バージョンに何が起きているのか、エラーの中身を理解し、修正していきます。頑張りましょう!

## 問題を調査する: SwagBot が動作しているか確認する

問題があると認識したので、まず現在の SwagBot の挙動を確認します。

1. SwagBot を開いて任意の質問をします。

2. SwagBot が現在リクエストを処理できないことを確認します。

    ![Swagbot UI Error](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-swagbot-UI-error-1.png)

3. LLM Observability Overview でモニターも確認します。Error Monitor は数分後に `ALERT` 状態に遷移するはずです（過去 5 分でエラー 4 件のしきい値に達するとアラートになります）。

    ![LLM Obs Error Monitor Alert](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-error-monitor-alert.png)

ラボを進めながら、後ほどモニターを再度確認できます。

## エラーを調査して修正する

エラー率の高さに対処していきます。

このパートでは、利用可能な LLM Observability ツールを使って問題を特定し、修正方法を見つけます。自由にツールを使って自分で根本原因を見つけて修正に挑戦してもよいですし、以下の解答セクションを展開して指示に従ってもかまいません。

### エラー根本原因調査 - 解答

#### まずエラーの中身を理解する

1. [LLM Observability Overview](https://app.datadoghq.com/llm/applications) を開きます。
2. `Errors` セクションまでスクロールします。

    ![LLM Observability Overview - Errors](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-llmobs-overview-errors.png)

    ワークフロー内で問題のあるエージェントのヒントを既に得られます。

3. [LLM Observability > Traces](https://app.datadoghq.com/llm/traces) を開きます。
4. ファセットを使ってエラーでフィルタします。
5. status error のトレースを開きます。
6. トークン上限に関するエラーメッセージと、Synthesizer Agent と SwagBot ワークフロー全体の隣に表示される感嘆符に注目します:

    ![Reponse Synthesizer Agent Error](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-agent-error.png)

    どうやら SwagBot 担当チームが Response Synthesizer Agent のプロンプトを更新したようです。プロンプトが大きすぎて、プロバイダーが課す入力トークンの上限を超えています。プロンプトを最適化して上限内に収めることが必要です。

    これはフィクションのシナリオですが、LLM プロバイダーは入力・出力の両方のトークンに対して課金しています。入力トークンは出力トークンより安いことが多いとはいえ、AI アプリケーションのユースケースに合わせてプロンプトを最適化することには意味があります。

    今回のシナリオでは、SwagBot チームがエージェントが場面に応じてどう応答すべきかについての追加ガイドラインや例を追加した結果、Response Synthesizer のプロンプトが大きくなりすぎました。`load_agent_prompt` ツールスパンに、実際にロードされたプロンプトが見えるはずです。これを最適化してみましょう。

### エラーを修正する - 解答

#### Synthesizer プロンプトを確認する

このラボの環境では、Synthesizer Agent が使うシステムプロンプトはランタイムにロードされます。ラボのために、簡単に内容を変更（短縮など）できるようになっています。

1. Synthesizer プロンプトのファイルパスを特定する 1 つの方法は、APM に切り替えてログを確認することです。

    ![Trace with error - switch to APM](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-agent-error-APM.png)

2. APM トレースから `Logs` タブをクリックします。

    ![Trace with error - Logs Tab](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-agent-error-APM-2.png)

3. `Log Explorer` に切り替えます。

4. ここで、Synthesizer のプロンプトのファイル名を示しているログエントリを探します。

5. trace_id の隣に `Synthesizer` を追加してフィルタすると、Synthesizer 関連のログに絞れます:

    ![Trace with error - Logs Explorer](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-agent-error-Logs.png)

6. パスを示すイベントを探します: `/app/resources/prompt-synthesizer.txt`

#### プロンプトを調整・最適化する

IDE でプロンプトを開き、必要なトークン上限内に収まるよう簡略化します。

1. IDE を開いて、Synthesizer Agent のシステムプロンプトを含むファイルを探します。

    ![IDE - Editing the Synthesizer System prompt](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-ide-prompt.png)

2. 25 行目あたりにある **CONTENT FORMATTING GUIDELINES EXAMPLES:** セクションを探します。SwagBot 開発チームが Response Synthesizer 用の追加ガイダンスを追加した部分です。

3. 以下のコマンドを実行して、Synthesizer プロンプトの v2.1.0 をデプロイします。これは v2.0.0 の品質改善を維持しつつ、トークン上限内に収まるよう最適化したバージョンです:

    ```sh
    cp /root/lab-solutions/03-monitoring/prompt-synthesizer-v2.1.txt /root/lab/app/resources/prompt-synthesizer.txt
    cp /root/lab-solutions/03-monitoring/prompt-metadata-v2.1.json /root/lab/app/resources/prompt-metadata.json
    ```

   次のリクエストから自動的に v2.1.0 プロンプトがロードされます。

4. エラーが発生していないこと、最近のリクエストのステータスが OK になっていることを確認します。

5. 数分後、Error Monitor は `OK` 状態に戻ります。

このエラーを解消できました。ユーザーは再び SwagBot を使えます。

ただし、まだやることが残っています。

## Failure to Answer の問題を調査して修正する

`Failure to Answer` の評価結果がかなり高い数値を示しています。中には妥当なものもあるかもしれませんが、なぜ SwagBot が Dog Steel Bottle 商品に関する非常に簡単な質問に答えられないのかを調べてみましょう。

問題を調査して、SwagBot がこのシンプルな質問に答えられるよう修正してください。Dog Steel Bottle の価格は USD 29.99 のはずです。

自分で修正してもよいですし、以下の解答を展開して指示に従ってもかまいません。

### Failure to Answer 根本原因調査 - 解答

1. まず `Failure to Answer` 評価から、この問題の詳細を取得できるか確認します。

2. LLM Observability Overview で `Evaluations` までスクロールします。

3. **failure-to-answer** のヒートマップ左側にある **Redirection Response** にマウスを当て、**矢印ダウン** ボタンをクリックして `View LLM Observability spans` を選択します:

    ![Failure to Answer - Redirection Response](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-overview-redirection-response.png)

4. フィルタされたトレース一覧で、「How much is the Dog Steel Bottle?」に関連するトレースを探します:

    ![Failure to Answer Spans](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-redirection-response-traces.png)

5. トレースを開き、**Evaluations** をクリックして、failure to answer の理由を確認します。

    ![Trace Failure to Answer Details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-failure-to-answer-details.png)

6. 価格は `Product Specialist` Agent が取得するはずです。Product Specialist Agent の下にある `Retrieval` スパンを探します。

7. Dog Steel Bottle の価格を見つけられるか確認します。エージェントが取得した他の商品との違いに気付くでしょうか?

8. 価格はリトリーバルでロードされた商品情報に含まれていません。

    ![Trace Failure to Answer - Retrieval](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-failure-to-answer-trace-retrieval.png)

failure to answer の根本原因を特定できました。価格が商品ナレッジベースに含まれておらず、Product Specialist Agent は価格を提示できないのです。

修正していきましょう!

### Failure to Answer の問題を修正する - 解答

1. 修正のため、商品データのソースを特定する必要があります。

2. APM とログを使って、Products ナレッジベースとして使われているファイルの場所を見つけます。LLM Observability トレースから APM に切り替えます。

3. `Logs` タブをクリックします。

4. ログから、商品のロードに関連するエントリを特定します。

    ![APM Trace - Load products json](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-retrieval-products-json.png)

5. IDE で **/app/resources/** 配下の `product.json` ファイルを探します。

6. Dog Steel Bottle に価格が紐づいていないことを確認します:

    ![LLM Products.json - price missing](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-dog-steel-bottle-no-price.png)

7. ターミナルで以下のコマンドを実行し、Dog Steel Bottle の価格を含む `product.json` に置き換えます:

    ```sh
    cp /root/lab-solutions/03-monitoring/products.json /root/lab/app/resources/products.json
    ```

8. products.json の Dog Steel Bottle の商品詳細は以下のようになるはずです:

    ![LLM Product json - price edtion](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-dog-steel-bottle-price.png)

9. SwagBot に `What's the price of the Dog Steel Bottle?` と聞いて、**Failure to Answer** が検出されないことを確認します。

    ![LLM Observability - Failure to Answer fixed](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-failure-to-answer-fixed.png)

もう 1 つ問題を解決できました!

## レイテンシー問題を調査する

今日の作業はもう少し。新バージョンの SwagBot が応答に時間がかかると訴えるユーザーがいます。仕事を終える前に、これも調査しましょう。

LLM Observability の各種ツールを使って、ユーザーエクスペリエンス劣化の根本原因を見つけてください。

自分で調査するか、以下の解答を展開して指示に従ってください。

### レイテンシー増加の根本原因を見つける - 解答

まずモニターから始めるとよいでしょう。実際にレイテンシー問題があれば、モニターは **ALERT** 状態に移行しているはずで、現実のシナリオであれば、ユーザーの苦情を待たずに能動的に通知されているはずです。

1. LLM Observability Overview でモニターをクリックし、レイテンシーモニターを確認します。

    ![LLM Observability Monitors](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-llmobs-monitors.png)

2. レイテンシーモニターをクリックします:

    ![LLM Observability Latency Monitor](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-latency-monitor-alert.png)

    アラートで定義したしきい値（12 秒）を現在のレイテンシーが超えていることが確認できました。

3. 2 つのバージョン間のレイテンシーを比較して確認します。比較方法は複数あります。APM の Service ページで 2 バージョンのレイテンシーを比較する方法と、LLM Observability Trace Explorer でリクエストをグラフ化してバージョン間の差を確認する方法があります。

4. まず APM の Service ページから始めます。

5. [Software Catalog](https://app.datadoghq.com/software) を開きます。

6. **Swagbot** サービスにマウスを当てて `Service Page` をクリックします。

7. `Deployments` をクリックします。

    ![Swagbot Service Page Deployments](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-service-page-deployments.png)

    ここから version 1.0.0 と 2.0.0 の差を比較できます。エラー率は本ラボ冒頭の v2.0.0 のエラーを反映しており、P95 レイテンシーがこのバージョンで大幅に高くなっていることも確認できます。

8. [LLM Observability の Traces エクスプローラー](https://app.datadoghq.com/llm/traces) に戻ります。

9. 成功したトレースのバージョン別平均レイテンシー（duration）を Table で表示するクエリを作ります。

   - ファセットで成功トレース（status OK）のみに絞り込みます
   - **Visualize as** セクションで `Table` をクリックします
   - **Group into fields** で **All Traces** をクリックして `Duration` を選択します
   - **by** セクションで `Version` でグルーピングします

   クエリは以下のようになります:

    ![LLM Observability - Average latency per version](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-latency-query-1.png)

   version 2.0.0 でレイテンシーが約 50% 増加していることが再確認できました。しかし、この増加の根本原因は何でしょうか?

10. [LLM Observability Overview](https://app.datadoghq.com/llm/applications) の **Latency** セクションでさらに情報を探します:

    ![LLM Observability Overview - Latency by Model](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-overview-latency-by-model.png)

11. `Latency by Model` を確認します。Overview に 2 つ目のモデルが表示されていることに気付くはずです。当初はすべてのエージェントが 1 つのモデルを使っていました。

12. SwagBot チームが v2.0.0 で新しいモデルを採用したようです。新しいモデルは以前より遅く、これがレイテンシー問題の原因です。

13. これを `Traces` エクスプローラーで再確認します。

14. バージョン × モデル × エージェントの平均レイテンシーを **Tree Map** で表示する新しいクエリを作ります。

   - `Spans` をクリックします
   - ファセットで成功トレース（status OK）と `llm` スパンのみに絞り込みます
   - **Visualize as** で `Tree Map` を選択します
   - `Duration` を表示します
   - `Version` でグルーピングします
   - 右側の `+` で `Model Name` を追加します

       ![LLM Observability - Average latency by version and model](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-latency-query-2.png)

   - `+` をクリックして `agent` を追加します

       ![LLM Observability - Average latency by version and model](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-latency-query-3.png)

チームがすべての専門エージェントと Response Synthesizer Agent で新しいモデルを使うことを決めたことが明白になりました。

しかも、これはレイテンシーだけでなく、コスト全体にも影響しています。

15. クエリで `Duration` の代わりに `Estimated Total Cost` を表示します:

    ![LLM Observability - Selecting Estimated Output Cost](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-query-change-estimated-cost.png)

16. コストの差が見えるようになりました。新しいモデルを使うことで、SwagBot のコストは 10 倍にも膨れ上がっています!

    ![LLM Observability - Cost per model and agent](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-cost-query.png)

17. これは Cost Monitor でも確認できるはずです。`ALERT` 状態になっています:

    ![LLM Observability - Cost monitor in ALERT](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-cost-monitor-alert.png)

## モデル選定のトレードオフを理解する

version 2.0.0 では、専門エージェントと Response Synthesizer 用に新しい大きめのモデルが導入されたことが分かりました。新しいモデルへのアップグレードは改善のように見えるかもしれませんが、この変更はトレードオフの **適切な評価なし** に行われました。

AI アプリケーションに適切なモデルを選ぶことは、最新で最大のオプションを選ぶことではありません。以下のような点を慎重に検討する必要があります:

- **ユースケースの要件**: あなたのタスクは大きなモデルの能力を必要としますか? それとも小さく速いモデルで十分ですか?
- **品質メトリクス**: 新しいモデルは、特定のユースケースで実際に出力品質を改善していますか?
- **レイテンシーへの影響**: モデルサイズはユーザーエクスペリエンスや応答時間にどう影響しますか?
- **コストへの影響**: より大きなモデルはより多くのトークンを消費し、リクエストあたりのコストも大きく増加します

今回のシナリオでは、SwagBot チームは以下を行わずにすべての専門エージェントを大きいモデルにアップグレードしました:

- 品質改善のテスト
- レイテンシーへの影響の測定
- コストへの影響の試算
- 元のモデルとのパフォーマンス比較

本番でモデルを変更する前には、以下を行うべきです:

- モデルのパフォーマンスを比較する評価を実行する
- ステージングでレイテンシーの差を計測する
- コストの予測を計算する
- 実際のユーザーシナリオでテストする
- 仮定ではなくデータに基づいて判断する

次の章では、特定のユースケースに対してモデル選定を適切に評価・最適化する方法を学びます!

## ラボまとめ

**おめでとうございます!** LLM Observability を使って実際の本番問題のトラブルシューティングを完了しました。

このラボで達成したこと:

- **本番エラーの診断と修正**
   - モニターとトレースを使ってトークン上限の問題を特定
   - プロンプトを最適化してエラーを解消し、サービスを復旧
- **データ品質問題の解決**
   - 「Failure to Answer」評価を調べて欠損していた商品データを発見
   - RAG ナレッジベースを修正し応答精度を改善
- **根本原因分析の実施**
   - レイテンシー劣化とコスト増加を引き起こしたモデル変更を特定
   - モデル選定は仮定ではなく評価が必要であることを学習

**次は**: データドリブンな意思決定の重要性を理解した今、エージェント AI アプリケーションを適切に最適化する方法を学んでいきます!
