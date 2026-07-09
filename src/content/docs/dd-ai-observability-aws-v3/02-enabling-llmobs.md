---
title: 第2章 - 品質とセキュリティのモニタリング基盤の構築
description: SwagBot が信頼性・安全性・本番稼働品質を満たすよう、アラートと評価を構成します
head: []
---

SwagBot をエンドツーエンドの完全なオブザーバビリティで計装できました。次はプロアクティブなモニタリングと継続的な品質・セキュリティ評価を導入し、本番稼働に対応できる状態に仕上げていきましょう。

## Agent Observability Overview の概要

アプリケーションがトレースを送信するようになったので、まずは Datadog の **Agent Observability Overview** を確認し、現在のアプリケーションの挙動を把握することから始めます。

### Agent Observability Overview を確認する

Agent Observability Overview は、アプリケーションのパフォーマンス、品質、セキュリティをあらゆる観点から包括的に可視化します。

1. **Agent Observability Overview に移動します:**
   - 左ペインの AI observability アイコン（AI スパークルが付いた円）にカーソルを合わせ、``Overview`` をクリックして **[Agent Observability > Overview](https://app.datadoghq.com/llm/applications)** に移動します。
   - `swagbot` をクリックして、その `Overview` ページを開きます。
   - 右上で時間範囲を ``Past 1 hour`` に設定し、ラボでの操作データを表示します。

2. **主要なパフォーマンスメトリクスを分析する**

   Overview ページ上部の **Summary** に表示されるタイル（Error Rate、LLM Calls など）から、主要なパフォーマンスメトリクスを把握できます:
   ![Agent Observability の Summary タイル](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-LLMObs-Overview-Summary.png)

   各タイルから、関連するスパンやトレースにすばやくアクセスできます。
      - **Trace Error Rate**: トレースのエラー率の概要を表示します。これは注視すべき重要なメトリクスであり、エラーが多発した場合にアラートを受け取れるよう、ラボの後半でモニターを作成します。
      - **Trace Duration (p95)**: アプリケーションのレイテンシと、最も遅いトレースを把握できます。
      - **Estimated Cost**: アプリケーションが実行した LLM コールのコスト見積もりを表示します。Overview では、複数のモデルを使用している場合はモデルごとの内訳が確認できます。
      - **Token Usage**: アプリケーションの実際のトークン使用量（入力+出力）です。
      - **LLM Calls**: アプリケーションが実行した LLM コールの総数です。
      - **Models**: アプリケーションが使用しているすべてのモデルの一覧です。今回のアプリケーションでは、AWS Bedrock 経由で Claude Haiku 4.5 を主要モデルとして使用しています。

      **Overview Summary** には、**Total Traces** の時系列グラフも表示されます:
      ![Agent Observability Overview Summary - Trace](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-LLMObs-Overview-traces.png)

3. **Cost** セクションまでスクロールします。
    このセクションでは、トークン使用量とコストの観点からアプリケーションのコストを追跡できます。
    ![Agent Observability Overview Cost](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-LLMObs-Overview-cost.png)
    消費量の特定の変化や傾向をすばやく把握できるほか、最もコストの高い LLM コールと対応するモデルの一覧も確認できます。

4. **Latency** セクションまでスクロールします。
    このセクションは、レイテンシの確認、遅い LLM スパンの特定、モデル間の比較に役立ちます。
      ![Agent Observability Overview Latency](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-LLMObs-Overview-latency.png)

    このセクションにより、アプリケーションのレイテンシをモニタリングし、アプリケーション内で最も遅いスパンを特定できます。

5. 最後に、**Security and Safety** セクションまでスクロールします。
  Agent Observability は Datadog の **Sensitive Data Scanner** (SDS) と自動的に統合されます。SDS は、会話内の機密情報（個人データ、財務情報、機密情報など）を特定してマスキングすることで、LLM アプリが処理する機密データが Datadog ユーザーに漏洩するのを防ぎます。
  📚 **参考:** [Datadog Sensitive Data Scanner](https://docs.datadoghq.com/sensitive_data_scanner/)

    Sensitive Data Scanner はデフォルトで有効になっています。
    ![Agent Observability Overview Security](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-LLMObs-Overview-security.png)

    **Standard Email Address** は、検出・マスキング・削除が可能な複数の機密データタイプのうちの一つです。すべてのデータタイプの一覧は [Sensitive Data Scanner configuration for Agent Observability](https://app.datadoghq.com/sensitive-data-scanner/configuration/llm-spans) で確認できます。

次のステップに進み、Datadog Agent Observability で利用可能な評価をいくつか有効化して、アプリケーションの挙動をより深く把握し、その品質とセキュリティ体制を評価する準備が整いました。

## 品質・セキュリティ評価を有効化する

Datadog には、複数の品質・セキュリティ評価テンプレートが用意されています。
評価は [Agent Observability > Evaluations](https://app.datadoghq.com/llm/evaluations) タブで構成します。

一部の評価は外部の大規模言語モデルなしで有効化できますが、多くの評価は LLM を使用して実行され、さまざまなベンダーやプラットフォームを利用できます。このラボでは、評価の実行に ``Claude Haiku 4.5`` を用いた **Amazon Bedrock** を使用します。評価を作成する前に、まずこれを構成します。

### 評価用の Amazon Bedrock アカウントを構成する

:::note
ラボのセットアップ時に、評価の実行に必要な権限を持つ Amazon Bedrock アカウントが事前構成されており、Datadog のプリンシパルにはすでにアクセス権が付与されています。あとは Datadog の Agent Observability でインテグレーションを追加するだけです。
:::

1. Datadog で **[Agent Observability > Settings](https://app.datadoghq.com/llm/settings/integrations)** に移動します。Settings は、Agent Observability の画面左下にある Settings をクリックすると開けます。

2. **Amazon Bedrock** の下の ``+ Connect`` をクリックします。
![Agent Observability Settings - Bedrock Account](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-settings-integrations.png)

3. **+Connect** をクリックし、続いて **Configure** をクリックしてアカウントの詳細を確認します。

4. **Select the AWS Integration** でドロップダウンリストを開き、利用可能なアカウントを選択します。

5. **Invoke models from Amazon Bedrock** を有効にします。

6. **Get Started with Amazon Bedrock** をクリックします。
![Agent Observability Settigns - Bedrock Configuration](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-bedrock-configuration.png)

### 評価を構成する

それでは、swagbot アプリケーションの品質とセキュリティを評価するための評価を有効化しましょう。
Datadog が提供する LLM-as-a-judge 評価テンプレートを組み合わせて使用しつつ、独自の LLM Judge も作成します。
- **品質評価**: SwagBot が回答しない状況を検出する **Failure to Answer** と、Product Specialist が顧客のリクエストを完了したかどうかを測定する **Goal Completeness**
- **セキュリティ**: 悪意のある入力を検出する **Prompt Injection**
- **信頼性**: 取得したコンテキストで裏付けられない LLM 生成の主張を捉える **Hallucination Detection**
- 最後に、ビジネス固有の基準に照らして応答全体の品質を採点するカスタム **ecommerce quality** LLM-as-a-Judge

1. [Agent Observability の **Evaluations** タブ](https://app.datadoghq.com/llm/evaluations)に移動します。
  ![Agent Observability Evaluations](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llmobs-evaluations.png)

2. **+ Create Evaluation** をクリックします。

3. 評価の作成には複数の方法があります。自然言語で記述する、既存のテンプレートから始める、ゼロから作成する、のいずれかです。このラボの残りの部分では、既存のテンプレートを使用するとともに、ゼロから作成する方法も試します。

3. **Or start from** の下で **Show all templates** をクリックしてテンプレートの一覧を展開し、``Failure to Answer`` テンプレートを選択します。
![評価の作成](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-evaluations.png)

4. **Evaluation Type** はデフォルトの ``Span`` のままにします。

5. デフォルトの名前 ``failure-to-answer`` のままにします。

6. **Account** で、先ほど構成した Amazon アカウントがすでに選択されていることを確認します（されていなければ選択します）。

8. **Region** に ``us-east-1``、**Model** に ``Claude Haiku 4.5`` を選択します:
        ![モデルの選択](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-evaluation-model.png)

6. **Scope** で ``swagbot`` アプリケーションを選択し、サンプルレートはデフォルトのままにします。

   :::note
   `swagbot` がデフォルトの Application Scope として表示されている場合でも、明示的にクリックして選択を有効化してください。そうしないとスパンフィルターが適用されず、右側のフィルタリング済みスパンのリストが自動的に更新されません。
   :::

7. **Filter** で ``@meta.span.kind:workflow @name:swagbot_workflow`` を使用し、ワークフロー全体のルートスパンのみを評価対象とします。

  ```text
  @meta.span.kind:workflow @name:swagbot_workflow 
  ```
  ![スパンフィルター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-evaluation-span-filters.png)

8. ``System Prompt`` の下の **Prompt** テンプレートを確認します。このプロンプトは、特定のビジネスニーズや要件に応じて調整できます。

9. この評価テンプレートのデフォルトの **Structured Output** は ``Categorical`` です。

10. **Acceptance Criteria** を以下の構成に合わせて更新します:
   - **Pass Criteria**: ``Answered``
   - **Fail Criteria**: ``Empty Response``、``No Content Response``、``Refusal Response``、``Empty Code Response``、``Redirection Response``

   基準を **Pass** から **Fail** に移動するには、Pass Criteria 内のチップの小さな `X` をクリックします。これにより、SwagBot からの空の応答や内容のない応答がレビュー対象としてフラグ付けされます。

11. **Save and Publish** をクリックします。

12. 次に、``Prompt Injection`` の試みを検出するための新しい評価を作成しましょう。**+ Create Evaluation** をクリックし、**Prompt Injection** を選択します。

13. Account は先ほどの選択がすでに構成されているはずです（されていなければ、同じ Bedrock アカウントと ``Claude Haiku 4.5`` モデルを選択します）。

14. ``swagbot`` アプリケーションを選択し、サンプリングレートはデフォルトのままにします。

15. **Filter** で ``@meta.span.kind:workflow @name:swagbot_workflow`` を使用し、ワークフロー全体のルートスパンのみを評価対象とします。

  ```text
  @meta.span.kind:workflow @name:swagbot_workflow 
  ```
16. デフォルトのプロンプト、対応する structured output、評価基準を必要に応じて確認します。

17. **Save and Publish** をクリックします。

18. 評価は以下のように表示されるはずです:
  ![構成済みのマネージド評価](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-configure-managed-evals.png)

:::note
ご覧のとおり、評価の有効化は簡単です。時間に余裕があれば、利用可能な評価をさらに有効化し、Agent Observability でトレースされるリクエストへの影響を確認してみてください。
:::

### 特定のエージェントに対して Goal Completeness 評価を有効化する

ここまでに構成した2つの評価はワークフロー全体に適用されますが、問題によっては特定のエージェントに起因するものもあります。この **Goal Completeness** 評価では、単一のスパンを対象とし、「このエージェントは顧客が求めたことを実際に完了したのか、それとも回避したり、リダイレクトしたり、代わりに確認のための質問をしたりしたのか」という焦点を絞った問いを立てます。

1. **+ Create Evaluation** をクリックします。

2. **From Templates** の下で ``Goal Completeness`` を探してクリックします。

3. Account は先ほどの選択がすでに構成されているはずです（されていなければ、同じ Bedrock アカウントと ``Claude Haiku 4.5`` モデルを選択します）。

4. **Scope** で ``swagbot`` アプリケーションを選択します。

5. **Filter** に以下のフィルターを追加し、Product Specialist の LLM スパンからの回答のみをチェックします。
```text
@meta.span.kind:llm @meta.input.prompt.id:swagbot.product_specialist
```

  ![Goal Completeness スパンフィルター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-goal-completeness-filter.png)

7. 次に、元のリクエストが複数のエージェントに関わる場合でも、Product Specialist が期待に応えていれば goal completeness が成功と判定されるよう、System Prompt を調整します。

8. system prompt を編集し、**Edge cases to consider:** の行の前に以下のテキストを **追加** します。
```text
IMPORTANT: The assistant being evaluated is a Product Specialist whose sole responsibility is product information (specs, pricing, availability, recommendations). Any intentions related to promotions, discounts, shipping, returns, or other topics are outside this agent's scope, and mark them as resolved by default. Only evaluate whether product-related intentions were fully addressed. 
```
  ![Goal Completeness プロンプト](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-goal-completeness-prompt.png)

9. 最後に、このテストは Product Specialist の LLM スパンのみで実行したいので、評価タイプ(Evaluate on)に`Span` を選択します。
  ![スパン単位の Goal Completeness 評価](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-goal-completeness-span.png)

10. **Save and Publish** をクリックします。

### Synthesizer エージェントに対して Hallucination 検出を有効化する

SwagBot は自身のナレッジベースから製品情報を取得し、それを使って応答を生成します。取得したコンテキストで裏付けられない主張（実在しない価格や存在しない機能など）を LLM が生成した場合、それがハルシネーションです。eコマースのチャットボットにおいて、捏造された製品詳細は顧客の信頼を直接損ない、誤った購入判断につながります。この種の挙動を検出するために、Synthesizer エージェントに対して Hallucination 検出を有効化します。

1. **+ Create Evaluation** をクリックします。

2. **From Template** の下で ``Hallucination`` を探してクリックします。

3. 評価に ``hallucination-detection`` という名前を付けます。

4. Account は先ほどの選択がすでに構成されているはずです（されていなければ、同じ Bedrock アカウントを選択します）。

6. **Model** に ``Claude Haiku 4.5`` を選択します。

:::note
Hallucination Detection を使用するには、LLM スパンにコンテキストとユーザークエリがアノテーションされている必要があります。このワークショップでは、swagbot アプリケーションが LLM スパンにこれらを適切にアノテーションするよう既に計装されているため、追加の手順は不要です。詳細はドキュメントの [Configure a hallucination evaluation](https://docs.datadoghq.com/llm_observability/evaluations/custom_llm_as_a_judge_evaluations/template_evaluations#configure-a-hallucination-evaluation) を参照してください。
:::

5. **Scope** で ``swagbot`` アプリケーションを選択します。

7. **Filter** に以下のフィルターを追加し、Synthesizer の LLM スパンのみで Hallucination Detection を実行します。
```text
@meta.span.kind:llm @meta.input.prompt.id:swagbot.synthesizer
```

  ![Hallucination Detection スパンフィルター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-hallucination-detection-filter.png)

8. **System Prompt** セクションを編集して、評価プロンプトをカスタマイズします。

9. **Save and Publish** をクリックします。

### 独自の LLM-as-a-Judge 評価を作成する

前述のとおり、主観的または客観的な基準を評価する独自の評価を設計し、LLM トレース全体にわたって大規模に実行することもできます。これにより、アプリケーションの有効性やビジネス目標との整合性を測定する方法に大きな柔軟性が得られます。

swagbot は eコマースプラットフォームで使用されるチャットボットなので、製品情報の正確さ、プロフェッショナルなトーン、推薦の有用性を評価することで、その応答の品質を測定したいと考えています。

1. **Evaluations** の画面で、`+ Create Evaluation` をクリックし、続いて `Span` をクリックします:
  ![LLM As a Judge の構成](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-as-a-judge-1.png)

2. 構成画面で、評価に名前を付けます。以下のテキストを使用できます:
```text
ecommerce-quality-evaluation
```
3. Bedrock アカウントと、**Model** に ``Claude Haiku 4.5`` を選択します。

4. **Scope** で、評価対象のアプリケーションとして **swagbot** を選択します。

5. **Filters** に以下のフィルターを追加し、Product Specialist の LLM スパンのみを評価対象とします。
```text
@meta.span.kind:llm @meta.input.prompt.id:swagbot.product_specialist
```

7. 以下の system prompt を使用します。この system prompt は LLM の回答に対するスコアリングを生成します:

```text
You are an e-commerce QA expert evaluating chatbot responses. Score each interaction from 0-100 based on these criteria:

1. Product Information Accuracy (25 points)
- Accurate prices, features, availability (15)
- No contradictions with context (5)
- Clear facts vs recommendations (5)

2. E-commerce Best Practices (20 points)
- Clear pricing, shipping, return info (14)
- Clear availability status (6)

3. Professional Tone (20 points)
- Helpful and engaging (10)
- Clear, appropriate language (10)

4. Recommendation Quality (20 points)
- Relevant suggestions (10)
- Non-pushy, well-explained (10)

5. Action Guidance (15 points)
- Clear next steps and guidance (15)

Guidelines:
- Award full points for non-applicable criteria
- Round final score to nearest whole number
- Evaluate based on Span Input (user query), Span Output (response), and Context (ground truth)
- Briefly explain any significant point deductions

Hard Penalty Rules (apply these deductions on top of the criteria scoring):
- If the user asks for a product recommendation, comparison, price, availability, or details (e.g., "What X do you recommend", "Compare X and Y", "Tell me about X", "How much is X"), and the response provides no concrete product information (no product name paired with a price, feature, or availability), instead asking a clarifying question or redirecting: subtract 30 points. This rule does not apply to greetings, off-topic queries, or genuinely ambiguous requests.
- If the response says "Price not available", "unavailable", or omits a concrete dollar amount for any product the user explicitly asked about: subtract 25 points.
- If the response omits availability or stock status for a product the user asked about: subtract 10 points.
- If the response uses HTML elements outside the allowed set (<p>, <strong>, <ul>, <li>, <br>, <img>), for example raw <table>, <thead>, <tr>, <th>, <div>, or <span>: subtract 15 points.
- If the response does not offer a clear next step or call-to-action (such as "let me know if you'd like more details", a purchase link, or contact info): subtract 10 points.
- Apply each hard penalty only once per response, even if the failure occurs multiple times.

Example:

Query: "Tell me about the Dog Steel Bottle"
Response: "The Dog Steel Bottle is $29.99 (blue, red, black). Keeps drinks cold 12hrs/hot 6hrs. 10% off now. Need shipping info?"
Score: 95/100 (Minor deduction: could be more specific about purchase process)
```

:::note
コピー＆ペースト時にプロンプトのフォーマットが崩れることがありますが、無視して問題ありません。モデルは引き続き正しく処理します。
:::

8. **User Prompt** はデフォルトのままにします。

9. 評価の **Structured output** で `Score` を選択します。これは、以下の Pass Criteria が数値範囲を受け付けられるようにするために必要です（**Categorical** や **Boolean** では Pass/Fail しか得られません）。**score_eval** スキーマを以下の内容に置き換えます:

```json
{
    "type": "object",
    "required": [
        "score_eval",
        "reasoning"
    ],
    "properties": {
        "score_eval": {
            "type": "number",
            "description": "Overall e-commerce response quality from 0 (poor) to 100 (excellent), based on five criteria: Product Information Accuracy (25 pts), E-commerce Best Practices (20 pts), Professional Tone (20 pts), Recommendation Quality (20 pts), and Action Guidance (15 pts). Award full points for non-applicable criteria; round the final score to the nearest whole number.",
            "minimum": 0,
            "maximum": 100
        },
        "reasoning": {
            "type": "string",
            "description": "Brief justification of the score: for each criterion that affected the score, state whether the response met expectations and cite specific evidence from the Span Input (user query), Span Output (response), or Context (ground truth). Explain any significant point deductions so the score is auditable."
        }
    },
    "additionalProperties": false
}
```

10. **Acceptance criteria** で、``Pass Criteria`` を **75** から **100** の範囲に設定します。
![カスタム LLM As a Judge - 評価基準](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-as-a-judge-create-2.png)

:::note
Pass Criteria の構成時に数値範囲ではなく `true/false` トグルしか表示されない場合は、上にスクロールして **Structured Output** が **Score** に設定されていることを確認してください。
:::

11. 保存する前に、右側のフィルタリング済みトレースのいずれかを選択して、評価プロンプトをテストできます。

12. 関連性がありそうな **Trace** をクリックします。

13. ``Test Evaluation`` をクリックします。

14. 変数に入力（ユーザークエリ）と出力（Response Synthesizer が提供した最終回答）の両方の値が含まれていることを確認します。

15. ``Run`` をクリックして評価を開始します。

16. 新しい LLM-as-a-Judge 評価によって評価スコアが正しく生成されたことを確認します。
  ![LLM-as-a-Judge 評価のテスト](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-as-a-judge-create.png)

17. **Save and Publish** をクリックします。

18. すべての評価が一覧に表示されるはずです:

![swagbot に対して有効化された LLM-as-a-judge 評価](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-as-a-judge-enabled.png)

自動評価を有効化できたので、次はエージェント型アプリケーションで問題が発生した際にプロアクティブに通知を受け取れるようにしましょう。そのためにモニターを使用します。

## Agent Observability モニターを作成・管理する

このラボの開始時に、エラーとレイテンシの問題を追跡するための2つのモニターが自動的に作成されています。このセクションでは、コストを追跡する新しい Agent Observability モニターを作成します。

### 既存のモニターを確認する

1. [Agent Observability > Overview](https://app.datadoghq.com/llm/applications) の上部で、Monitors のステータス概要を示すセクションをクリックします。現時点では ``2 OK`` と表示されているはずです。
![Agent Observability モニター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-monitors-ok.png)

2. モニターとそのステータスを確認します:
![Agent Observability モニター](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-llm-monitors-list.png)

    各モニターを開いて構成を確認してみてください。ラボの次のパートで、これらのステータスが更新される様子を確認できます。

### Cost モニターを作成する

1. ``+ Create an Agent Observability Monitor`` をクリックします。
   - 新しい **Agent Observability** モニタータイプのページが自動的に開きます。
   - Errors、Latency、Security & Safety、Evaluations、Cost、Custom など、利用可能なさまざまな種類の Agent Observability モニターが表示されることを確認します。
   - ``Cost`` モニタータイプを選択します。
      ![Agent Observability Error モニターの作成](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-monitor-cost-1.png)
   - **Define the monitor scope** では、**swagbot** に送信されたすべてのスパンをそのままにします。
   - 直近 **5 minutes** の **Estimated Total Cost** の合計を **Prompt ID** (``@meta.input.prompt.id``) ごとに表示します:
    ![Agent Observability Cost モニターのクエリ](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-monitor-cost-2.png)

2. アラート条件を以下のように設定します:
   - `100000000`（10セント）を超えたら Alert、`50000000`（5セント）を超えたら Warn とします。Datadog は指数表記をサポートしており、`1e8` と `5e7` と入力することもできます。
   - データが5分間欠落した場合は、`Show OK` を選択します。
    ![Agent Observability Cost モニターのアラートしきい値](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-monitor-cost-3.png)
   - モニターに **名前** を付けます。例:

```text
[SwagBot] High Cost Usage by Agent
```
   - そして **メッセージ** を追加します。例（モニターのメッセージフィールドにこのとおり使用します）:

```text
{{#is_alert}}
High cost detected for agent **{{[@meta.input.prompt.id].name}}** (${{value}} per 5 minutes).

This agent is exceeding the cost threshold of ${{threshold}} per 5 minutes.

Possible Optimizations:
- Review the agent's prompt length to reduce token consumption
- Check for redundant context in responses
- Consider switching to a more cost-efficient model
{{#is_match "@meta.input.prompt.id" "swagbot.synthesizer"}}
- Optimize HTML formatting in responses to reduce output tokens
{{/is_match}}

View agent details in LLM Cost Dashboard: {{link "Cost Analysis" "https://app.datadoghq.com/llm/cost"}}
{{/is_alert}}

{{#is_recovery}}
Cost for agent **{{[@meta.input.prompt.id].name}}** has returned to normal (${{value}} per 5 minutes).
{{/is_recovery}}
```

   - その他の値はデフォルトのままにして、``Create and Publish`` をクリックします。
   - モニターは作成直後は ``NO DATA`` と表示されますが、エージェント型ワークフローでエージェントごとのコストがしきい値を超えない限り、やがて ``OK`` 状態に変わります。
   - ![Agent Observability Cost モニターのアラートしきい値](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-monitor-cost-4.png)
   - おめでとうございます。SwagBot 向けの最初のモニターを作成できました。
   - この種のモニターは、コストを管理し、予想外に高い支出をしているエージェントを特定し、予算の制約内に収まっているかを確認するのに非常に役立ちます。

モニターを設定できたので、エージェント型アプリケーションで問題が発生した際にアラートを受け取れるようになりました。

## Overview で評価を確認する

1. モニターと評価を設定できたので、[Agent Observability Overview](https://app.datadoghq.com/llm/applications) に戻ります。

2. **Evaluations** までスクロールします。

3. 最新のトレースに基づいた評価がすでに表示されているはずです。例えば Prompt Injection について確認できます:
    ![Prompt Injection の検出](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-security-promptinjection-detection.png)

:::note
タイムラインを見やすくするため、時間範囲を ``Past 1 hour`` または ``Past 15 Minutes`` に設定してみてください。
:::

4. Heatmap またはタイムラインで検出された攻撃の一つ（例えば **Code Injection**）をクリックし、対応する Agent Observability スパンを表示します。
    ![Prompt Injection のスパン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-prompt-injection-details.png)

5. 対応するスパンが表示されるはずです。
    ![Prompt Injection のトレース](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-prompt-injection-trace.png)

6. トレースの一つを開いて、評価とその判断根拠に関するより詳しい情報を確認します:
  ![Prompt Injection 検出の例](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-security-promptinjection-details.png)

7. **Overview** に戻り、**Hallucination detection** をはじめとする他の **Evaluations** も必要に応じて確認します:
    ![Hallucination の検出](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-hallucination-overview.png)

8. 時間に余裕があれば、Hallucination detection が検出されたトレースを開いて、なぜハルシネーションと判定されたのかを確認してみてください。以下の例では、Response Synthesizer エージェントの LLM スパンレベルで ``unsupported claim``（裏付けのない主張）についての理由が提供されています:
    ![Hallucination 検出の詳細](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-hallucination-details.png)

9. 最後に、独自の LLM-as-a-Judge の eコマース評価と **failure to answer** 評価も確認でき、SwagBot の現在のパフォーマンスをモニタリングできます。
    ![Failure to answer の概要](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-failure-to-answer-evaluation.png)

10. failure to answer の件数から、最適化の余地があることに気づくはずです。

## 最適化のために本番トレースを収集する

これで、LLM ジャッジによって評価される本番トレースが入ってくるようになりました。次に進む前に、特定の要件（低品質な評価結果など）を満たすトレースをキャプチャし、人間がレビュー・アノテーションできるようにしておくのがベストプラクティスです。

これはオフライン評価のベストプラクティスに従うものです。実際の本番データをテストケースとして使用することで、将来のプロンプトやモデルの変更を、実際に本番で発生するシナリオに照らして評価できます。

  📚 **参考:** [Datadog Blog: Offline evaluation for AI agents: Best Practices](https://www.datadoghq.com/blog/offline-llm-evaluations/)

### Experiments プロジェクトを作成する

Datadog Agent Observability の Experiments は **プロジェクト** 単位で整理されます。ワークショップの後半で使用するプロジェクトを、ここで作成します。

1. [Agent Observability > Experiments](https://app.datadoghq.com/llm/experiments) に移動します。

2. まだプロジェクトが作成されていないため、トップメニューの Experiments の隣にある **All Projects** をクリックし、``+ Create New Project`` を選択して新しいプロジェクトを作成します。
    ![Agent Observability Experiments - 新規プロジェクト](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-experiments-project-creation.png)

3. 以下の名前を使用します:
```text
swagbot_optimization
```

:::note
この正確なプロジェクト名を使用してください。ワークショップの後半で使用する実験コードは、この特定のプロジェクトに紐づいています。
:::

3. **Save** をクリックします。最初の実験を実行する方法の詳細を示すページが表示されます。実験の実行方法には、コーディングエージェント経由や SDK 経由など複数の方法があることに注目してください。構成要素は **Dataset**、**Task**、**Evaluators** です。

### 低品質なトレースをレビューに振り分ける自動化を設定する

トレースを手動でキュレーションしたり既存のデータセットをインポートしたりする代わりに、パフォーマンスの低い応答を人間のレビュー用の **Annotation Queue** に振り分ける自動化を構成します。データセットへの直接エクスポートとは異なり、Annotation Queue では各トレースを検査し、**expected output**（SwagBot が本来すべきだった理想的な回答）を追加できます。この正解データ（ground truth）は、意味のある実験を行うために不可欠です。

自動化は Settings から、または Evaluations から直接作成できます。ここでは Settings から自動化を作成しましょう。

1. [Agent Observability > Settings / Automations](https://app.datadoghq.com/llm/settings/automations) に移動します。

2. **+ Create Automation** をクリックして新しい自動化を作成します。

3. 自動化に以下の名前を付けます:
```text
ecommerce-quality-evaluation Evaluated Spans
```

4. **Filter** フィールドを調整し、エラーがなく、かつ ecommerce quality スコアが合格しきい値を下回る swagbot トレースを対象にします:
```text
@ml_app:swagbot -@status:error @evaluation.ecommerce-quality-evaluation.value:<75
```

5. **Sampling Rate** を `100` % に設定します。

6. **Select a Destination** の下で **Add to Annotation Queue** をクリックし、続いて **Create New** をクリックします。

7. アノテーションキューの名前はデフォルトのままにします:
```text
[automated] ecommerce-quality-evaluation Evaluated Spans
```

8. 先ほど作成した **swagbot_optimization** プロジェクトを選択します。

9. 自動化は以下のようになるはずです。右側には、条件に一致するトレースがすでに表示されているはずです:
![自動化 - Annotation Queue の作成](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-automation-annotation-queue-creation.png)

:::note
アノテーションキューには最大 1000 件のレコードしか保持できません。このワークショップでは、サンプリングレートを下げるよう促す警告が表示されても無視してかまいません。ワークショップの後半でレビューできるだけのトレースを確保するため、できる限り多くのトレースをキャプチャしたいからです。実際の本番シナリオでは、特定のアノテーション要件に合わせてフィルターとサンプリングレートを調整することになります。
:::

10. **Save** をクリックします。

### アノテーションレビューを準備する

Annotation Queue は、人間のレビュアーがキャプチャされた各トレースを検査し、expected output（SwagBot が本来回答すべきだった内容）を追加する場所です。この正解データがなければ、新しいプロンプトが実際に品質を向上させたかどうかを測定できません。

1. [Agent Observability > Annotations](https://app.datadoghq.com/llm/annotations/queues) に移動します。

2. アノテーションキュー **[automated] ecommerce-quality-evaluation Evaluated Spans** をクリックします。

3. この段階ではまだトレースは存在しないはずですが、後の操作に備えてアノテーションキューを準備しておきます。

:::note
トレースはリアルタイムには追加されません。自動化は評価の完了後に非同期でトレースを処理します。レコードはワークショップ全体を通じて徐々に蓄積されていきます。
:::

4. **Add Labels** をクリックします。

5. **Text** を選択します。これにより、アノテーターは SwagBot からの理想的な応答を記述できます。なお、アノテーションには Boolean（Pass/Fail、Yes/No）、Categorical、Score など、他にもいくつかのラベルがサポートされています。

6. ラベルの Name には以下を使用します:
```text
expected_output
```

7. **Save Changes** をクリックします。

アノテーションキューが構成され、以下のようになるはずです:
![Annotation Queue](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab2-annotation-queue-updated.png)

ワークショップを通じてトレースが蓄積されていくにつれ、このキューに戻り、実験を実行する前にトレースをレビューしてアノテーションを付けます。

## ここまでに達成したこと

**おめでとうございます!** エージェント型 AI アプリケーションの本番運用向けコントロールを正常に構成できました。

このラボでは、以下を行いました:

 - **プロアクティブなモニタリングの設定**: エラー率、レイテンシ、コストのモニターを作成し、ユーザーからの苦情が来る前に問題を検出できるようにしました
 - **品質評価の構成**: failure to answer と prompt injection のマネージド評価を構成しました
 - **カスタム評価の確立**: ドメイン固有の品質基準を評価する LLM-as-a-Judge チェックを構築しました
 - **自動トレース収集の構成**: 低品質なトレースを人間のレビュー用にキャプチャするアノテーションキューを設定しました

**SwagBot はこれで本番稼働に対応できる状態になりました!** 信頼性、安全性、高品質な応答を確保するための包括的なモニタリングと継続的な品質評価が整いました。

**次のステップ:** これらのツールを実際に活用しましょう。次のセクションでは、構築したモニタリングと評価のセットアップを使って、実際の本番の問題をトラブルシューティングし、エラーを修正し、データ品質の問題を解決し、パフォーマンス低下を調査します。

次に進む準備ができたら、ターミナルで `finish` を実行し、**Check** をクリックします。
```bash
finish
```
