---
title: 第1章 - エージェント AI に対する完全なオブザーバビリティの有効化
description: SwagBot を題材に、LangGraph アプリケーションのエンドツーエンドなオブザーバビリティを体験します。
head: []
---

このワークショップでは、e コマースサイト Swagstore のチャットボットである **SwagBot** を扱います。SwagBot の主な目的は、製品に関する問い合わせに対応し、Swagstore のサービスに顧客が満足できるよう支援することです。

まずは **SwagBot** を操作するための準備が整っていることを確認しましょう。

## ラボ環境を確認する

アプリケーションが正しく動作していることを確認し、環境に慣れておきましょう。

左側のメインパネル上部には、複数のタブが表示されています。
  - **Terminal**: 認証情報を取得したり、ホスト上でコマンドを実行したりするためのターミナルウィンドウです。
  - **IDE**: ローカルファイルの閲覧・編集ができる IDE です。
  - **SwagBot**: SwagBot へのリンクです（まもなく起動します）。
  - **Datadog**: Datadog UI へのリンクです。
  - **Help**: ラボで問題が発生した場合のヒントが記載されたページです。

## 自分の SwagBot が起動していることを確認する

1. **SwagBot** タブをクリックしてチャットウィンドウを開きます。

2. `Hello` と入力し、SwagBot がエラーなく応答することを確認します。
![SwagBot の初回操作](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-hello.png)

3. SwagBot と自由に対話し、好きな質問をしてみてください。

:::note
問題が発生した場合は、まずページを再読み込みしてみてください。
それでも解決しない場合は、ターミナルウィンドウで以下のコマンドを実行して SwagBot コンテナを再起動してください。
```bash
docker compose down && docker compose up -d
```
なお、ラボフォルダには SwagBot のみを再起動するシェルスクリプト（`restart-swagbot.sh`）と、すべてのコンテナを再起動するシェルスクリプト（`restart-containers.sh`）の 2 つが用意されています。docker compose コマンドとシェルスクリプトのどちらを使っても構いません。お好みに合わせてご利用ください。
:::

この時点で、SwagBot の AI アーキテクチャを推測できるでしょうか。単一のエージェントを使っているのか、それとも複数のエージェントを使っているのか。AI ワークフローの種類は何か。検索拡張生成（RAG: Retrieval Augmented Generation）を使っているのか。想像してみてください。

## IDE を開いて主要ファイルを確認する

1. **IDE** タブをクリックして統合開発環境を開きます。

2. **docker-compose.yml** をクリックします。

### Docker 構成（`docker-compose.yml`）

これは SwagBot を起動するために使用する Docker Compose ファイルです。次の 2 つのコンテナが実行されています。
- SwagBot アプリケーション
- Datadog Agent

ラボの後半では、この docker-compose.yml ファイルを編集して Agent Observability を有効化します。

3. **app** フォルダを展開します。

### app フォルダ

このフォルダには、SwagBot が使用するさまざまなファイルが含まれています。
- swagbot_langgraph_workflow は LangGraph の実装です。
- resources サブフォルダには、SwagBot が実行時にロードするさまざまなリソースが含まれています。ラボの一部では、この構成を知っておくと役立ち、中身を確認すると理解が深まる場合があります。

## Datadog にログインして SwagBot アプリケーションを観測する

1. このラボの開始時に、Datadog アプリにログインするための認証情報が払い出されています。左側の **Terminal** タブで、以下のコマンドを実行して認証情報を取得します。

    ```bash
    show-dd-credentials
    ```

2. **Datadog** タブをクリックするか、新しいブラウザウィンドウを開いて、取得した認証情報で [Datadog アカウント/組織](https://app.datadoghq.com/account/login) にログインします。

    _ヒント:_ ユーザー名とパスワードをダブルクリックすると、クリップボードにコピーできます。

    :::note
    すでに業務用アカウントで Datadog にログインしている場合は、この認証情報でログインする前に、まずログアウト（左下のアバターアイコン）してください。
    :::

3. [Logs](https://app.datadoghq.com/logs)（左メニューの虫めがねアイコン）に移動し、[Live Tail](https://app.datadoghq.com/logs/livetail) タブをクリックします。SwagBot のログが流れてくるのが確認できるはずです。
![Logs の Live Tail](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-logs-livetail.png)

    :::note
    「Get Started」画面が表示された場合は、それをクリック（2 回クリックが必要な場合があります）して Logs を有効化してください。
    :::

4. [APM](https://app.datadoghq.com/apm/home?env=dev)（左メニューの積み重なった棒グラフのアイコン）に移動します。`swagbot` サービスが一覧に表示されているはずです。
![SwagBot サービス](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-apm-swagbot.png)

5. `swagbot` サービスをクリックして、そのサービスページを開きます。

6. サービスページの左サイドバーで **Traces** をクリックします。SwagBot が処理した最新のトレースが表示され、`POST /data` が送信したチャットメッセージに対応しています。
  ![APM サービス SwagBot](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-apm-swagbot-service-page.png)

    :::note
    `POST /data` トレースが表示されない場合は、SwagBot と少なくとも 1 回は対話したことを確認してください。数秒待ってからページを再読み込みしてください。
    :::

7. `POST /data` トレースをクリックして **Flame Graph** を開きます。
    ![APM トレースの Flame Graph](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-apm-trace-details-1.png)

    これは、フロントエンドからバックエンドまでのエンドツーエンドの可視性を提供します。ひと目で、リクエストにどれだけ時間がかかったか、どのサービスを経由したか、どこで最も時間が費やされたかを確認できます。フレームグラフは **スパン** で構成されており、それぞれが特定の操作を表します。UI リクエスト、バックエンドの `POST /data`、そして LangGraph ワークフローなどです。

8. フレームグラフ内の `langgraph.graph.state.CompiledStateGraph` スパンにカーソルを合わせます。LangGraph ワークフローが実行されたこと *自体* とその所要時間は確認できますが、この時点では、どのエージェントが関与したのか、それぞれが何を判断したのか、システムプロンプトが何であったのか、消費されたトークン数はいくつか、といった情報は、各 APM スパンを一つずつ確認しない限り把握しづらい状態です。

まさにこの点を、APM の上に追加してくれるのが Agent Observability です。次にこれを有効化します。

## AI & Agent Observability

APM はアプリケーションの挙動を可視化してくれますが、エージェント AI アプリケーションにはより特化したオブザーバビリティとセキュリティの機能が必要です。ラボの残りの部分では、Agent Observability を有効化してトレースをエンリッチし、AI ワークフローとエージェントの挙動をより深く理解できるようにします。

1. [AI Observability](https://app.datadoghq.com/llm) に移動します（または左メニューの AI Observability アイコン（AI スパークル付きの円）をクリックします）。
![AI Observability](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-ai-observability.png)

### Agent Observability - 自動インストゥルメンテーション

環境が動作しており、Datadog Agent もすでにデプロイされているので、Agent Observability を有効化し、それを段階的に拡張して AI/ML ワークフローの詳細なトレースを取得していきましょう。
このラボのパートでは、コードを一切変更することなく、環境変数を有効化して Datadog のトレーシングライブラリに処理を任せるだけで、いかに簡単に LLM アプリケーションを監視できるかを確認します。

### たった **3** 行で Agent Observability を有効化！

1. IDE で `docker-compose.yml` ファイルを開きます。

2. SwagBot サービスの環境変数セクション（25、26、27 行目）にコメントアウトされた **3 行** があることに注目します。
![LLMObs 変数がコメントアウトされた SwagBot の Docker Compose](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-docker-compose-commented-variables.png)

:::note
Agent Observability は Agentless 構成もサポートしており、Agent を介さずに LLM アプリケーションをトレースして Datadog プラットフォームに直接トレースを送信することもできます。このワークショップでは、Datadog Agent を利用してトレースを送信します。
:::

3. ターミナルで、環境変数のコメントを解除した新しいバージョンの docker-compose ファイルをコピーし、以下のコマンドで SwagBot を再起動します。
```bash
cp /root/lab-solutions/01-introduction/docker-compose.yml /root/lab/
./restart-swagbot.sh
```

:::note
あるいは、IDE で 25〜27 行目のコメントを直接解除してから、ターミナルで `./restart-swagbot.sh` を実行してもかまいません。
:::

4. IDE で、Agent Observability の環境変数が有効になったことを確認できます。
![LLMObs が有効化された SwagBot の Docker Compose](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-enable-llm-obs.png)

5. SwagBot に簡単な質問をして **クイックテスト** を実行します。
```text
What products do you have?
```

:::note
SwagBot では、チャットのテキストボックスの上にある ``Click to try sample requests`` をクリックすると、あらかじめ定義されたリクエストの一覧にアクセスできます。ラボ全体で提案されるリクエストも含まれているため、すべてを手動で入力したりコピー＆ペーストしたりする必要がありません。ぜひ試してみてください。
:::

### セットアップを確認する

1. Agent Observability でトレースが確認できるようになったことを検証しましょう。

2. コンソールで [AI Observability](https://app.datadoghq.com/llm) をクリックします。
（SwagBot でリクエストを実行した後、トレースが UI に表示されるまでに 1〜2 分待つ必要がある場合があります）

:::note
トレースが利用できない状態で AI Observability をクリックすると、Agent Observability の紹介画面が表示される場合があります。紹介画面をスクロールして、Agent Observability の有用な機能を確認してみてください。次のようなものがあります。
- エンドツーエンドのトレーシングによる迅速なトラブルシューティング
- 運用パフォーマンスの向上
- 品質と有効性の評価
- 機密データの保護
:::

  紹介画面をスキップして Agent Observability でアプリケーションにアクセスするには、AI Observability メニューの [Traces](https://app.datadoghq.com/llm/traces) をクリックします。

### 最初の Agent Observability トレースを確認する

1. **Traces** タブにいることを確認し、Trace Explorer で最初の LLM トレースを見つけます。
![LLM トレース 1](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-1.png)

3. トレースをクリックして詳細を開きます。

  画面上部には、トレースに関する LLM 関連の詳細が表示されます。
  - Duration（所要時間）
  - Estimated costs（推定コスト）と Total Tokens used（使用トークン合計）
  - Number of LLM calls（LLM 呼び出し回数）
  - Models used（使用モデル）

  ![LLM トレースのヘッダー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2.png)

  この特定のトレースでは、合計 3 回の LLM 呼び出しが行われ、合計約 3300 トークンが使用されたことがわかります。
  なお、ラボでは異なる結果が表示される場合があります。エージェント AI は非決定論的であり、エージェントが目的を達成するために追加の呼び出しを行ったり、特定のツールを呼び出したりする場合があることを覚えておいてください。

5. 下部には、Datadog のトレーシングライブラリによって自動的に検出された LangGraph ワークフローが表示され、各 LangGraph タスクが実行したさまざまな LLM 呼び出しを確認できます。

  ![LLM トレースのワークフロー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2-workflow.png)

  右側には、左側のツリーで選択したスパンの詳細が表示されます。

  この UI では、LangGraph ワークフローの **Input** を確認できます。ここで観測しているのは LangGraph エージェント AI の初期状態です。入力として最初のユーザーリクエストのみが表示されています。
    ![LLM トレースのルートスパン詳細](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2-rootspan-details-input.png)
  また、**Output** も確認できます。
      ![LLM トレースのルートスパン詳細](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2-rootspan-details-output.png)

  この情報をエンリッチし、カスタムアノテーションで表示を強化する方法については、ラボの後半で説明します。

  リクエストがエージェント AI ワークフローを通過するにつれて状態が更新されていき、最終的な状態（現在は **Output** に表示されています）に達します。

  Output セクションを展開し、リクエストの処理に使用されたエージェント AI ワークフローを確認してみてください。「What products do you have?」というリクエストを使用した場合、複数のエージェントが関与しているものの、実際に使用された専門エージェントは 1 つ（Product Specialist）だけであることがわかります。エージェントが下した判断によっては、ワークフローがスクリーンショットと異なる場合があります。

  :::note
  このビューを得るために、環境変数を 3 つ使用しただけで、アプリケーションのコードには一切手を加えていないことを覚えておいてください。
  :::

4. ``Product Specialist`` エントリの下にある LLM スパン ``bedrock-runtime.command`` をクリックします。

  ![LLM トレース - LLM スパン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2-llm-span.png)

  :::note
  LangGraph は LangChain 上に構築されており、`langchain-aws` を使用して AWS Bedrock を呼び出します。実際の LLM スパン（`bedrock-runtime.command`）は Bedrock SDK によって発行され、生のモデル呼び出しを表します。
  :::

このビューでは、LLM スパンの詳細を確認できます。
その特定の LLM 呼び出しの所要時間、使用モデル、入力メッセージ（**1**）、および LLM が返したレスポンス（**2**）にアクセスできます。

### APM ビューに切り替える

Agent Observability のこのビューから、関連するスパン/トレースの APM ビューに簡単に切り替えることができます。
1. スパンヘッダーの **View in APM** ボタンをクリックして APM に移動します。

  ![LLM トレース - APM への切り替えリンク](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace2-view-apm.png)

2. APM で新しいトレースを確認します。

  ![LLM トレース - APM への切り替え](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2-apm.png)

3. トレースを自由に探索し、開いた新しいブラウザタブを閉じて Agent Observability のトレースに戻ります。

### 関連ログを表示する

Agent Observability は、アプリケーションのログをトレースビュー内に直接表示するため、製品から離れることなく実行時のコンテキストを調査できます。

1. Agent Observability のトレースに戻り、**Span**、**Chat**、**Evaluations**、**Feedback**、**Annotations** の隣にある ``Logs`` タブをクリックします。

  ![LLM トレース - 関連ログ](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llm-trace-2-logs-span.png)

2. ログは Datadog Agent によって注入されたトレース ID を介して自動的に関連付けられるため、APM や Logs Explorer に移動することなく、Agent Observability 内でリクエストの一連の流れを追うことができます。

:::note
標準の Logs Explorer が持つ完全なフィルタリングやクエリ機能が必要な場合は、Logs パネル右上の **Go to Logs Explorer** リンクに注目してください。
:::

3. **Span** タブをクリックしてスパンの詳細に戻ります。

## Agent Observability - 完全なコードインストゥルメンテーション

これまで示してきたように、Datadog では LLM 呼び出しの可視性を簡単に得られます。LLM スタック全体を可視化するには、デコレーターを使用してアプリケーションをさらにインストゥルメントできます。デコレーターを追加することで、エージェント、タスク、ツール、リトリーバルを含む LangGraph ワークフロー全体をキャプチャできます。

📚 **参考:** [Agent Observability Custom Instrumentation](https://docs.datadoghq.com/llm_observability/instrumentation/custom_instrumentation?tab=decorators)

### 完全にインストゥルメントされた LangGraph ワークフローを使用する

以下のコマンドを実行して、workflow、agent、retrieval、task、tool、llm の各スパン用のデコレーターがすでに含まれているバージョンの swagbot_langgraph_workflow.py をコピーします。合計 12 個のデコレーターが追加されており、エージェントワークフローをより深く可視化できます。

```bash
cp /root/lab/app/swagbot_langgraph_workflow_full.py /root/lab/app/swagbot_langgraph_workflow.py
./restart-swagbot.sh
```

3. これで新しいインストゥルメンテーションを **テストする準備が整いました**。SwagBot に次の新しいクエリを入力します。
```text
  What headphones do you recommend for under $250?
```

4. **Datadog で改善されたトレースを確認します。**
   - Agent Observability のトレースに戻ります
   - SwagBot で先ほど実行したリクエストのトレースを開きます
   - LangGraph **ワークフローのスパン** 全体が明確な階層構造で表示されるようになったことに注目します

  ![LLM トレース - 完全にデコレートされたワークフロー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-fully-decorated-workflow.png)

5. さまざまなスパンの種類を確認し、Datadog で利用できる情報を観察してみてください。

:::note
各スパンには個別にアノテーションを付けて、より多くの情報を含め、それを Datadog に表示することで、より深いインサイトと評価を得られます。
:::

  ワークフローに表示されるスパンの種類ごとに、以下のような色分けがされています。
  ![スパンの種類の色分け](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-workflow-span-types.png)

6. さまざまな種類のスパンをクリックして、Datadog でどのように表示されるかを確認します。

    特に retrieval スパンでは、出力にナレッジベースからの LangGraph の retrieval 状態に関する情報が含まれており、取得された既存製品に対応する 6 件の Output Documents のスコアが表示されていることに注目してください。
    ![Retrieval スパン](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-retrieval-span.png)

7. **Product Specialist** の下にある `bedrock-runtime.command` スパンをクリックし、右ペインで **Prompt** をクリックします。
  ![Product Specialist の LLM スパン - Prompt V1.0.0](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-product-specialist-prompt.png)

  Product Specialist エージェントが現在使用している完全なシステムプロンプトを確認できます。現在は **V1.0.0** を使用していることに注目してください。

  **ラボ 3** では、**Prompt Tracking** を使用してこのプロンプトをバージョン管理します。Product Specialist のプロンプトを更新した後、このビューで各トレースに対してどのバージョンが有効だったかを直接確認できるようになります。これは、品質の変化がコードの更新によるものか、プロンプトの編集によるものかを診断する際に不可欠です。

8. 左上の `Back` をクリックして Agent Observability のスパンに戻ります。

LangGraph のエージェント AI ワークフローがどのように表示されるかを確認してください。Planning、次に Orchestrator、次に Specialist、そして最後に Response Synthesizer という流れです。

これまで使用してきた質問のほとんどは、単一の専門 AI エージェントを使用するものでした。ラボの残りの部分では、複数の AI エージェントが関与するより複雑なリクエストを使用し、それらが UI でどのように表現されるかを確認します。

9. それでは、複数の専門エージェントが関与する新しい質問を SwagBot にしてみましょう。
```text
Tell me about the Dog Steel Bottle and any current promotions
```

![完全にインストゥルメントされたトレース](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-fully-instrumented-trace.png)
入力と出力が Traces Explorer の UI に適切に表示されるようになり、読みやすさと理解のしやすさが大幅に向上したことにお気づきでしょう。
``Reader View`` をクリックすると、入力と出力の両方を完全に表示する Reader ビューに切り替えられ、さらに快適に閲覧できます。
![完全にインストゥルメントされたトレース - Reader ビュー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-fully-instrumented-trace-reader.png)

10. トレースの詳細を開きます。
Orchestrator によって Promotion Specialist と Product Specialist のエージェントが並列に呼び出され、両方のレスポンスが Response Synthesizer エージェントによって統合されている様子に注目してください。

11. Agent Observability は、エージェントワークフローの専用のグラフィカル表現も提供しており、``Execution Graph`` をクリックすると利用できます。

12. SwagBot エージェントのボックス（水色）にカーソルを合わせて ``Expand`` をクリックし、**LangGraph** ワークフローを展開します。
![実行フロー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-execution-flow-expand.png)

13. アプリケーションが使用したワークフロー全体と、エージェント間のやり取りを確認できるようになりました。
![完全にインストゥルメントされた実行フロー](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-workflow-execution-graph.png)

14. 最後に、トレースヘッダー上部の ``Show RUM Link`` を展開すると、Agent Observability のトレースから直接 RUM セッションにアクセスし、SwagBot の操作を観察することもできます。
  ![Agent Observability トレース - Show RUM リンク](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llmobs-trace-rum-link.png)

15. ``PARENT SESSION`` をクリックし、次に ``See Session in RUM`` をクリックすると、セッションの詳細にアクセスしてユーザージャーニーを確認でき、さらに右上の ``Watch replay`` からセッションをリプレイできます。
  ![SwagBot の RUM セッション](/datadog-labs-ja/assets/dd-ai-observability-aws-v3/lab1-llmobs-rum-session.png)

16. 完了したら、Web ブラウザのタブを閉じて Agent Observability のトレースに戻ります。

これで SwagBot アプリケーションを Datadog で効率的に観測する準備が整いました。

## これまでに達成したこと

**おめでとうございます！** SwagBot に対する完全なエンドツーエンドのオブザーバビリティを実現しました。

**このラボでは、次のことを行いました。**
 - **フルスタックのオブザーバビリティを体験**し、Datadog がアプリケーション全体にわたってメトリクス、トレース、ログをどのように関連付けるかを確認しました
 - **バックエンドとフロントエンドを接続**し、インフラストラクチャやサービスから、Real User Monitoring によるユーザー体験に至るまでを可視化しました
 - **AI ワークフローの深い可視性を実現**し、Agent Observability によって、すべてのエージェントの判断、LLM 呼び出し、トークン使用量、リトリーバル操作を確認できるようにしました

**SwagBot は完全に観測可能になりました！** ユーザーのリクエストから最終的なレスポンスまで、トークン使用量、コスト、すべてのエージェントの判断を含め、あらゆるステップを確認できます。

**次のステップ:** いよいよ本番運用に向けた準備です。次のラボでは、SwagBot が本番運用の基準を満たすように、モニタリング、品質評価、セキュリティ評価を構成します。

次に進む準備ができたら、ターミナルで `finish` を実行して **Check** をクリックします。
```bash
finish
```
