---
title: 第4章 - エージェント AI アプリケーションの最適化
description: Datadog LLM Experiments を使ってモデルを評価・比較し、エージェント AI ワークフローのパフォーマンスを最適化します。
head: []
---

この最終ラボでは、Datadog LLM Experiments を使って異なるモデルを評価し、SwagBot のパフォーマンスを最適化します。テスト用データセットを作成して比較実験を実行し、コスト・レイテンシー・品質の各メトリクスに基づいてデータドリブンなモデル選定を行います。

このセクションの目的:

1. モデル評価用のテストデータセットを作成・管理する
2. 実験タスクと評価基準を設定する
3. 複数のモデルを比較する
4. 多角的に実験結果を分析する
5. モデル最適化を適用し、効果を検証する

## SwagBot v2.0 を「正しく」修正する時

前の章で、SwagBot v2.0 が重大な問題を抱えていることが分かりました。**チームはテストなしで Product Specialist Agent などを大きいモデルにアップグレードした** 結果、以下が発生しました:

- **レイテンシー 50% 増** によるユーザーエクスペリエンスの悪化
- **コスト 10 倍** で予算を圧迫
- **品質への影響は不明**: 出力品質は本当に改善したのか?

チームは、「**大きい = 良い**」という仮定で実際の影響を計測しなかった、よくある失敗をしました。これを正しく修正するのがあなたの仕事です。

**チャレンジ:**

Product Specialist Agent に最適なモデルを見つけ、以下のバランスを取る必要があります:

- **パフォーマンス**: 良い UX のための高速応答
- **コスト**: 持続可能なインフラ費用
- **品質**: 正確で有用な商品情報

**解決策: LLM Experiments**

特定のユースケースに対する複数モデルの評価を支援するため、Datadog は **Experiments** を提供しています。Experiments を使うと、AI のシナリオ別にさまざまなモデルの評価を効率化し、レイテンシー・トークン使用量・品質を比較できます。

📚 **参考:** [LLM Experiments](https://docs.datadoghq.com/llm_observability/experiments/)

## モデルを実験してコストとレイテンシーを最適化する

1. [LLM Observability > Experiment](https://app.datadoghq.com/llm/experiments) を開きます。まだ Experiment を定義していないので、最初のプロジェクトを作成します。

    ![LLM Experiments - Project Creation](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-experiment-project-creation.png)

2. プロジェクト名を以下にします:

    ```text
    swagbot_langgraph_workflow
    ```

    :::note
    プロジェクト名は必ずこの値にしてください。残りのラボで使うコードがこのプロジェクト名に紐付いています。
    :::

3. **Save** をクリックします。

4. 自分専用の Experiments コードを作成するためのコードスニペットが表示されます。

    ![LLM Experiments Code Snippet](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiment-code-snippet.png)

    UI 上のコードスニペットを少し読んでみてください。

Experiment の構成要素は概ね以下の通りです:

| コンポーネント | 説明 |
|--------------|-----|
| **Dataset** | エージェントをテストする際に使用する例の集合。現実的な入力と、各例の理想的な出力を用意します。 |
| **Task** | 評価対象とする AI ワークフローの部分を定義します。エージェント AI ワークフロー全体を対象にすることも、特定エージェントだけ独立して評価することもできます。 |
| **Evaluators** | エージェントがビジネス目標を満たしているかを定量的に評価するスコアリング関数。シンプルな完全一致評価から、より複雑な評価のための LLM-as-a-Judge までを利用できます。 |

このラボでは、UI のサンプルコードをベースに SwagBot 用に拡張したものを使います。コードを書く必要はなく、`swagbot_utils_experiments.py` のコードを実行します。データセットの作成方法や Experiments の実行方法に慣れたい場合は、自由に Python ファイルの内容を確認してください。関連するコード行は適宜示します。

## 実験用データセットを作成する

実験を実行する前に、エージェントをテストするための例の集合を作る必要があります。データセットは SDK・API、または UI からアップロードして作成でき、UI から更新も可能です。

1. UI で Dataset に移動します: [LLM Observability > Experiment > Datasets](https://app.datadoghq.com/llm/datasets)。データセット作成用のコードスニペットを確認します。

    ![LLM Experiments Dataset Code Snippet](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-dataset-snippet.png)

2. Product Specialist Agent 用の最初のデータセットを以下のスクリプトで作成します:

    ```bash
    docker compose exec swagbot python /app/swagbot_utils_experiments.py --create-dataset product_specialist
    ```

   興味があれば、Product Specialist 用データセットの作成メソッドは `swagbot_utils_experiments.py` の 416〜441 行目で確認できます。

3. UI でデータセットが追加されたことを確認します:

    ![LLM Experiments - Dataset created](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-dataset-created.png)

4. データセットをクリックして、現在のレコードを確認します。

### データセットを本番トレースで充実させる

UI から本番トレースを使ってグラウンドトゥルースデータセットを充実させることができます。実験のリファレンススパンとして使いたい関連トレースを特定します。

1. UI で有効なトレースを特定します。前のラボで使った `What's the price of the Dog Steel Bottle` のトレースを再利用します。

2. トレースを開いて `+Add to Dataset` をクリックします。

    ![LLM Experiments - Add to dataset](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-dataset-update.png)

3. 既存のデータセット「swagbot_product_specialist_eval」を選択して `Export` をクリックします。

    ![LLM Experiments - Add to dataset](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-dataset-update2.png)

4. [LLM Experiments の Datasets](https://app.datadoghq.com/llm/datasets) に移動して、データセットがこの新しいトレースで更新されたことを確認します:

    ![LLM Experiments - Dataset Updated](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-dataset-update3.png)

    :::note
    UI から直接レコードを追加・編集することもできます。
    :::

## 実験タスクと評価基準を定義する

データセットができたので、実験のスコープと評価基準を定義します。

これには、どのタスクを定義し、どの評価関数（Evaluators）を使ってさまざまなエージェント向けに導入するモデルの判断材料を得るかを、コードテンプレートを調整して指定する必要があります。

### タスク定義

ここでは、Product Specialist Agent に対してさまざまなモデルを評価し、コストを低く抑えながらレイテンシーと品質の両方を改善できるモデルを見つけることが目的です。これが実験の `Task` になります。

興味があれば、`swagbot_utils_experiments.py` の 668 行目に直接エージェント呼び出しのタスク定義 `direct_agent_task` があります。LangGraph ワークフローの **Product Specialist** Agent と関連 RAG を使うメソッドです。

:::note
実験を起動するコードは LangGraph で動作するエージェント AI ワークフローと同じものを使っています。ただし Specialist Agent をテストするため、ワークフローのうち Specialist Agent を呼ぶ部分だけを実行します。今回は Product Specialist Agent を評価します。
このコードでは、特定のエージェントだけでなくワークフロー全体のテストも可能です。
:::

### Evaluators の定義

評価パイプライン構築の最後の、そしてほぼ最も重要なステップは Evaluators の定義です。Evaluators はエージェントがビジネス目標に近づいているかを定量的にスコアリングする関数です。

Evaluator にはユニットテストのようなもの（必須の実行ステップ、例: text-to-SQL エンジンを構築するなら生成された SQL が有効である必要がある）と、ビジネス目標を網羅するもの（例: 医師アシスタントを構築するなら、ユーザーの意図が予約取得である場合、エージェントは予約機能を提供できたか）があります。

評価したい内容に応じて、シンプルな完全一致 Evaluator から、より複雑な評価のための LLM-as-a-Judge まで幅広く構築できます。

このサンプルでは、応答の質を評価するために協調動作する 2 つのシンプルな評価器をセマンティック分析ベースで定義しています:

- `contains_key_info` Evaluator:
   - Boolean 型
   - 価格 ($XX.XX)、商品名、プロモーションコードなどの主要情報の存在をチェック
   - 情報が利用できないケースを適切に扱う
   - 期待出力に含まれる主要語の 90% が応答に含まれることを要求

- `response_quality` Evaluator:
   - 0.0〜1.0 のスコアを複数の観点で算出:
     - 長さの品質: 応答が十分な内容を持ちつつ、過剰でないこと
     - 主要情報の一致: `contains_key_info` Evaluator を使用
     - 応答の適切性: 構造とフォーマット、ネガティブパターンの欠如をチェック
     - コンテキスト関連性: 質問の種類（価格、商品情報、プロモーション）に応答が一致しているかを確認

興味があれば、Evaluator の定義は `swagbot_utils_experiments.py` の 509 行目および 559 行目で確認できます。

## 実験を実行する

これで実験開始の準備が整いました。データセット、タスク、カスタム Evaluator が用意できています。

現在、SwagBot の Specialist Agent はすべて Claude 3 Sonnet を使用しています。

他のモデルを評価したいので、Claude 3 Sonnet をベースラインとし、Bedrock で利用可能な他のモデルと比較します。比較対象のモデルは以下です:

- Claude Haiku
- Claude 3.5 Sonnet
- Claude 3.7 Sonnet
- Claude Sonnet 4

各モデルについて、Product Specialist 用データセットの異なるユーザーリクエストをテストし、以下を比較します:

- レイテンシー
- トークン使用量とコスト
- 最終応答における主要要素の発見能力（Evaluator #1）
- 応答品質（Evaluator #2）

興味があれば、`swagbot_utils_experiments.py` の 827 行目から始まる `run_single_model_experiment` メソッドのコードを確認できます。実験コード本体は 901 行目あたりです。

1. 以下のコマンドで実験を開始します:

    ```bash
    docker compose exec swagbot python /app/swagbot_utils_experiments.py --compare-all-models --dataset product_specialist --direct-agent
    ```

   すべての実験が成功するまで待ちます:

    ![LLM Experiement Completed](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-completed.png)

## 実験結果を確認する

すべての実験が完了したら、結果を確認して Specialist Agent に最適なモデルを見つけます。

1. UI で Experiment に移動します: [LLM Observability > Experiment](https://app.datadoghq.com/llm/experiment)。

   結果がグラフで表示されているはずです。各モデルについて、実験コードが算出した品質評価、レイテンシー、トークン使用量の情報が線で描画されます。

    ![LLM Experiment - Model comparison](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-results.png)

2. Product Specialist ワークフローに最適なモデルを特定してみてください。

    <details>
    <summary>クリックして解答を見る</summary>

   - 各モデルにマウスを当てるとそのモデルの結果がハイライトされ、他のモデルと比較できます。

   - 現在のモデル **Claude 3 Sonnet** がベースラインになります:

     ![LLM Experiment - Claude 3 Sonnet](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-claude-3-sonnet.png)

   - **Claude Sonnet 4** を確認すると、品質改善はないにもかかわらず、はるかに遅く、コストが高いことが分かります:

     ![LLM Experiment - Claude Sonnet 4](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-claude-sonnet-4.png)

   - そして **Claude 3 Haiku** を確認すると、このエージェント AI ワークフローに最適なモデルが見つかったはずです。最高品質、最低レイテンシー、最低コストを実現しています!

     ![LLM Experiment - Claude Haiku](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab4-llm-experiments-claude-haiku.png)
    </details>

3. ベースラインと次に使いたいモデルを比較して結論を確認できます。

    <details>
    <summary>クリックして解答を見る</summary>

   - **Experiments** グラフの下で、`Direct product_specialist agent testing with Claude 3 Haiku` と `Direct product_specialist agent testing with Claude 3 Sonnet` の 2 つの実験を選択します
   - **Compare Experiments** をクリックします

     ![LLM Experiments - Comparison](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-comparison.png)

   - **Compare** ビューで、データセットの各レコードに対する結果を簡単に比較できます

     ![LLM Experiments - Comparison Details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-comparison-details.png)

   - **Duration** など特定の比較基準を選択して、ベースラインに対して最も効率的なモデルを即座に特定することもできます

     ![LLM Experiments - Comparison Details - Latency](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-comparison-details-2.png)
    </details>

## モデル変更を適用する

1. 実験から、**Claude 3 Haiku** を使うことで、品質を維持しつつ全体のコストとレイテンシーを最適化できることが明確になりました。

2. モデルを変更する前に、もう一度 `What's the price of the Dog Steel Bottle?` を SwagBot に問い合わせ、参照トレースを取得します。

3. `docker-compose.yml` の 14 行目を編集し、Specialist Agent が使うモデル `SPECIALIST_MODEL` を更新します:

    ```python
          - SPECIALIST_MODEL=anthropic.claude-3-haiku-20240307-v1:0
    ```

4. SwagBot を再起動します:

    ```bash
    docker compose up -d --force-recreate swagbot
    ```

   このモデル変更がエージェント AI ワークフロー全体に与える影響を計測する準備が整いました。

5. SwagBot で再度 `What's the price of the Dog Steel Bottle?` と質問します。

6. 新しいトレースを以前のトレースと比較します:

    ![LLM Experiment - Initial Trace - Sonnet](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-trace-comp-1.png)

    ![LLM Experiment - New Trace - Haiku](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab6-llm-experiments-trace-comp-2.png)

7. このテストを実施した時点で、Product Specialist Agent に Claude Haiku モデルを使うことで、レイテンシーが **30%** 削減、ワークフロー全体のコストが **40%** 削減できました。実際のラボでは結果が異なる場合がありますが、大きな改善です!

**お疲れ様でした!**

## ラボまとめ

この最終ラボでは、Datadog LLM Experiments を使ってアプリケーションを最適化する方法を学びました:

1. **実験の作成と管理**
   - テストデータセットを構築し、本番トレースで充実
   - タスクと評価基準を定義
   - 複数のモデルを系統的に比較

2. **データドリブンな改善**
   - ユースケースに最適なモデルを特定
   - 定量的なメトリクスで変更を検証
   - ワークフローへの最適化を適用

## ワークショップ達成

**おめでとうございます!** LLM Observability ワークショップのすべてのラボを完了しました。この旅を通して、エージェント AI アプリケーションに対する包括的な可視性を獲得し、以下を行うためのツールを習得しました:

1. **LLM 運用のモニタリング**
   - LLM 呼び出しとワークフローを計装
   - コスト、レイテンシー、トークン使用量を追跡
   - エージェントの相互作用とパフォーマンスを把握
   - RAG の有効性に対する可視性を獲得

2. **品質とセキュリティの評価**
   - 品質評価の設定
   - ハルシネーションと毒性の検出
   - Prompt Injection の試みのモニタリング
   - 応答の関連性と精度の測定

3. **トラブルシューティングと最適化**
   - 能動的なモニタリングとアラートのセットアップ
   - データ品質問題のデバッグと修正
   - 実験の実行によるモデル比較
   - データドリブンな最適化判断

これで、本番環境のあらゆるエージェント AI アプリケーションを効果的に観測・評価・最適化する知識とツールが揃いました。オブザーバビリティは信頼性の高い AI システムを維持する鍵であることを忘れずに、アプリケーションの進化と新しい課題の出現に応じて、モニタリング・計測・改善を続けてください。

次のセクションでは、ハンズオン部分の総仕上げとして、任意のクイズで「LLM Observability with Datadog Proficiency」Credly バッジの取得に挑戦できます!
