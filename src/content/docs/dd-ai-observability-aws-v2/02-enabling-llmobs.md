---
title: 第2章 - 品質とセキュリティのモニタリング基盤の構築
description: アラートと評価を設定し、SwagBot が本番運用に耐える信頼性・安全性・品質を備えていることを保証します。
head: []
---

エンドツーエンドのオブザーバビリティで SwagBot を計装することに成功しました。次は、能動的なモニタリングと継続的な品質・セキュリティ評価を設定し、本番運用へ進めるようにします。

このラボの目的:

1. 品質とセキュリティのマネージド評価を有効化する
2. ドメイン固有の品質チェック向けにカスタム LLM-as-a-Judge 評価を設定する
3. LLM Observability モニターを確認し、コストモニターを作成する
4. 評価結果を確認して SwagBot のパフォーマンスを評価する

## LLM Observability モニターの概要

アプリケーションがトレースを送信できるようになったので、変更を加える前に、Datadog の **LLM Observability モニター** の Overview を確認して現在の挙動を把握します。

### LLM Observability Overview を確認する

LLM Observability の Overview は、アプリケーションのパフォーマンス、品質、セキュリティをあらゆる側面から包括的に把握できるビューです。

1. **LLM Observability Overview に移動します:**
   - **[LLM Observability > Overview](https://app.datadoghq.com/llm/applications)** に移動
   - アプリケーションとして `swagbot` が選択されていることを確認
   - 時間範囲を `Past 1 hour` に設定し、ラボでの活動結果を確認

2. **主要パフォーマンスメトリクスを分析する**

   Overview ページ上部の **Summary** セクションのタイルから、主要パフォーマンスメトリクスを把握できます:

   ![LLM Observability Summary Tiles](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-LLMObs-Overview-Summary.png)

   各タイルから関連するスパンとトレースに素早くアクセスできます:

   - **Trace Error Rate**: トレースのエラー率の概要。重要なメトリクスなので注視すべきです。後ほど、エラーが多すぎる場合にアラートを発するモニターを作成します
   - **Trace Duration (p95)**: アプリケーションのレイテンシーと、最も遅いトレースの一覧を把握できます
   - **Estimated Cost**: アプリケーションが実行する LLM 呼び出しの推定コスト。複数モデルを使用している場合はモデル別の内訳を確認できます
   - **Token Usage**: アプリケーションの実際のトークン使用量（入力 + 出力）
   - **LLM Calls**: アプリケーションが実行した LLM 呼び出しの総数
   - **Models**: アプリケーションが使用しているすべてのモデルの一覧。現在は Anthropic の Claude Haiku 1 つだけが使われています

   **Overview Summary** には **Total Traces** の時系列も表示されます:

   ![LLM Observability Overview Summary - Trace](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-LLMObs-Overview-traces.png)

3. **Cost** セクションまでスクロールします。

    ここでは、アプリケーションのトークン使用量とコストを追跡できます:

    ![LLM Observability Overview Cost](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-LLMObs-Overview-cost.png)

    使用量の特定の変化やトレンドを素早く把握でき、最もコストの高い LLM 呼び出しのリストとそれに紐づくモデルも確認できます。

4. **Latency** セクションまでスクロールします。

    レイテンシーの確認、遅い LLM スパンの特定、モデル間の比較に有用です:

    ![LLM Observability Overview Latency](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-LLMObs-Overview-latency.png)

    アプリケーションのレイテンシーを監視し、最も遅いスパンを特定するのに役立ちます。

5. 最後に **Security and Safety** セクションまでスクロールします。

    LLM Observability は Datadog の **Sensitive Data Scanner** (SDS) と自動連携しており、会話に含まれる機微情報（個人情報、財務情報、機密情報など）を識別・マスクしてデータ漏洩を防ぎます。

    📚 **参考:** [Datadog Sensitive Data Scanner](https://docs.datadoghq.com/sensitive_data_scanner/)

    Sensitive Data Scanner はデフォルトで有効です:

    ![LLM Observability Overview Security](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-LLMObs-Overview-security.png)

    **現在のトレースで最も多く検出されている機微データの種類は?**
    <details>
    <summary>クリックして回答を見る</summary>

    **Standard Email Address** — メールアドレスは検出・マスク・除去できる多種類の機微データのひとつです。すべてのデータタイプは [LLM Observability の Sensitive Data Scanner 設定](https://app.datadoghq.com/sensitive-data-scanner/configuration/llm-spans) で確認できます。
    </details>

6. Overview から、SwagBot の改善余地を特定できますか?
    <details>
    <summary>クリックして回答を見る</summary>

    SwagBot にはいくつかの改善余地があります:

    - レイテンシーを下げてユーザーエクスペリエンスを改善する
    - プロンプトを調整し、各エージェントに最適なモデルを選定してコストを最適化する
    - SwagBot がエンドユーザーに正確で高品質な回答を返すようにする
    </details>

次のステップでは、Datadog LLM Observability で利用できる評価機能を有効化し、アプリケーションの挙動について深い洞察を得て、品質とセキュリティの状態を評価していきます。

## 品質およびセキュリティ評価の有効化

Datadog には、複数のマネージド品質・セキュリティ評価が用意されています。評価は [AI Observability - Evaluations](https://app.datadoghq.com/llm/evaluations) タブで設定します。

### 利用可能な評価を確認する

1. LLM Observability の **Evaluations** タブをクリックします。

    ![LLM Observability Evaluations](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llmobs-evaluations.png)

2. **+ Create Evaluation** をクリックします。

3. 一部の評価は外部 LLM なしで有効化できますが、ほとんどは LLM を使って実行されます。さまざまなベンダーやプラットフォーム（AWS Bedrock 上のモデルを含む）が評価に利用できます。

4. このラボを簡略化するため、OpenAI 連携を構成し、評価には GPT-4 系モデルを使用します。

### OpenAI インテグレーションの設定

1. **Connect Account** をクリックします。

2. **OpenAI** の下で **+ Connect** をクリックします。

    ![OpenAI integration](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-openai-config.png)

    **Configure** タブから **+ Add Account** をクリックします。

    :::caution
    インストラクター主導のワークショップでは、OpenAI API キーが提供されます。後日自分で実施する場合は、自身の OpenAI API キーが必要です。
    :::

3. **インテグレーションを設定します:**

   - **Account Name**: swagbot
   - **API Key**: ラボ環境で提供される OpenAI API キー（`creds` で取得）または自身の API キーを使用
   - **Tags**: 空欄のまま（任意）
   - **Use this API key to evaluate your LLM applications** を必ず有効にしてください

   ![OpenAI Account Configuration](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-openai-config-1.png)

4. **Save** をクリックします。

### 評価を設定する

評価機能を有効化して、SwagBot の品質とセキュリティを評価します。LLM-as-a-Judge 評価と Datadog マネージド評価を組み合わせて使用します。

- 品質評価には **Failure to Answer**（SwagBot が回答できていないケースの検出）
- セキュリティには **Prompt Injection**（悪意ある入力の検出）

このあと、Datadog マネージドの **Hallucination 検知** 評価も有効化します。

1. [LLM Observability の **Evaluations** タブ](https://app.datadoghq.com/llm/evaluations) に戻ります。

2. **+ Create Evaluation** をクリックします。

3. **CREATE LLM JUDGE** で、**Failure to Answer** テンプレートをクリックします。

    ![Create evaluation](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-evaluations.png)

4. デフォルト名 `failure-to-answer` のままにします。

5. **Account** で先ほど構成した `OpenAI` / `Swagbot` アカウントを選択し、`GPT-4o Mini` を選択します:

    ![Select Model](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-evaluation-model.png)

6. **Evaluation Scope** で `swagbot` アプリケーションを選択し、サンプルレートはデフォルトのままにします。

7. **Span Filters** を展開します。**Evaluate on** で **Traces** を選択して（ルートスパンのみが対象になります）、**Span Names** に `swagbot_workflow` を追加します。

    ![Span Filters](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-evaluation-span-filters.png)

8. **Evaluation Prompt** テンプレートを確認します。このプロンプトは、特定のビジネス要件に応じて調整可能です。

9. この評価テンプレートのデフォルトの **Structured Output** は `Categorical` です。

10. `Pass` と `Fail` の基準を確認します。

11. **Save and Publish** をクリックします。

12. 最初の評価を有効化できました!

13. 次は **Prompt Injection** を検出する評価を作成します。

14. **+ Create Evaluation** をクリックして **Prompt Injection** を選択します。

15. 同じモデルと API キーを選択し、その他はデフォルト設定のままにします。

16. `swagbot` アプリケーションを選択し、デフォルトのサンプリングレートを使用します。

17. **Span Filters** を展開します。**Evaluate on** で **Traces** を選択し、**Span Names** に `swagbot_workflow` を追加します。

18. デフォルトのプロンプト、対応する Structured Output、評価基準を自由に確認します。

19. **Save and Publish** をクリックします。

20. 評価設定が以下のような状態になっているはずです:

    ![Configured Managed Evaluations](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-configure-managed-evals.png)

    :::note
    評価の有効化はとてもシンプルです。時間があれば、利用可能な他の評価も有効化して、LLM Observability でトレースされるリクエストへの影響を確認してみてください。
    :::

### マネージド評価で Hallucination 検知を有効化する

次に、Hallucination 検知のマネージド評価を有効化します。マネージド評価は Datadog によって管理されており、LLM-as-a-Judge 評価のようにカスタマイズすることはできません。本ラボ作成時点では、Hallucination 検知でサポートされているプロバイダーは OpenAI のみです。

1. **+ Create Evaluation** をクリックします。

2. **Managed Evaluations** で `Hallucination` をクリックします。

3. LLM プロバイダー API キーのアカウントとして `swagbot` を選択します。

4. **Instrument your application** に書かれている指示を確認します。Hallucination 検知では、LLM スパンにコンテキストとユーザークエリのアノテーションが必要です。本ワークショップではアノテーション済みなので、追加作業は不要です。

5. デフォルト設定（**Unsupported Claim** が有効）のままにします。

6. **Evaluation scope** で `swagbot` アプリケーションを選択します。

7. **Span Filters** を展開し、LLM スパン名として `bedrock-runtime.command` を選択します（Hallucination 検知は LLM スパンに対してのみ実行できます）。

8. **Save and Publish** をクリックします。

9. 評価設定が以下のような状態になります:

    ![Configured Managed Evaluations](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-hallucination-evaluation.png)

### 独自の LLM-as-a-Judge 評価を作成する

主観的または客観的な基準を評価するための独自の評価を設計し、LLM トレース全体に対して大規模に実行することもできます。これにより、アプリケーションの有効性とビジネス目標との整合性を測る方法に大きな柔軟性が生まれます。

SwagBot は EC プラットフォームのチャットボットなので、商品情報の正確性、プロフェッショナルなトーン、推奨内容の有用性を評価して、応答の質を判定したいところです。

1. **Evaluations** で `+ Configure Evaluation` をクリックし、**Create your own** を選択します:

    ![LLM As a Judge configuration](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-as-a-judge-1.png)

2. 評価名を入力します。以下を使えます:

    ```text
    ecommerce-quality-evaluation
    ```

3. OpenAI **swagbot** アカウントを選択し、**GPT-4o Mini** を選択します。

4. **Evaluation Scope** で評価対象アプリケーションとして **swagbot** を選択します。

5. **Span Filters** を展開します。**Evaluate on** で **Traces** を選択し、**Span Names** に `swagbot_workflow` を追加します。

6. **Evaluation Prompt** には独自のプロンプトを使うか、既存テンプレートから始めることができます。複数のテンプレートが用意されているので、確認のうえ **Create from scratch** を選択します。

7. 以下のシステムプロンプトを使用します。LLM の回答にスコアを付けるプロンプトです:

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

    Example:

    Query: "Tell me about the Dog Steel Bottle"
    Response: "The Dog Steel Bottle is $29.99 (blue, red, black). Keeps drinks cold 12hrs/hot 6hrs. 10% off now. Need shipping info?"
    Score: 95/100 (Minor deduction: could be more specific about purchase process)
    ```

8. **User Prompt** はデフォルトのままにします。

9. 評価の **Structured output** で **Score** を選択し、**score_eval** スキーマを以下に置き換えます:

    ```json
    {
        "name": "score_eval",
        "schema": {
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
        },
        "strict": true
    }
    ```

10. **Enablement Assessment criteria** を有効のままにし、`Pass Criteria` を **75** から **100** の間に設定します。

    ![Custom LLM As a Judge - Assessment Criteria](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-as-a-judge-create-2.png)

11. 保存前に、画面右側のフィルター済みトレースから 1 つを選択して評価プロンプトをテストできます。

12. 関連性のありそうな **Trace** をクリックします。Input と Output の値が **緑色** でハイライトされていることを確認します。

13. `Test Evaluation` をクリックします。

14. `Run` をクリックして評価を開始します。

15. 新しい LLM-as-a-Judge 評価により評価スコアが正しく生成されたことを確認します。

    ![LLM-as-a-Judge Evaluation Test](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-as-a-judge-create.png)

16. **Save and Publish** をクリックします。

17. 新しい評価が一覧に表示されます:

    ![LLM-as-a-judge Evaluation enabled for swagbot](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-as-a-judge-enabled.png)

自動評価を有効化したので、エージェント AI アプリケーションで問題が発生した場合に能動的に通知を受けられるようにしましょう。これにはモニターを使います!

## LLM Observability モニターの作成と管理

ラボ開始時に、エラーとレイテンシー問題を追跡するモニターが 2 つ自動的に作成されています。このセクションでは、コストを追跡する新しい LLM Observability モニターを作成します。

### 既存のモニターを確認する

1. [LLM Observability > Overview](https://app.datadoghq.com/llm/applications) の上部で、Monitors ステータス概要のセクションをクリックします。現在 `2 OK` と表示されているはずです。

    ![LLM Observability Monitors](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-monitors-ok.png)

2. モニターとそのステータスを確認します:

    ![LLM Observability Monitors](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-monitors-list.png)

    各モニターを開いて設定を確認しても構いません。次のラボでステータスが更新される様子を確認します。

### コストモニターを作成する

1. `+ Create an LLM Observability Monitor` をクリックします。
   - 新しい **LLM Observability** モニター作成ページが開きます
   - エラー、レイテンシー、Security & Safety、Evaluations、Cost、Custom など、複数のモニタータイプが用意されています
   - **Cost** モニタータイプを選択します

       ![LLM Observability Error Monitor Creation](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-monitor-cost-1.png)

   - **モニタースコープ** は `swagbot` に送信されたすべてのスパンを対象にします
   - **Estimated Total Cost** の合計を **agent** ごと、過去 **5 分** で表示します:

       ![LLM Observability Cost Monitor Query](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-monitor-cost-2.png)

       :::note
       agent は LLM Observability の各 LLM スパンに付与されるタグです。モニターで使うには **group by** フィールドに **agent** と入力するだけです。
       :::

   - `25000000` (2.5¢) を超えたら Alert、`15000000` (1.5¢) を超えたら Warn とします
   - データが 5 分間欠落した場合は `Show OK` を選択します

       ![LLM Observability Cost Monitor Alert Thresholds](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-monitor-cost-3.png)

   - モニターに **名前** を付けます。例: `[SwagBot] High Cost Usage by Agent {{agent.name}}`
   - **メッセージ** を追加します（モニターメッセージフィールドにそのまま貼り付けてください）:

       ```text
       {{#is_alert}}
       High cost detected for {{agent.name}} (${{value}} per 5 minutes).

       This agent is exceeding the cost threshold of ${{threshold}} per 5 minutes.

       Possible Optimizations:
       - Review the agent's prompt length to reduce token consumption
       - Check for redundant context in responses
       - Consider switching to a more cost-efficient model
       {{#if agent.name is "Response Synthesizer"}}
       - Optimize HTML formatting in responses to reduce output tokens
       {{/if}}

       View agent details in LLM Cost Dashboard: {{link "Cost Analysis" "https://app.datadoghq.com/llm/cost"}}
       {{/is_alert}}

       {{#is_recovery}}
       Cost for {{agent.name}} has returned to normal (${{value}} per 5 minutes).
       {{/is_recovery}}
       ```

   - その他はデフォルトのままにして `Create and Publish` をクリックします
   - モニターは作成直後 `NO DATA` 状態になりますが、エージェントワークフローでエージェントごとのコストが閾値を超えない限り、最終的には `OK` 状態になります

       ![LLM Observability Cost Monitor Alert Thresholds](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-monitor-cost-4.png)

   - SwagBot の最初のモニターを作成できました!
   - このタイプのモニターは、コストの制御、想定外の高支出を発生させているエージェントの特定、予算の遵守に非常に役立ちます

これでモニターを設定したので、エージェント AI アプリケーションで問題が発生した際にアラートを受けられます。

## Overview で評価を確認する

1. モニターと評価を設定したので、[LLM Observability Overview](https://app.datadoghq.com/llm/applications) に戻ります。

2. **Evaluations** までスクロールします。

3. 直近のトレースに対する評価結果が表示されているはずです。例えば Prompt Injection の検知:

    ![Prompt Injection Detection](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-security-promptinjection-detection.png)

4. ヒートマップやタイムラインで検知された攻撃の 1 つ（例: **Code Injection**）をクリックして、対応する LLM Observability スパンを表示します:

    ![Prompt Injection spans](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-prompt-injection-details.png)

5. 対応するスパンが表示されます:

    ![Prompt Injection trace](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-prompt-injection-trace.png)

6. いずれかのトレースを開いて、評価と推論の詳細を確認します:

    ![Example of Prompt Injection detection](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-security-promptinjection-details.png)

7. **Overview** に戻り、**Hallucination 検知** など他の **Evaluations** も自由に確認します:

    ![Hallucination detection](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-hallucination-overview.png)

8. 時間があれば、Hallucination 検知が発生したトレースを開いて、なぜハルシネーションと判定されたかを確認してみてください。下の例では、LLM スパンに赤いハルシネーションアイコンが表示され、`unsupported claim`（裏付けのない主張）の理由が示されています:

    ![Hallucination detection details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-hallucination-details.png)

9. 自分で作成した EC 向け LLM-as-a-Judge 評価や、**failure to answer** 評価も確認できます。これにより SwagBot の現在のパフォーマンスをモニタリングできます:

    ![Failure to answer overview](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-failure-to-answer-evaluation.png)

10. failure to answer の件数を見ると、最適化の余地があることに気付くはずです!

## ラボまとめ

**おめでとうございます!** エージェント AI アプリケーションの本番運用に向けた制御機構を構築できました。

このラボで達成したこと:

- **能動的なモニタリングのセットアップ**: ユーザーが不満を訴える前に問題を検知するため、エラー率・レイテンシー・コストのモニターを作成
- **品質評価の構成**: failure to answer と prompt injection のマネージド評価を設定
- **カスタム評価の確立**: ドメイン固有の品質基準を持つ LLM-as-a-Judge をビルド

**SwagBot は本番運用に対応しました!** 信頼性、安全性、高品質な応答を保証するための包括的なモニタリングと継続的な品質評価が整いました。

**次は実戦投入です!** 第3章では、これらのモニタリングと評価のセットアップを使い、本番で発生した問題のトラブルシューティングを行います。エラーの修正、データ品質問題の解決、パフォーマンス劣化の調査に取り組みます。
