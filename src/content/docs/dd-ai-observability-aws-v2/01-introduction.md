---
title: 第1章 - エージェント AI に対する完全なオブザーバビリティの有効化
description: SwagBot を起動し、LangGraph アプリケーションのエンドツーエンドオブザーバビリティを確認します。
head: []
---

このワークショップでは、Datadog を使ってエージェント AI アプリケーションを観測・モニタリング・最適化する方法を学びます。

題材となるのは、**LangGraph** と **AWS Bedrock** で構築された本番品質のチャットボット **SwagBot** です。SwagBot は EC サイト Swagstore のチャットボットで、商品関連の問い合わせ対応と顧客満足度の向上を主な目的としています。

この第1章では、以下を行います:

1. ラボ環境を確認する
2. SwagBot を操作してマルチエージェント AI ワークフローの動作を確認する
3. Datadog に接続し、AI アプリケーションのフルスタックオブザーバビリティを発見する
4. なぜエージェント AI には従来の APM を超えた専用のオブザーバビリティが必要なのかを理解する

## ラボ環境を確認する

メインパネルの上部に複数のタブがあります:

- **Terminal**: 認証情報の取得やホストへのコマンド実行用ターミナル
- **IDE**: ローカルファイルの参照と編集ができる統合開発環境
- **SwagBot**: SwagBot へのリンク（後ほど起動します）
- **Datadog**: Datadog UI へのリンク
- **Help**: ラボで問題が発生した場合のヒントページ

## SwagBot の起動を確認する

1. **SwagBot** タブをクリックしてチャットウィンドウを開きます。

    :::note
    問題が発生した場合は、ページを更新してみてください。それでも解決しない場合は、ターミナルで以下のコマンドを実行して SwagBot コンテナを再起動します。

    ```bash
    docker compose down && docker compose up -d
    ```

    簡略化のために、ラボフォルダに 2 つのシェルスクリプトが用意されています。SwagBot のみを再起動する場合は `restart-swagbot.sh`、すべてのコンテナを再起動する場合は `restart-containers.sh` を使ってください。docker compose コマンドとシェルスクリプトはお好みで使い分けて構いません。
    :::

2. `Hello` と入力し、SwagBot がエラーなく応答することを確認します。

3. 任意の質問をして自由に SwagBot とやり取りしてみてください。

この時点で、SwagBot の AI アーキテクチャを推測できますか? 単一エージェントを使っているのか、複数のエージェントを使っているのか、どのような AI ワークフローなのか、Retrieval Augmented Generation (RAG) を使っているかどうかなど、考えてみてください。

## IDE を開いて主要ファイルを確認する

1. **IDE** タブをクリックして統合開発環境を開きます。

2. **docker-compose.yml** をクリックします。

### Docker 設定 (`docker-compose.yml`)

これは SwagBot を起動するための Docker Compose ファイルです。2 つのコンテナが動作しています:

- SwagBot アプリケーション
- Datadog Agent

ラボの後半で、LLM Observability を有効化するためにこの docker-compose.yml を編集します。

3. **app** フォルダを展開します。

### app フォルダ

このフォルダには SwagBot で使われるさまざまなファイルがあります:

- `swagbot_langgraph_workflow` は LangGraph の実装本体です
- `resources` サブフォルダには SwagBot が実行時に読み込むさまざまなリソースが入っています。ラボの一部で、ここを参照すると役立つことがあります

## Datadog にログインして SwagBot を観測する

1. ラボ開始時に Datadog アプリへのログイン用認証情報がプロビジョニングされています。左側のターミナルで以下のコマンドを実行して認証情報を取得します:

    ```sh
    creds
    ```

2. Datadog タブをクリックするか、新しいブラウザウィンドウで [Datadog アカウント](https://app.datadoghq.com/account/login) にログインします。

    _ヒント:_ ユーザー名とパスワードをダブルクリックするとクリップボードにコピーされます。

    :::note
    すでに Datadog ユーザーの場合は、まず自分のアカウントからログアウトしてから、このラボ用の認証情報でログインし直してください。
    :::

3. まず [Logs](https://app.datadoghq.com/logs) に移動します。「Get Started」画面が表示された場合は **Get Started** をクリックして、Datadog がサポートするさまざまなログソースを確認しましょう。

    ![Logs - Get Started](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-logs-getstarted.png)

    もう一度 **Get Started** をクリックします。

4. SwagBot アプリケーションから送信されてくるログがすでに表示されているはずです。[Logs Live Tail](https://app.datadoghq.com/logs/livetail) をクリックして確認しましょう。

    ![Logs Live Tail](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-logs-livetail.png)

5. [APM](https://app.datadoghq.com/apm/home?env=dev) を開きます。SwagBot サービスが表示されているはずです。

    ![SwagBot Service](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-apm-swagbot.png)

6. SwagBot をクリックして **Service** ページを開きます。

    ここに SwagBot に関するすべての情報が集約されています。リクエスト数・エラー率・レイテンシーといった主要 APM メトリクスをはじめ、エンドポイント、デプロイメント、インフラ情報、APM トレース、ログなどを確認できます。

    Service ページを自由に探索してみてください。

7. ページ上部の `Traces` タブをクリックするか、[APM Trace Explorer](https://app.datadoghq.com/apm/traces) を開きます。

    このビューでは、Datadog がトレースしたすべてのユーザーリクエストを確認できます。

8. 以下のクエリで、先ほどブラウザで実行したリクエストに対応するトレースを探します:

    ```text
    env:dev @browser.name:* service:swagbot
    ```

    ![APM Trace Explorer](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-apm-trace-explorer.png)

    SwagBot とのやり取りに対応するトレースが表示されるはずです:

    ![APM Trace](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-apm-trace.png)

9. トレースをクリックして開きます:

    ![APM Trace Flame Graph](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-apm-trace-details-1.png)

10. ここで表示されているのはフレームグラフ、すなわち SwagBot へのリクエストをグラフィカルに表現したものです。

    一目で、リクエストにかかった時間、通過したサービス、最も時間がかかったサービスが分かります。フロントエンドからバックエンドまでのエンドツーエンドの可視性を提供します。

    トレースは「**スパン**」で構成されており、各スパンは特定の処理やタスクを表します。ここでは、UI リクエスト、バックエンドの POST リクエスト、LangGraph ワークフローが見えています。各スパンは処理にかかった時間を計測しており、フレームグラフはコードのボトルネックや特定のエラー（感嘆符で表示）の特定に役立ちます。

    このフレームグラフを見るだけで、現在の LangGraph ワークフローの構成や実装タイプ（関与している各エージェントの名前から）を推測できるはずです。

11. フレームグラフ内の各 `langgraph.utils.runnable.runnableSeq` スパンにマウスを当てて、関与しているエージェントとそのタスク、所要時間を確認してみてください。

    トレースの下部で、現在マウスを当てたりクリックしたりしているスパンに関連するデータが自動的に表示されることに注目してください。

12. `Logs` タブをクリックして、トレースに関連付いたログを確認します。

    各タブを自由に探索して、利用可能なデータを把握してみてください。

13. Datadog はバックエンド処理だけでなく、`Real User Monitoring (RUM)` によりユーザージャーニーの可視化も提供します。これは、ユーザーエクスペリエンスがどれほど良かったかを理解したり、エラーが発生した場合に、いつ、どのように発生したかをエンドユーザー視点で確認するのに非常に役立ちます。

14. トレースの `Root span`（一番上にあり、現在のリクエストのフロントエンド部分を表すスパン）をクリックします。

15. トレース詳細の下部で、`Overview` タブが選択されていることを確認します:

    ![APM Trace - Link to RUM](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-APM-link-to-RUM.png)

16. `Parent Session` をクリックし、続いて `See session in RUM` をクリックします。

17. ここから自分の SwagBot 操作の様子を確認できます。さらに、セッション画面の右上にある `Replay Session` ボタンをクリックすると、自分の操作をリプレイすることもできます。

    ![RUM Session Replay](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-rum-session-replay.png)

18. `Play` をクリックして、自分のセッションをリプレイしてみましょう!

19. RUM のタブを閉じてトレースに戻ります。

20. トレース下部で、もう一度 `Logs` をクリックします。

21. 任意のログをクリックして、`Log Explorer` でそのエントリを開きます。

    ログエントリからも、Datadog ですべてが相関していることが分かります。ログの送信元ホスト、サービス、言語、コンテナ、関連するすべてのタグが確認できます。

22. `Trace` タブをクリックします:

    ![Log Details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-log-details.png)

    ここから関連するトレースを確認でき、RUM セッションへのリンクも表示されます。`View Trace in APM` をクリックすれば APM に戻れます。

これが Datadog の威力です。特別なコード変更なしに、ログ、APM トレース、インフラメトリクス、フロントエンドのエンドユーザー体験まで、すべてが連携・相関した深い可視性を即座に得ることができます。

## AI と LLM Observability

APM はアプリケーションの挙動の可視性を提供しますが、エージェント AI アプリケーションには、より専門的な観測およびセキュリティ機能が必要です。ここからは LLM Observability を有効化して、トレースを充実させ、AI ワークフローとエージェントの挙動をより深く理解できるようにしていきます。

1. [AI Observability](https://app.datadoghq.com/llm) を開きます。

    ![AI Observability](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-ai-observability.png)

### LLM Observability - 自動インストルメンテーション

すでに環境は動作しており、Datadog Agent もデプロイ済みなので、LLM Observability を有効化し、AI/ML ワークフローの詳細なトレースを段階的に強化していきます。

このパートでは、コード変更なしに、環境変数の設定だけで LLM アプリケーションをモニタリングできることを体験します。Datadog のトレーシングライブラリが残りの作業を引き受けてくれます。

### たった **3** 行で LLM Observability を有効化

1. IDE で `docker-compose.yml` を開きます。

2. SwagBot サービスの環境変数セクション（28、29、30 行目）にコメントアウトされた **3 行** があることに注目します:

    ![SwagBot Docker Compose with LLMObs variables commented](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-docker-compose-commented-variables.png)

    :::note
    LLM Observability は Agentless 構成にも対応しています。Agent を介さず、LLM アプリケーションのトレースを Datadog プラットフォームへ直接送信することも可能です。本ワークショップでは Datadog Agent 経由でトレースを送信します。
    :::

3. ターミナルで以下のコマンドを実行して、環境変数のコメントを外した新しい docker-compose ファイルをコピーし、SwagBot を再起動します:

    ```sh
    cp /root/lab-solutions/01-introduction/docker-compose.yml /root/lab/
    docker compose up -d --force-recreate swagbot
    ```

4. IDE で、LLM Observability の環境変数が有効化されたことを確認します:

    ![SwagBot Docker Compose with LLMObs enabled](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-enable-llm-obs.png)

5. SwagBot に簡単な質問を投げて **動作確認** します:

    ```text
    What products do you have?
    ```

    :::note
    SwagBot のチャット入力欄の上にある `Click to try sample requests` をクリックすると、ラボ全体で提案される定型リクエスト一覧にアクセスできます。手入力やコピー&ペーストを省きたい場合に活用してください。
    :::

### セットアップを確認する

1. LLM Observability にトレースが表示されることを確認します。

2. コンソールで [AI Observability](https://app.datadoghq.com/llm) をクリックします（SwagBot でリクエストを行ってから UI にトレースが反映されるまで 1〜2 分待つ必要がある場合があります）。

    :::note
    トレースがない状態で AI Observability をクリックすると、LLM Observability のイントロ画面が表示される場合があります。エンドツーエンドトレーシングによる迅速なトラブルシューティング、運用パフォーマンスの改善、品質と有効性の評価、機微データの保護など、LLM Observability の主要機能を確認するために、イントロ画面をスクロールして読んでみてください。

    アプリケーションの LLM Observability モニターに直接アクセスしてイントロ画面をスキップしたい場合は、AI Observability メニューの [Traces](https://app.datadoghq.com/llm/traces) をクリックします。
    :::

### 最初の LLM Observability トレースを確認する

1. **Traces** タブにいることを確認します。

    ![LLM Traces tab](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llm-obs-trace-tab.png)

2. Traces エクスプローラーで、最初の LLM トレースを見つけます:

    ![LLM Trace 1](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-llm-trace-1.png)

3. トレースをクリックして詳細を開きます。

    画面上部に、トレースに関する LLM 関連の詳細情報が表示されます:

    - 所要時間
    - 推定コストと使用された総トークン数
    - LLM 呼び出し回数
    - 使用されたモデル

    ![LLM Trace Header](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llm-trace-2.png)

    このトレースでは、合計で 4 回の LLM 呼び出し、約 3,500 トークンが使用されたことが分かります。

    画面下部には、Datadog のトレーシングライブラリが自動検出した LangGraph ワークフローが表示され、各 LangGraph タスクが実行した LLM 呼び出しを確認できます:

    ![LLM Trace Workflow](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llm-trace-2-workflow.png)

    右側には、左のツリーで選択中のスパンの詳細が表示されます。

    UI のこの部分で、LangGraph ワークフローの **Input** を確認できます。LangGraph エージェント AI の初期状態を観測しており、入力としては最初のユーザーリクエストのみが含まれています。

    ![LLM Trace Root Span Details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-llm-trace-2-rootspan-details-input.png)

    そして **Output** も確認できます:

    ![LLM Trace Root Span Details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-llm-trace-2-rootspan-details-output.png)

    後ほど、カスタムアノテーションで情報を充実させ、表示を強化する方法を学びます。

    リクエストがエージェント AI ワークフローを通過する過程で状態が更新されていき、最終状態が **Output** に表示されます。

    Output セクションを展開して、リクエスト処理に使われたエージェント AI ワークフローを確認してみてください。「What products do you have?」のリクエストを使った場合、専門エージェントは 1 つのみ（Product Specialist）が使われていることが確認できます。

    :::note
    このビューを得るために、3 つの環境変数を設定しただけで、アプリケーションのコードには一切手を加えていないことを思い出してください。
    :::

4. `Product Specialist` タスクの下にある LLM Span `bedrock-runtime.command` をクリックします。

    ![LLM Trace - LLM Span](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llm-trace-2-llm-span.png)

    このビューでは LLM スパンの詳細が確認できます。具体的な LLM 呼び出しの所要時間、使用モデル、入力メッセージとして使われたプロンプト (**1**)、LLM が返したレスポンス (**2**) を見ることができます。

### APM ビューに切り替える

LLM Observability のこのビューから、対応するトレースの APM ビューに簡単に切り替えられます。

1. 画面右上の `View in APM` をクリックします。

    ![LLM Trace - switch to APM link](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llm-trace2-view-apm.png)

2. APM の新しいトレースを確認します:

    ![LLM Trace - switch to APM](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llm-trace-2-apm.png)

    先ほどのトレースとの違いに気付くはずです。各 InvokeModel スパンの下に、AWS Bedrock に対する実際の呼び出しが見えるようになっています。

3. 任意の `InvokeModel` スパンをクリックします。

    Span Overview には、LLM Observability の詳細が表示されています:

    ![LLM Trace - APM LLM Span details](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-llm-trace-2-apm-llm-span.png)

4. `View Span` をクリックして LLM Observability トレースのスパン詳細に戻ります。

    UI とさまざまなスパンタイプを自由に探索してみてください。

## LLM Observability - 完全なコードインストルメンテーション

このように、Datadog で LLM 呼び出しの可視性を得るのは非常にシンプルです。LLM スタック全体の可視性を得るには、デコレーターを使ってアプリケーションをさらに計装します。デコレーターを追加すると、エージェント、タスク、ツール、リトリーバルを含む LangGraph ワークフロー全体をキャプチャできます。

📚 **参考:** [LLM Observability Custom Instrumentation](https://docs.datadoghq.com/llm_observability/instrumentation/custom_instrumentation?tab=decorators)

### 完全に計装された LangGraph ワークフローを使う

ワークフロー、エージェント、リトリーバル、タスク、ツール、LLM のスパン用にデコレーターがすでに追加された `swagbot_langgraph_workflow.py` をコピーします。エージェントワークフローのより深い可視性を得るために、合計 13 のデコレーターが追加されています。

```bash
cp /root/lab/app/swagbot_langgraph_workflow_full.py /root/lab/app/swagbot_langgraph_workflow.py
docker compose up -d --force-recreate swagbot
```

新しいインストルメンテーションを **テスト** する準備ができました。新しいクエリを試してみましょう:

```text
Do you have any deals on t-shirts or bottles this week?
```

**Datadog で改善されたトレースを確認します:**

- LLM Observability の Traces に戻る
- SwagBot で実行したリクエストのトレースを開く
- LangGraph **ワークフロースパン** が階層構造とともに表示されることを確認

![LLM Trace - Fully decorated workflow](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-fully-decorated-workflow.png)

各種スパンタイプを見て、Datadog で利用可能な情報を確認してみてください。

:::note
各スパンには独自にアノテーションを付与でき、Datadog 上での洞察と評価を高めるための情報を表示できます。
:::

ワークフロー上のスパンタイプは、以下のように色分けされています:

![Span type color coding](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-workflow-span-types.png)

各タイプのスパンをクリックして、Datadog 上の表示を確認してみてください。

特にリトリーバルスパンでは、入力に LangGraph がナレッジベースから取得した状態（現在アクティブな 2 つのプロモーション情報）が含まれていることが確認できます。

![Retrieval Span](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab2-retrieval-span.png)

APM トレース同様、LLM Observability トレースもフレームグラフ表示できます。これにより、LangGraph がユーザーリクエストを処理する際に使用するエージェント AI ワークフローを正確に可視化できます。

検索フィールドの隣で、View as `Flame Graph` を選択します。

![Trace-view-flamegraph](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-trace-viewas-flamegraph.png)

LangGraph のエージェント AI ワークフローがどのように表示されるか確認してみてください: Planning → Orchestrator → Specialist → Response Synthesizer の順に動作しています。

これまで使用した質問の多くは単一の専門エージェントで処理されるものでした。残りのラボでは、複数の AI エージェントが関与するより複雑なリクエストを使い、UI 上での表現を確認していきます。

複数のエージェントが関与する新しいクエリを試してみましょう:

```text
Tell me about the Dog Steel Bottle and any current promotions
```

![Fully instrumented trace](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-fully-instrumented-trace.png)

Traces エクスプローラー UI で入力と出力が適切に表示されるようになり、はるかに読みやすくなったことに気付くはずです。`Reader View` をクリックすると、入力と出力の全体を表示するさらに優れたビューに切り替えられます:

![Fully Instrumented trace - reader view](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab3-fully-instrumented-trace-reader.png)

トレースを開き、**Flame Graph** ビューに切り替えます:

![Fully Instrumented Flame Graph multi agent](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-workflow-flamegraph-parallel.png)

オーケストレーターから Promotion Specialist と Product Specialist が並列に呼び出され、両方の応答が Response Synthesizer によって統合されている様子が確認できます。

LLM Observability は、エージェントワークフローの専用グラフィカル表示も提供します。`Execution Graph` をクリックしてください。

`Expand` をクリックして **LangGraph** ワークフローを展開します:

![Execution Flow](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-execution-flow-expand.png)

アプリケーションが使用するワークフロー全体と、エージェント間の相互作用が確認できます:

![Fully Instrumented Execution Flow](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-workflow-execution-graph.png)

最後に、LLM Observability トレースのヘッダーで `Show RUM link` をクリックすると、RUM セッションにアクセスして SwagBot とのやり取りを直接確認することもできます:

![LLM Observability Trace - Show RUM link](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llmobs-trace-rum-link.png)

`PARENT SESSION` → `See Session in RUM` の順にクリックすると、セッションの詳細を確認したり、ユーザージャーニーを表示したり、セッションをリプレイしたりできます:

![Swagbot RUM Session](/datadog-labs-ja/assets/dd-ai-observability-aws-v2/lab1-llmobs-rum-session.png)

確認が終わったらタブを閉じて LLM Observability トレースに戻ります。

これで SwagBot アプリケーションは Datadog で効率的に観測できる状態になりました。

## ラボまとめ

**おめでとうございます!** SwagBot のエンドツーエンドオブザーバビリティを完成させました。

このラボで達成したこと:

- **フルスタックオブザーバビリティの体験**: Datadog がアプリケーション全体でメトリクス、トレース、ログをどう相関させるかを確認
- **バックエンドとフロントエンドの接続**: インフラ・サービスから Real User Monitoring によるユーザーエクスペリエンスまでの可視性を獲得
- **AI ワークフローの深い可視性**: LLM Observability で、各エージェントの判断、LLM 呼び出し、トークン使用量、リトリーバル操作を可視化

**SwagBot は完全に観測可能になりました!** ユーザーリクエストから最終応答までの各ステップ、トークン使用量、コスト、すべてのエージェントの判断を確認できます。

**次は本番運用への準備です!** 第2章では、モニタリング、品質評価、セキュリティ評価を設定し、SwagBot が本番品質を満たしていることを保証します。
