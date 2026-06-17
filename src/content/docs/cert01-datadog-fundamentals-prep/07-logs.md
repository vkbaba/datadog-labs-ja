---
title: 第7章 - ログのクエリと分析
description: Search、Groups、Patterns、Transactions の概要を学びます
head: []
---

前の章でログ収集を設定したので、ここではログデータのクエリと分析を行い、意味のあるインサイトを理解・抽出していきます。この章では、Search、Groups、Patterns の概要を説明します。

**学習目標**:

* ログを検索する
* タグ、属性、ファセットの違いを学ぶ
* patterns、transactions、グラフを使ってログを集計する

環境の準備ができたら、**Start** ボタンをクリックしてください。

## Log Explorer

Logs Search ページには、選択した時間範囲に対して検索クエリに一致するインデックス済みのアプリケーションログが表示されます。検索クエリは、表示するログエントリを「フィルタリング」する条件を定義します。ログを段階的にフィルタリングしていくことで、目的の種類のログ行を絞り込むことができます。

Datadog Agent は、Storedog のすべてのサービスから多数のログ行を収集し、処理のために Datadog へ送信しています。

1.  **[Logs > Search & Analytics](https://app.datadoghq.com/logs)** に移動します。

    ページ上部のテキストフィールドと、検索結果の左側にある Facets パネルを使って検索クエリを構築できます。

    検索クエリには、`env` や `service` などの割り当てられたタグ、`@http.status_code` などログから抽出された属性、ログメッセージ内のテキスト文字列を含めることができます。

2.  Facets パネルの **Service** で `advertisements-service` と `discounts-service` を選択し、**Status** で `Error` を選択して、これら2つのサービスのエラーログ行のみを表示するようにフィルタリングします。

    ![facets-search](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/facets-search.png)

    ログ行のほとんどは、これらのサービスのメインスクリプトである `ads.py` または `discounts.py` から来ています。

3.  検索フィールドに次の内容を追加して、結果をさらにフィルタリングします。

    ```bash
    @filename:(discounts.py OR ads.py)
    ```

    これにより、これら2つのファイルからのログ行に特定して絞り込まれます。

4.  ログリスト内のログをクリックすると、サイドパネルが開き、割り当てられたタグ、ログメッセージ、抽出された属性、関連するトレース、関連するインフラストラクチャメトリクスなどの詳細が表示されます。

    ![logs-side-panel](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/logs_side_panel.png)

5.  ログのサイドパネルに表示される詳細に慣れておきましょう。

    1.  **Trace** タブをクリックして、関連するトレースを表示します。

    2.  **Metrics** タブをクリックして、関連するインフラストラクチャメトリクスを表示します。

6.  「An error occurred...」で始まるログメッセージに注目してください。`ERROR` ステータスを使う代わりに、この文字列を使ってこれらのサービスのエラーログをフィルタリングします。

    ログメッセージのうち `An error occurred` の部分をコピーし、ログのサイドパネルを閉じます。

7.  検索フィールドで `ERROR` の後ろにある **X** をクリックして、そのファセットをクエリから削除します。

8. 検索フィールドから ``@filename:(discounts.py OR ads.py)`` も削除します。

9. 検索フィールドにログメッセージのテキスト `An error occurred` を貼り付けて Enter キーを押します。同じログのリストが表示されることに注目してください。

これで、Facets パネルと検索フィールドの両方を使って検索クエリを構築する方法が分かりました。

### Custom Facets

Datadog がログを解析する際、一般的なタグや属性は自動的に Facets パネルに表示されます。また、ログのサイドパネルにあるログの詳細から、タグをカスタムファセットとして Facets パネルに追加することもできます。

![create-facet](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/create-facet.gif)

1.  いずれかのログ行をクリックしてログのサイドパネルを開きます。下にスクロールして **Event Attributes** のリストを表示します。

2.  `process` 属性の下で `name` にカーソルを合わせ、表示される「3点」アイコンをクリックします。**Create facet for @process.name** を選択します。

    **Add facet** ウィンドウが表示されます。**Advanced** を展開すると追加のフィールドが表示されます。

3.  **Add** をクリックします。

    ファセットが正常に追加されたことを確認するメッセージが表示されます。ログのサイドパネルを閉じます。

4.  ページ上部の検索フィールドをクリアし、右上の時間範囲ドロップダウンから `Past 15 Minutes` を選択します。

5.  Facets リストの一番下までスクロールします。**OTHERS** ファセットグループの下で **process.name** ファセットを展開します。

    新しいファセットが表示されるまで、新しいログが収集・処理されるのを待つ必要がある場合があります。しばらくすると、ログエントリ内で見つかったこの属性の値が表示されます。

    ![New process.name facet](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/process_name_facet.png)

    `bootstrap` を選択して、`process.name` 属性の値が `bootstrap` であるログ行でフィルタリングします。

検索コンテキストの作成に利用できるタグや属性は、ログに割り当てたタグと、ログから抽出した属性に依存します。

### Saved Views

検索クエリを Saved Views として保存し、いつでも呼び出すことができます。

1. 検索フィールドをクリアします。

2. Facets パネルの **Service** で `advertisements-service` と `discounts-service` を選択し、**Status** で `Error` を選択します。

3.  検索フィールドの上にある **My View** の横の「3点」ボタンをクリックし、**+ Save as a new view** を選択してこの検索クエリを保存します。

    Saved Views のリストとともに Views パネルが開きます。`Default view` に加えて、PostgreSQL インテグレーションが提供する事前定義のビューが表示されます。

    ![Save a new log search view](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/save_new_view.png)

4.  **New view** の **Name** フィールドに `Ads and Discounts Errors` と入力し、**Save** をクリックします。

    新しいビューがリストに表示されます。

5.  **Default view** の保存済みビューをクリックします。これにより検索クエリがクリアされます。

6.  先ほど作成した新しい **Ads and Discounts Errors** ビューをクリックします。保存したビューの検索クエリが入力されることが分かります。

7.  フィルタリングされたビューの上にある **Hide** をクリックして Views パネルを閉じます。

### Live Tail

Live Tail ビューは、処理後・インデックス化(またはアーカイブ)前に Datadog に取り込まれたすべてのログを表示します。このビューは、ログ行をできるだけ早く確認するのに役立ちます。ただし、これらのログはこのリストに保持されないため、過去に表示されたログを後から見ることはできません。

1.  Log List の上にある時間範囲ドロップダウンで `Live Tail` を選択し、リストの表示が始まるのを待ちます。

    Live Tail のログリストに表示されるログが検索クエリに一致していることに注目してください。

2.  検索クエリをクリアします。新しいログが収集されるのを待ちます。Live Tail リストに、アプリから収集されている*すべて*のログが表示されるようになったことに注目してください。

    インデックス済みログで利用できるフィルターにはアクセスできませんが、検索フィールドでクエリを更新することはできます。また、Live Tail でもカスタムファセットや Saved Views を利用できます。

    ![Saved views and custom facet in Live Tail](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/saved_views_custom_facet_live_tail.png)

3.  Log List の上にある時間範囲ドロップダウンで `Past 15 minutes` を選択して、Logs Search に戻ります。

ログ検索クエリの構文について詳しくは、[Logs Search Syntax docs](https://docs.datadoghq.com/logs/search_syntax/) を参照してください。

ログを検索・フィルタリングする方法が分かったので、次はログ分析のためのさまざまな集計機能を見ていきましょう。

## Log Aggregation

Fields による集計では、クエリフィルターに一致するすべてのログが、ログファセットの値に基づいてグループに集計されます。これらのグループに対して、グループごとのログ件数、グループごとのファセットのコード化された値のユニーク件数、グループごとのファセットの数値に対する統計演算を抽出できます。

このようにログを集計することで、トレンドをより明確に把握したり、さまざまな種類のログファセット間の関係を可視化したりできます。

1.  **[Logs > Search & Analytics](https://app.datadoghq.com/logs)** に移動します。

2.  Views パネルを開き、作成した保存済みビュー **Ads and Discounts Errors** を選択します。

3.  検索フィールドの下、クエリエディタの **Group into** 行で `Fields` を選択します。

    フィルタリングされたログのグラフによる可視化が Log List に置き換わって表示されます。

4.  フィールドを `service` でグループ化し、`all logs` の件数を表示します。

    ![Field aggregation of discounts and ads services](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/field_aggregate_ads_discounts.png)

5.  グラフの上の **Visualize as** では、デフォルトで **Timeseries** が選択されています。他の可視化オプションを選択して、それぞれの見た目を確認してみましょう。たとえば **Top List** を選択すると、次のように表示されます。

    ![Click graph to view aggregated logs](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/view_logs_comprising_aggregate.png)

    これらの可視化はインタラクティブであることに注目してください。行やグラフをクリックすると、集計されたログのリストがサイドパネルに表示されます。

    ![Aggregated logs detail panel](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/aggregated_logs_detail_side_panel.png)

### Exporting Graphs

任意のログの可視化を、Monitors、Dashboards、Notebooks など Datadog アプリの他の領域にエクスポートできます。ログからカスタムメトリクスを作成したり、集計データを CSV としてダウンロードしたりすることも可能です。

1.  **Visualize as** で **Timeseries** を選択します。

2.  グラフの上にある **More** ボタンをクリックします。

3.  **Save to dashboard** をクリックします。

    ![Save to dashboard](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/export_logs_to_dash.png)

    このワークショップの前の章で作成したダッシュボードを選択し、**Save** をクリックします。

5.  **Visualize as** で **List** をクリックして、デフォルトのログリストビューに戻ります。

次のセクションでは、Datadog がすべてのログ内容全体にわたって検出する patterns に基づいてログを集計します。

## Pattern Aggregation

さまざまなソースから大量のログを整理するのは手間がかかる場合があります。すべてのログ行がきれいにタグ付けされ、賢く解析され、検索クエリで簡単に参照できるとは限りません。幸いなことに、ログには Datadog が自動的に検出できるパターンがあり、類似したログ行を集計できます。

pattern による集計では、似た構造のメッセージを持ち、同じサービスに属し、同じステータスを持つログがまとめてグループ化されます。patterns ビューは、他の問題を見落とす原因となりかねないノイズの多いエラーパターンを検出・フィルタリングするのに役立ちます。

1. **[Logs > Search](https://app.datadoghq.com/logs)** に移動します。

2. Views パネルを開き、作成した保存済みビュー **Ads and Discounts Errors** を選択します。

3. 検索フィールドから `error` ステータスを削除します。

4.  **Group into** で `Patterns` を選択します。

    検出されたログのパターンが、最も多いものから最も少ないものへと並べ替えられて表示されます。件数、グループ化に使われたファセット(この場合は `service`)、ログメッセージを確認できます。

    ![Discounts and ads services logs aggregated by pattern](/datadog-labs-ja/assets/cert01-datadog-fundamentals-prep/ads_discounts_pattern_aggregation.png)

5.  検索フィールドの下のクエリエディタで、**Group into** 行の末尾の **by** を `process.name` に設定します。ここでは、先ほど作成したカスタムファセットでグループ化されたパターンを確認できます。

6.  **by** を `status` に変更して、ステータス値でグループ化されたパターンを確認します。

7.  ログリストの列見出しは並べ替え可能です。**COUNT** ヘッダーを2回クリックして、最も少ないものから最も多いものへと並べ替えます。

8.  いずれかのパターンをクリックして詳細サイドパネルを開きます。パターンと Log Samples のリストが表示されます。

9.  ログ行をクリックして詳細パネルを表示します。確認が終わったら詳細パネルを閉じます。

10. パターンの詳細サイドパネルに戻り、パターンの上にある **Show Parsing Rule** をクリックします。これは Grok と呼ばれる正規表現の方言で、Datadog のログパイプラインで使用されるパーサーの1つです。

    パースルールは、Datadog が JSON ログ行を自動的に解析するのと同じように、半構造化されたログ行を適切に構造化されたタグ付け可能なオブジェクトへと解析するカスタムパイプラインを作成するうえで非常に強力です。

    Datadog が自動的に設定したパイプラインは、**[Logs > Configuration > Pipelines](https://app.datadoghq.com/logs/pipelines)** で確認できます。

    カスタムパイプラインの作成はこの章の範囲外ですが、このトピックをより深く学びたくなったときのために [Pipelines docs](https://docs.datadoghq.com/logs/log_configuration/pipelines/?tab=source) を覚えておいてください。

## Lab Conclusion

これで、ログを検索し、フィールドやパターンで集計する方法が分かりました。

Datadog Logs では、この章で取り上げた内容よりも*はるかに*深く活用できます。Datadog は次のような強力なログ機能を多数提供しています。

* [Transactions](https://docs.datadoghq.com/logs/explorer/#transactions) を使うと、ログのタグや属性を用いて関連するログイベントを1つの上位レベルの「transaction」イベントに集計できます。複雑に相互接続されたシステムをログイベントを通して可視化したり、所要時間、イベント件数、カスタムメジャーを比較してトランザクションのボトルネックを特定したりできます。

* [Generate Metrics](https://docs.datadoghq.com/logs/log_configuration/logs_to_metrics/) を使うと、取り込まれたログからメトリクスを生成し、非常に長期間にわたってログデータを要約できます。

* [Indexes](https://docs.datadoghq.com/logs/log_configuration/indexes) は、データを価値ごとのグループに分割して、リテンション、クォータ、使用状況の監視、課金を分けることを可能にし、Log Management の予算をきめ細かく制御できます。

* この章で触れたように、[Log Pipelines](https://docs.datadoghq.com/logs/log_configuration/pipelines/?tab=source) は半構造化されたログ行を価値あるデータソースへと変換できます。Grok やその他のパーサーの使用について詳しくは、[Parsing Docs](https://docs.datadoghq.com/logs/log_configuration/parsing/?tab=matchers) を参照してください。

* さらに多くのログ機能や機能性については、[Logs docs](https://docs.datadoghq.com/logs/) を参照してください。

完了したら、ターミナルで次のコマンドを入力します。

```bash
finish
```

ラボの右下にある **Check** ボタンをクリックし、結果が表示されるのを待ちます。
