---
title: 第3章 - エージェント AI のモニタリングとトラブルシューティング
description: Agent Observability を使って、エージェント AI アプリケーションのエラーやデータ品質の問題を評価・トラブルシューティングします。
head: []
---
Swagbot の新しいバージョン **v2.0.0** がデプロイされました。
何か問題が起きていて、ユーザーから苦情が寄せられていると通知を受けました。

このラボでは、Agent Observability を使ってこの新しいバージョンで何が起きているのか、どのようなエラーが発生しているのかを把握し、それらを修正します。頑張ってください!


## 問題を調査する: Swagbot が動作しているか確認する

問題が発生していることがわかったので、まずは Swagbot が現在どのように動作しているかを確認するところから始めましょう。

1. Swagbot を開いて、何か質問してみます

2. Swagbot が現在リクエストを処理できないことを確認します
   ![Swagbot UI のエラー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-swagbot-UI-error-1.png)

3. Agent Observability Overview で、モニターも確認しましょう。Error Monitor は数分以内に ``ALERT`` 状態に変わるはずです（直近 1 分間に 1 件を超えるエラーが検出されるとすぐにトリガーされます）。
   ![LLM Obs Error Monitor のアラート](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-error-monitor-alert.png)

このままラボを進めても問題ありません。モニターは後で確認できます。

## エラーを調査して修正する

いよいよ、この高いエラー率を調査してこの問題を修正するときです。
このパートでは、Agent Observability で利用できるツールを使って問題を特定し、修正方法を見つけていきます。

利用可能なさまざまなツールを自由に使って、根本原因を特定し、修正方法を見つけられるか試してみてください。ガイドなしで自力で挑戦してもかまいません。
以下の解答セクションを開いて、手順に従うこともできます。

## エラーの根本原因調査 - 解答

### まず、エラーが何であるかを理解する

1. [Agent Observability Overview](https://app.datadoghq.com/llm/applications) に移動します
2. ``Errors`` セクションまでスクロールします
   ![Agent Observability Overview - Errors](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-llmobs-overview-errors.png)

   ワークフローの中でどのエージェントに問題があるのか、すでにヒントが得られます。

3. [Agent Observability > Traces](https://app.datadoghq.com/llm/traces) に移動します
4. ファセットを使ってエラーで絞り込みます
5. ステータスが error のトレースを開きます
6. トークン制限に関するエラーメッセージと、Synthesizer エージェントおよび Swagbot ワークフロー全体の横に付いている感嘆符に注目します。
![Response Synthesizer エージェントのエラー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-agent-error.png)

   Swagbot を担当するチームが、Response Synthesizer エージェントが使用しているプロンプトを更新したようです。それが大きくなりすぎて、プロバイダーが課す入力トークン制限を超えてしまっています。プロンプトを制限内に収まるよう最適化するとよさそうです。

:::note
これは架空のシナリオですが、LLM プロバイダーは入力トークンと出力トークンの両方に対して課金します。入力トークンは通常、出力トークンよりも安価ですが、それでもプロンプトを最適化し、AI アプリケーションのユースケースに対して効率的で最適なものにしておくことは有益です。今回のシナリオでは、Swagbot チームがシナリオごとにエージェントがどう応答すべきかを示すさまざまな例を含む追加のガイドラインを提供したため、Response Synthesizer が大きくなりすぎています。
:::

## エラーを修正する - 解答

### Synthesizer のプロンプトを確認する

Synthesizer エージェントが使用するシステムプロンプトは、実行時にファイルから読み込まれます。どのファイルが使われているかは、製品を離れることなく Agent Observability のトレースから直接特定できます。

1. [Agent Observability > Traces](https://app.datadoghq.com/llm/traces) で、エラーで絞り込み、新しい順に並べ替えて、先ほど SwagBot で質問したトレースを見つけます。タイムスタンプがあなたの操作と一致しているはずです。

   :::note
   相関付けられたログは、あなた自身が SwagBot と対話して生成したトレースでのみ利用できます。合成リプレイのトレースでは Logs タブが空になります。質問を送信した時刻に一致するタイムスタンプのトレースを必ず開いてください。
   :::

2. そのトレースから、スパン詳細パネルの **Logs** タブをクリックします。
3. **Trace** に切り替えて、リクエスト全体に相関付けられたすべてのログを表示します。
4. synthesizer プロンプトのパスを示すログエントリを見つけます。
   `Loading synthesizer prompt from /app/resources/prompt-synthesizer.txt`
   ![エラーのあるトレース - 相関ログ](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-agent-error-Logs.png)

### プロンプトを調整して最適化する

IDE でプロンプトを見つけ、必要な制限内に収まるように簡素化してみましょう。

1. IDE を開き、Synthesizer エージェントが使用するシステムプロンプトを含むファイルを見つけます
![IDE - Synthesizer システムプロンプトの編集](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-ide-prompt.png)
2. 25 行目あたりの **CONTENT FORMATTING GUIDELINES EXAMPLES:** セクションを見つけます。ここが、Swagbot 開発チームが Response Synthesizer 向けに追加のガイダンスを加えた箇所です。
3. ターミナルで次のコマンドを実行し、synthesizer プロンプトのバージョン 2.1.0 をデプロイします。これは v2.0.0 の品質改善を維持しつつ、トークン制限内に収まるよう最適化されたバージョンです。
```bash
bash /root/lab-solutions/03-monitoring/fix-synthesizer-prompt.sh
```
- プロンプトの修正は次のリクエストで自動的に読み込まれます（再起動は不要です）。

4. エラーが発生しなくなり、最新のリクエストのステータスが OK になっていることを確認します。
5. 数分以内に、Error モニターは ``OK`` 状態に戻るはずです。これを待つ必要はなく、ラボを続けてかまいません。

おめでとうございます! このエラーを解決し、ユーザーは Swagbot を正常に利用できるようになりました。

ただし、まだやるべき作業が残っています。

## Failure to Answer の問題を調査して修正する

``Failure to Answer`` の評価がかなり高い数値を示しています。中には正当なものもあるかもしれませんが、Swagbot が Dog Steel Bottle 製品に関する非常に簡単な質問に答えられない理由を確認してみましょう。

Swagbot に次のように質問します:
```text
How much is the Dog Steel Bottle?
```

問題を調査し、修正して Swagbot がこの簡単な質問に答えられるようにできるか試してみてください。Dog Steel Bottle の価格は USD 29.99 のはずです。

自力で修正しても、以下の解答セクションを開いて手順に従ってもかまいません。

## Failure to Answer の根本原因調査 - 解答

1. まず、``Failure to Answer`` の評価から始めて、この問題についてさらに詳しい情報が得られるか見てみましょう

2. Agent Observability Overview に移動し、``Evaluations`` までスクロールします

3. 左側の **failure-to-answer** ヒートマップにある **Redirection Response** にマウスを合わせ、**Arrow Down** ボタンをクリックして ``View Agent Observability spans`` を選択します
  ![Failure to Answer - No Content Response](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-overview-no-content-response.png)

4. 絞り込まれたトレースのリストで、「How much is the Dog Steel Bottle?」に関連するトレースを見つけます
  ![Failure to Answer のスパン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-no-content-response-traces.png)

5. トレースを開き、**Evaluations** をクリックして、failure to answer の理由を確認します
  ![トレース Failure to Answer の詳細](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-failure-to-answer-details.png)

6. 価格は ``Product Specialist`` エージェントによって取得されるはずです。Product Specialist Agent の下にある ``Retrieval`` スパンを見つけます。

7. Dog Steel Bottle の価格を探してみてください。エージェントが取得した他の製品との違いに気づきますか?

8. 価格は、retrieval 時に読み込まれる Products の情報に含まれていません。
   ![トレース Failure to Answer - Retrieval](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-failure-to-answer-trace-retrieval.png)

おめでとうございます。Failure to Answer の根本原因を特定しました。価格が Products のナレッジベースに存在しないため、Product Specialist エージェントは価格を提供できないのです。

これを修正しましょう!


## Failure to Answer の問題を修正する - 解答

1. 問題を修正するには、製品のデータソースを特定する必要があります。

2. SwagBot に ``How much is the Dog Steel Bottle`` と質問して、新しいトレースを生成します。

3. そのトレースを [Agent Observability > Traces](https://app.datadoghq.com/llm/traces) で見つけます。

   :::note
   前回と同様に、相関付けられたログはあなた自身の対話から生成されたトレースでのみ利用できます。合成リプレイのトレースではなく、あなた自身のトレースを必ず開いてください。
   :::

4. スパン詳細パネルの **Logs** タブをクリックし、**Trace** に切り替えて、Products データソースの読み込みに関連するログエントリを特定します。
   ![LLM Obs Trace - products json の読み込み](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-retrieval-products-json.png)

3. IDE で、**/app/resources/** 配下の ``product.json`` ファイルを見つけます

4. Dog Steel Bottle に価格が関連付けられていないことを確認します:
![LLM Products.json - 価格が欠落](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-dog-steel-bottle-no-price.png)

5. ターミナルで次のコマンドを実行し、``product.json`` を Dog Steel Bottle の価格を含むバージョンに置き換えます。

```bash
cp /root/lab-solutions/03-monitoring/products.json /root/lab/app/resources/products.json
```

6. products.json 内の Dog Steel Bottle の製品詳細は、以下のようになっているはずです:

   ![LLM Product json - 価格の編集](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-dog-steel-bottle-price.png)

7. Swagbot に ``How much is the Dog Steel Bottle?`` と質問して、**Failure to Answer** が検出されなくなったことをテストして確認します
   ![Agent Observability - Failure to Answer が修正された](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-failure-to-answer-fixed.png)

お見事です! もう一つの問題を修正しました!

## Prompt Tracking でプロンプト品質の問題を調査する

価格の修正により、Dog Steel Bottle の **Failure to Answer** は解決しました。しかし、応答の品質にはまだ問題があります。

1. [Agent Observability Overview](https://app.datadoghq.com/llm/applications) で、**Evaluations** セクションまでスクロールし、**ecommerce-quality-evaluation** ウィジェットを確認します。

   スコアが低下する傾向が見て取れます。多くの応答が 75 を下回るスコアになっています。この新しいバージョンで何かが変わり、応答品質を損なっています。
   ![Overview — ecommerce の品質低下](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-overview-ecommerce-quality-drop.png)

2. 左側のナビゲーションメニューで **Prompts** をクリックし、プロンプトの変更が原因かどうかを調査します。

3. **Recent Prompt Updates** の下で、最近のバージョン変更がプロンプトのパフォーマンスに与えた影響を確認できます。

4. **swagbot.product_specialist** をクリックして、**v1.0.0** と **v2.0.0** を並べて比較します。

   評価スコアがすでに明確な事実を物語っています:
   - **e-commerce quality evaluation** が低下しています（スクリーンショットでは 55.5 から 54.24 に下がっています）。実際の数値はラボ環境によって異なる場合があります
   - **Average latency** が大幅に増加しています
   ![Prompt Tracking — バージョンの比較](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-prompt-tracking-compare-versions.png)

5. 並べての比較では、色分けされたインジケーターの助けを借りて、何が変わったかを正確に確認できます。左側では赤色で変更された内容が、右側では緑色で変更された内容が示されます。

6. 3 つの重要な変更が見つかります:
   - レコメンデーションのクエリを直接の回答ではなく確認のための質問で受け流す、新しい **DISCOVERY** セクション
   - RESPONSE セクションに追加された **"Your response must be HTML"**: specialist はプレーンテキストではなく HTML マークアップを生成するようになりました
   - **TOOLS** セクションが完全に削除されました

   これら 3 つの変更が品質低下を説明します:
   - DISCOVERY が直接的な製品レコメンデーションをブロックします
   - HTML の指示が specialist→synthesizer のテキストパイプラインを壊します
   - TOOLS ガイダンスの欠落により、すべてのクエリで不要な `check_product_availability` の呼び出しが発生します

7. バージョン **V2.0.0** の **View Spans** をクリックして、絞り込まれたトレースリストを開きます。

8. 製品レコメンデーションのクエリ `What headphones do you recommend under $250?` のトレースを開きます。必要に応じて ``$250`` でリストを絞り込めます
![Traces - headphones $250 で絞り込み](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-traces-headphone-filter.png)

   スパンツリーで、さまざまな問題が存在することを確認できます:
   - **Product Specialist の LLM 出力** が生の HTML になっています: これは "Your response must be HTML" の直接的な結果です
   - エージェントが製品レコメンデーションではなく確認のための質問を返しています
   ![Trace — V2.0 で見える問題](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-prompt-v2-trace-issues.png)

### Playground で改善したプロンプトをテストする

チームは、特定された問題に対処する v2.1.0 のプロンプトを用意しました。この新しいバージョンを本番にデプロイする前に、**Playground** で検証しましょう。

1. Product Specialist の LLM スパンのトレースを表示したまま、`Evaluate Span` を展開して `Test in Playground` をクリックします
   ![Trace - Test in Playground](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-trace-test-in-playground.png)

2. Playground が v2.0.0 のプロンプト、クエリ、変数が事前に読み込まれた状態で開きますが、プロンプトをテストして評価する前に、適切な AI プロバイダーで Playground を構成する必要があります。このワークショップでは、以前に構成した Bedrock アカウントを使用します。

3. AI プロバイダーを構成するための設定ペインが自動的に開くはずですが、開かない場合は、モデル名 **Claude Sonnet 4.5** の横にある **Model Configuration** アイコンをクリックします。
 ![Model Configuration](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-playground-AI-provider-configuration.png)

4. Provider として **Amazon Bedrock** を選択し、構成済みのアカウントを選び、Product Specialist の現在のモデル **Claude Sonnet 4.5** を選択します
 ![Playground - Prompt Editor の構成](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-playground-bedrock-provider-configuration.png)

5. 完了したら `Done` をクリックします。

5. System Prompt と、変数として利用できる User のコンテキストおよびクエリが確認できます。
 ![クエリが読み込まれた Playground](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-playground-trace-loaded.png)

8. **Run** をクリックしてクエリを実行し、現在のプロンプト（v2.0.0）での出力を確認できます

9. モデルが確認のための質問で応答し（DISCOVERY が動作している）、応答が生の HTML になっていることを観察します: これがまさに顧客が経験している 2 つの問題です。
 ![Playground - プロンプト v2 の実行](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-playground-run-prompt-v2.0.png)

:::note
さまざまなモデルを使ってテストし、それが最終出力にどう影響するかを確認することもできます。
:::

10. 次に、システムプロンプトを **v2.1.0** に置き換えます:

```text
Provide product information, specs, recommendations, and comparisons.

**TASKS:**
- Product details and specifications
- Pricing and availability
- Recommendations and alternatives
- Feature comparisons

**TOOLS:**
- Use `check_product_availability` ONLY when a customer explicitly asks about stock, availability, or whether a specific product is in stock (e.g. "is the Dog Hoodie available?", "do you have the mug in stock?").
- Do NOT call it for general product discovery queries like "what products do you have" or "show me your catalog" — use the product data from context instead.

**RESPONSE:**
- Use product data from context with EXACT information provided
- Include the product name, price, and description
- For price or availability queries, lead with a direct one-sentence answer before the full product details
- Show a maximum of 3 products unless the customer explicitly asks to see all products
- End with a helpful next step or question to guide the customer

**DATA ACCURACY (v2):**
- Always verify product data exists in context before responding
- Never make assumptions about pricing or availability

Present products clearly with accurate information.
```

11. 既存のシステムプロンプトを置き換えるには、既存のものを選択して上から貼り付けるか、削除オプションを使って新しい v2.1.0 のプロンプトを貼り付けます
 ![Playground - プロンプトの削除と置き換え](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-playground-replace-system-prompt.png)

:::note
コピー＆ペーストによってプロンプトの書式が影響を受ける場合がありますが、無視して問題ありません: モデルは引き続き正しく処理します。
:::

12. **Run** をクリックして、再度クエリを実行します

V2.1 は、プレーンテキストで直接的な製品レコメンデーションを返します: DISCOVERY が削除され、HTML がなくなり、応答は synthesizer が期待するとおりのものになりました。
 ![Playground - プロンプト v2.1 の実行](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-playground-run-prompt-v2.1.png)

### 修正をデプロイする

Playground により、バージョン 2.1.0 がバージョン 2.0.0 で見られた問題に対処することが確認できました。これをデプロイしましょう。

1. ターミナルで次を実行します:
```bash
bash /root/lab-solutions/03-monitoring/fix-product-specialist-prompt.sh
```

2. SwagBot で直接テストします:
```text
What headphones do you recommend for under $250?
```

   SwagBot は、確認のための質問も生の HTML もなく、直接的な製品レコメンデーションで応答するはずです。


## レイテンシーの問題を調査する

今日の作業はほぼ完了ですが、もう一つ対処すべきことがあります。新しいバージョンの Swagbot が応答するのに非常に時間がかかるようになった、というユーザーからの苦情があります。
今日を終える前に、これを調査する必要があります!

Agent Observability で利用可能なツールを使って、ユーザー体験の低下の根本原因になり得るものを突き止めましょう。

自力で調査しても、以下の解答セクションを開いて手順に従ってもかまいません。

## レイテンシー増加の根本原因を見つける - 解答

まずはモニターから始めるのがよいでしょう。本当にレイテンシーの問題があるなら、モニターは **ALERT** 状態に移行しているはずで、現実のシナリオであれば、ユーザーの苦情を待つことなく事前に通知を受けていたはずです。

1. Agent Observability Overview で、モニターをクリックし、latency モニターを確認します。
   ![Agent Observability のモニター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-llmobs-monitors.png)

2. Latency Monitor をクリックします:
   ![Agent Observability Latency Monitor](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-latency-monitor-alert.png)

   レイテンシーが、アラートで定義した制限（4 秒）を超えていることが確認できました。

3. [Agent Observability の Traces Explorer](https://app.datadoghq.com/llm/traces) に移動します

4. 成功したトレースのバージョンごとの平均レイテンシー（duration）を Table で表示するクエリを作成します
   - **Visualize as** セクションで ``Table`` をクリックします
   - **Group into fields** セクションで **All Traces** をクリックし、``Duration`` を選択します
   - **by** セクションで ``Version`` でグループ化します

   クエリは以下のようになるはずです:
   ![Agent Observability - バージョンごとの平均レイテンシー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-latency-query-1.png)

   バージョン 2.0.0 が約 50% のレイテンシー増加をもたらしたことが、あらためて確認できました。
   では、この増加の根本原因は何でしょうか?

5. [Agent Observability Overview](https://app.datadoghq.com/llm/applications) の **Latency** セクションで、さらに情報が得られるか見てみましょう
   ![Agent Observability Overview - モデルごとのレイテンシー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-overview-latency-by-model.png)

6. ``Latency by Model`` を確認します
   Overview に複数のモデルが表示されるようになっていることに気づくでしょう。当初は、すべてのエージェントが 1 つのモデルだけを使用していました。

7. Swagbot チームがバージョン 2.0.0 で新しいモデルを使うことにしたようです。この追加されたモデルは以前のモデルより遅いようで、これがレイテンシーの問題を引き起こしています。

8. これを、あらためて ``Traces`` explorer を使って確認しましょう

9. バージョン、モデル名、エージェントごとの平均レイテンシーを ``Tree Map`` として表示する新しいクエリを作成します
   - ``Spans`` をクリックします
   - ファセットを使って ``llm`` スパンのみに絞り込みます
   - **Visualize as** で ``Tree Map`` を選択します
   - 次に ``Duration`` を表示するよう選びます
   - ``Version`` で
   - 右側の ``+`` をクリックし、``Model Name`` を追加します

      ![Agent Observability - バージョンとモデルごとの平均レイテンシー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-latency-query-2.png)

   - ``+`` をクリックし、``Prompt ID`` を追加します

      ![Agent Observability - バージョンとモデルごとの平均レイテンシー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-latency-query-3.png)

チームがすべての specialist エージェントに新しいモデルを使うことにしたのは、これで明らかです。

そして、これはレイテンシーに影響を与えただけでなく、全体のコストにも影響を与えていることに気づくでしょう。

10. クエリで、``Duration`` を変更して代わりに ``Estimated Total Cost`` を表示します:

   ![Agent Observability - Estimated Output Cost の選択](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-query-change-estimated-cost.png)

11. コストの違いが確認できます: これらの新しいモデルを使うことで、Swagbot のコストは 2.5 倍に増えています!
   ![Agent Observability - モデルとエージェントごとのコスト](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-cost-query.png)

12. これは、``ALERT`` 状態（少なくとも ``WARN`` 状態）になっているはずの Cost Monitor でも確認できます:
   ![Agent Observability - ALERT 状態の Cost モニター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab3-cost-monitor-alert.png)

## モデル選択のトレードオフを理解する

バージョン 2.0.0 が specialist エージェント向けに新しくより大きなモデルを導入したことを、たった今発見しました。新しいモデルへのアップグレードは改善に思えるかもしれませんが、この変更は**トレードオフを適切に評価することなく**行われました。

AI アプリケーションに適したモデルを選ぶことは、最新または最大のオプションを選ぶことではありません。次の点を慎重に検討する必要があります:
- **ユースケースの要件**: タスクに大きなモデルの能力が必要か、それともより小さく高速なモデルで十分か?
- **品質メトリクス**: 新しいモデルは、特定のユースケースにおいて実際に出力品質を向上させるか?
- **レイテンシーへの影響**: モデルサイズはユーザー体験と応答時間にどう影響するか?
- **コストへの影響**: 大きなモデルはより多くのトークンを消費し、リクエストあたりのコストが大幅に高くなります

このシナリオでは、Swagbot チームは以下を行わずにすべての specialist エージェントをより大きなモデルにアップグレードしました:
- 品質改善のテスト
- レイテンシーへの影響の測定
- コストへの影響の計算
- 元のモデルとのパフォーマンス比較

本番でモデルを変更する前に、次のことを行うべきです:
- モデルのパフォーマンスを比較する評価を実行する
- ステージングでレイテンシーの違いを測定する
- コストの予測を計算する
- 実際のユーザーシナリオでテストする
- 思い込みではなく、データに基づいて情報に基づいた意思決定を行う

次のラボでは、特定のユースケースに合わせてモデル選択を適切に評価・最適化する方法を学びます!

## 達成したこと

**おめでとうございます!** Agent Observability を使って、実際の本番の問題のトラブルシューティングに成功しました。

このラボでは、次のことを行いました:
   - **本番エラーの診断と修正**
      - モニターとトレースを使ってトークン制限の問題を特定しました
      - プロンプトを最適化してエラーを解決し、サービスを復旧しました
   - **データ品質の問題の解決**
      - 「Failure to Answer」評価を調査して、欠落した製品データを発見しました
      - RAG ナレッジベースを修正して正確な価格を復元しました
   - **Prompt Tracking を使った品質リグレッションの根本原因分析**
      - ecommerce の品質低下の背後にある 3 つのプロンプト変更を特定しました: DISCOVERY セクション、HTML 出力、TOOLS ガイダンスの欠落
      - 完全な実験を実行する前に、Playground で修正を検証しました
   - **レイテンシーとコストの根本原因分析の実施**
      - レイテンシーの低下とコスト増加を引き起こしていたモデル変更を特定しました
      - モデル選択には思い込みではなく評価が必要であることを学びました

**次のステップ:** データに基づく意思決定の重要性を理解したところで、次はエージェント AI アプリケーションを適切に最適化する方法を学びます!
