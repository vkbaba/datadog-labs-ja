---
title: 第4章 - エージェント AI アプリケーションの最適化
description: 本番トレースから構築したベンチマークデータセットを使い、Datadog LLM Experiments でエージェントに最適なモデルを見つけます
head: []
---

## SwagBot の Product Specialist に最適なモデルを見つける

前のセクションでは、重大なエラーを修正しました。synthesizer プロンプトを最適化し、価格データを修正し、Product Specialist のプロンプトを v2.1.0 にアップグレードしました。SwagBot は再び安定しています。

しかし、Specialist エージェントのモデル変更以降、コストとレイテンシーは依然として高いままです。残された最適化がもう 1 つあります。それは **適切なモデルを選ぶこと** です。以前、V2.0 へのアップグレードによってコストが 2.5 倍、レイテンシーが約 50% 増加したことを特定しました。サービスは安定していますが、Product Specialist にとっての *最適な* Claude モデルはまだ判断できていません。

推測に頼るのではなく、**オフライン評価** を使います。各モデル候補にデータセットを流し込み、本番で使っているのと同じ評価器で結果を測定し、データが最良の選択を裏付けてからデプロイします。

📚 **リファレンス:** [Experiments](https://docs.datadoghq.com/llm_observability/experiments/) · [Offline evaluation best practices](https://www.datadoghq.com/blog/offline-llm-evaluations/)

## データセットを構築する

Lab 2 では、低品質なトレースを `[automated] ecommerce-quality-evaluation Evaluated Spans` の Annotation Queue にルーティングする自動化を設定しました。この時点で、このキューには ecommerce quality evaluation で 75 未満のスコアだったトレースが含まれているはずです。これらをレビューし、期待される出力を追加してデータセットにエクスポートします。

### トレースをレビューしてアノテーションする

1. [Agent Observability > Annotation Queues](https://app.datadoghq.com/llm/annotations/queues) に移動し、**[automated] ecommerce-quality-evaluation Evaluated Spans** を開きます。

2. 75 未満のスコアだったトレースが表示されるはずです。

3. 前のセクションで調査した V2.0 の失敗を捉えた、以下の 3 つのクエリを見つけます。

   | クエリ | スコアが低かった理由 |
   |-------|-------------------|
   | **What headphones do you recommend for under $250?** | DISCOVERY セクションが発動: SwagBot は Dog Headphones を推薦する代わりに確認のための質問を返した |
   | **Tell me about the Dog Steel Bottle** | 応答が生の HTML で「Price not available」と表示された |
   | **What is the difference between your Dog Steel Bottle and Dog Plastic Bottle?** | 応答が生の HTML の比較表だった |

4. 次に、この 3 つのトレースにアノテーションを付け、**Expected Output** フィールドに理想的な回答（SwagBot が *本来返すべきだった* 内容）を入力します。

5. 最初のトレースを開きます。

6. そこからトレース全体にアクセスできます。*Response Synthesizer* の LLM Span をクリックし、次に *Evaluations* タブをクリックすることで、実際の応答と評価器の判断根拠を確認し、なぜスコアが低かったのかを検証できます。
 ![アノテーション対象のトレース](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-trace-low-ecommerce-score-annotation.png)

7. 左側の **Expected Output** フィールドに、理想的な応答（SwagBot が *本来返すべきだった* 内容）を入力します。以下をガイドとして使ってください。

   **"What headphones do you recommend for under $250?"**
   ```text
   The Dog Headphones at $229.99 are a great fit for your $250 budget. They feature soft, plush cushions that seal you in for an immersive listening experience. Note: only 3 units left in stock, order soon.
   ```

   **"Tell me about the Dog Steel Bottle"**
   ```text
   The Dog Steel Bottle (NoLimit) is a robust stainless steel vacuum flask with a sports lid, priced at $29.99. Currently in stock with 42 units available.
   ```

   **"What is the difference between your Dog Steel Bottle and Dog Plastic Bottle?"**
   ```text
   Dog Steel Bottle: $29.99. Robust stainless steel vacuum flask with sports lid. In stock (42 units). Best for temperature retention. Dog Plastic Bottle: $15.99. Lightweight and durable for daily hydration. In stock (55 units). Best for a light, budget-friendly option.
   ```
8. **expected_output** フィールドを更新してトレースにアノテーションを付けると、変更は自動的に保存されます。画面上部の Annotation Queue 名をクリックすると、トレースの一覧に戻ることができます。
 ![アノテーション済みのスパン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-trace-annotation-queue-return.png)

9. 残りの 2 つのトレースについても同じ操作を繰り返します。

10. 3 つのトレースへのアノテーションが完了したら、**My annotations** を有効にすることで簡単に識別できるようになります。
 ![アノテーション済みのスパン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-annotated-traces.png)

### アノテーション済みトレースをデータセットにエクスポートする

1. Annotation Queue で、3 つのインタラクションを選択します。

2. **Add to Dataset** をクリックします。

3. **Set Expected Output** で `From annotation label` をクリックし、**expected_output** ラベルを選択します。

4. **Select dataset** で **Create Dataset** をクリックし、次の名前を付けます。
```text
product_specialist_benchmark
```
5. **Project** は `swagbot_optimization` のままにして、**Export** をクリックします。
 ![データセットの作成](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-export-to-dataset.png)

これでデータセットは [Improve 配下の Datasets タブ](https://app.datadoghq.com/llm/datasets) から利用できるようになりました。
 ![作成されたデータセット](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-dataset-created.png)

### 本番トレースから直接データセットを拡充する

このデータセットは、ecommerce quality evaluation で不合格になったトレースをレビューしてアノテーションを付けたものに基づいています。実際の本番インタラクションを使い、トレースから直接データセットを拡充することもできます。より多くの例を追加することで、実験はより完全な全体像を得られます。すでにうまく動作しているクエリに対して、モデル変更が品質を維持できているかを確認できるのです。

1. [Agent Observability > Traces](https://app.datadoghq.com/llm/traces) で、Lab 3 の **"How much is the Dog Steel Bottle?"** のトレース（価格修正の適用後に取得された成功トレース）を見つけます。

2. トレースを開き、**+ Add to Dataset** をクリックします。
 ![トレースをデータセットに追加](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-dataset-add-trace.png)

3. 既存のデータセット **product_specialist_benchmark** を選択し、**Export** をクリックします。

### データセットを確認する

1. [Agent Observability > Datasets](https://app.datadoghq.com/llm/datasets) に移動し、**product_specialist_benchmark** を開きます。

2. **4 件のレコード**（アノテーション済みの低品質トレース 3 件と、合格した例 1 件）が含まれていることを確認します。
![Product Specialist のデータセット](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-dataset-records.png)


## 実験の構成要素

実験を実行する前に、その構成を確認しましょう。[Agent Observability > Experiments](https://app.datadoghq.com/llm/experiments) に移動し、**swagbot_optimization** プロジェクトを開きます。

| コンポーネント | 説明 | この実験での内容 |
|-----------|-------------|---------------------|
| **Dataset** | 期待される出力を伴う実際の本番入力。エージェントが照らし合わされる標準的な応答 | `product_specialist_benchmark`: SwagBot が 75 未満のスコアだったトレース |
| **Task** | 評価対象となるワークフローの一部。各データセットレコードをエージェントに通す | Product Specialist エージェント単体。本番と同じ RAG パイプラインを使用 |
| **Evaluators** | エージェントが品質目標を満たしているかを測定するスコアリング関数 | Ecommerce quality の LLM judge（リモート評価器）、goal completeness（リモート評価器）、期待される出力との類似度（ローカル評価器） |

:::note
Product Specialist を（完全なワークフローではなく）単体でテストすることで、他のエージェントによるノイズなしに、品質の差をモデルの選択に直接ひも付けることができます。
:::

データセットが準備できたので、モデル比較を実行できます。

## モデル選択を最適化する

評価対象となる 3 つのモデルは次のとおりです。

| モデル | 特徴 |
|-------|----------------|
| **Claude Haiku 4.5** | 最も高速で最も安価。大量かつ低複雑度のタスクに最適化 |
| **Claude Sonnet 4.5** | バランスの取れた性能。現在 v2.0.0 の specialist が使用しているモデル |
| **Claude Sonnet 4.6** | 最新世代の Sonnet。同程度の価格帯で推論能力が向上 |

### モデル比較実験を実行する

1. モデル比較を起動します。
```bash
docker compose exec swagbot python /app/swagbot_utils_experiments.py --compare-models anthropic.claude-haiku-4-5-20251001-v1:0 anthropic.claude-sonnet-4-5-20250929-v1:0 anthropic.claude-sonnet-4-6 --dataset product_specialist_benchmark --direct-agent
```
2. 3 つの実験がすべて完了するのを待ちます。各実行が正常に完了したことを確認する出力が表示されるはずです。
![完了した LLM Experiments](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-completed.png)


:::note
この実験は本番と同じ LangGraph ワークフローと RAG パイプラインを使用します。変更される唯一の変数は、Product Specialist エージェントが使用するモデルだけです。
:::

### モデル比較の結果をレビューする

1. [Agent Observability > Experiments](https://app.datadoghq.com/llm/experiments) に移動します。デフォルトで **swagbot_optimization** プロジェクトが選択されているはずです。

2. 先ほど実行した 4 つの実験を含む Timeline が表示されるはずです。
![LLM Experiments のタイムライン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-timeline.png)

3. **Tradeoff** をクリックして、視覚的な比較ビューに切り替えます。
   ![LLM Experiments の Tradeoff ビュー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-results.png)
   各ラインは 1 つのモデルを表し、品質・レイテンシー・コストの各軸で評価されています。

:::note
これがオフライン評価の中核的な価値です。各モデルを本番にデプロイして実ユーザーへの影響を測定するのではなく、3 つの候補すべてを同じベンチマークデータセットに対して数分でテストできました。リスクもコスト超過もなく、チームと共有できる再現性のある結果が得られます。
:::

4. 各モデルについて、トレードオフを確認します。
   - **Ecommerce quality score**: より安価なモデルでも品質は維持されるか？
   - **Duration**: モデル間でどれだけ速さが違うか？
   - **Total cost**: データセット全体でのコスト差はどれくらいか？

5. 最適なモデルを特定します。
   <details>
   <summary>クリックして期待される結果を表示</summary>

   Tradeoff ビューを見れば、決定は一目で明らかです。**Claude Haiku 4.5** がすべての次元で勝っています。

   各モデルを掘り下げると、それが裏付けられます。
   - **Claude Haiku 4.5**: ecommerce quality score が最も高く、goal-completeness も最良、最速かつ最も安価。すべての指標で勝者です！
   - **Claude Sonnet 4.5**: 現在の v2.0.0 のモデル。Haiku 4.5 より品質が低く、しかも遅く高価です
   - **Claude Sonnet 4.6**: 品質スコアが最も低く、コストとレイテンシーが最も高い。このタスクではすべての次元で最悪です

   **重要な洞察:** Product Specialist エージェントには Sonnet モデルの推論能力は必要ありません。構造化された製品データを取得し、顧客向けに整形するタスクであり、Haiku 4.5 の方がより良く、より速く、より低コストでこなせます。v2.0.0 へのアップグレードは、品質面のメリットが一切ないまま、コストとレイテンシーを増加させただけでした。これはまさに、オフライン評価によって根拠のある判断ができるようになる典型例です。**Claude Haiku 4.5** が最適な選択です。

   </details>

## 実験を並べて比較する

Tradeoff ビューは全体像を示してくれます。特定の実験をさらに深掘りしたい場合は、画面下部にあるリストを使用できます。
   ![LLM Experiments - リスト](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-list.png)
このリストから 2 つの実験を選び、並べて比較することもできます。

1. 比較したい 2 つの実験を選択します。たとえば `Product Specialist agent — Claude Haiku 4.5` と `Product Specialist agent — Claude Sonnet 4.5` を選び、**Compare 2 Experiments** をクリックします。
   ![LLM Experiments - 比較](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-comparison.png)

2. **Compare** ビューでは、各行が 1 つのデータセットレコードに対応します。各レコードについて、両モデルの出力がすべての評価器スコアとともに並べて表示されます。
   ![LLM Experiments - 比較の詳細](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-comparison-details.png)

3. **metric selector** を使って特定の次元に絞り込みます。たとえば **Duration** を選択すると、各クエリでどちらのモデルが速いかを即座に確認できます。
   ![LLM Experiments - 比較の詳細 - Duration](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab4-llm-experiments-comparison-details-duration.png)

:::note
Compare ビューは、現在のモデルがすでにうまく機能しているレコードにおいて、より安価なモデルが品質を落としていないことを検証したい場合に特に役立ちます。
:::

### モデル変更を適用する

実験によって、`us.anthropic.claude-haiku-4-5-20251001-v1:0` が Product Specialist にとって最良の品質／コスト比を提供することが確認できました。次に、`docker-compose.yml` の `SPECIALIST_MODEL` 環境変数を更新し、SwagBot を再起動します。

1. ターミナルで、次を実行して変更を適用します。
```bash
bash /root/lab-solutions/04-optimizing/apply-model-change.sh
```

2. SwagBot に製品に関する質問を投げて検証します。
```text
What headphones do you recommend for under $250?
```

3. Agent Observability で新しいトレースを開き、次を確認します。
   - **Prompt Template** タブで Product Specialist が **v2.1.0** になっていること ✓
   - **Model** が **us.anthropic.claude-haiku-4-5-20251001-v1:0** になっていること ✓
   - **Ecommerce quality score** が 75 を超えていること ✓

**お疲れさまでした！**

## 達成したこと

この最終ラボでは、オフライン評価の完全なサイクルを一通り完了しました。

1. **ベンチマークデータセットの構築**
   - annotation queue の低品質な本番トレースをレビューしアノテーションを付けた
   - リグレッションチェックとして合格例を追加した
   - 期待される出力を伴う、代表的なテストセットを作成した

2. **モデル選択の最適化**
   - Claude Haiku 4.5、Sonnet 4.5、Sonnet 4.6 を同じデータセットと評価器で比較した
   - Tradeoff ビューを使い、Haiku 4.5 が最良の品質／コスト比を提供することを特定した
   - Compare ビューでレコード単位の結果を掘り下げ、その結論を裏付けた
   - モデル変更を適用し、本番でエンドツーエンドに検証した

## ワークショップの成果

**おめでとうございます！** Agent Observability ワークショップのすべてのセクションを完了しました。この過程を通じて、あなたは本番のエージェント AI アプリケーションを、最初のトレースからデータに基づくモデルの意思決定まで、エンドツーエンドで運用しました。ここで体験した内容は次のとおりです。

1. **計装と観測**
   - 最小限のセットアップとコード変更ゼロで Agent Observability を有効化した
   - LangGraph ワークフロー全体で、すべてのエージェントの判断、LLM 呼び出し、トークン使用量、リトリーバルをトレースした
   - AI の振る舞いをスタック全体（APM トレース、ログ、RUM セッションリプレイ）と相関させた

2. **評価とモニタリング**
   - Agent Observability の overview を確認: コスト、レイテンシー、エラー率、トークン使用量を一目で把握した
   - hallucination、failure to answer、prompt injection、goal completeness に対するマネージド評価を設定した
   - ドメイン固有の品質基準向けにカスタムの LLM-as-a-Judge 評価器を構築した
   - コスト、レイテンシー、エラー率に対して、自動アラート付きのプロアクティブなモニターを設定した
   - 低品質な本番トレースの収集を自動化して annotation queue に集め、評価データセットへ継続的に供給した

3. **トラブルシューティングと修正**
   - モニター、トレース、ログを使って本番エラーを診断した
   - AI の応答に影響していたナレッジベースのデータ品質問題を解決した
   - Prompt Tracking を使ってプロンプトバージョン間のリグレッションを特定し、Playground で修正を検証した
   - レイテンシーとコストの劣化をモデル変更までたどった

4. **実験と最適化**
   - アノテーション済みの本番トレースからベンチマークデータセットを構築した
   - 本番と同じ評価器を使い、オフラインのモデル比較実験を実行した
   - Tradeoff ビューを使ってデータに基づくモデル選択の意思決定を行った
   - 2 つの実験間のレコード単位の並列比較でその結論を確認した
   - 最適なモデルをデプロイし、本番でエンドツーエンドに品質を確認した

これで、本番環境のあらゆるエージェント AI アプリケーションを効果的に観測、評価、最適化するための知識とツールが身につきました。アプリケーションの進化に合わせて、モニタリング、測定、改善を続けてください。

Agent Observability ワークショップは完了です。ターミナルで `finish` を実行し、**Check** をクリックしてラボを閉じてください。
```bash
finish
```
