---
title: エージェント AI のオブザーバビリティ - AWS Bedrock + LangGraph
description: AWS Bedrock と LangGraph で構築したエージェント AI アプリケーションを Datadog LLM Observability でモニタリング・評価・最適化する実践ワークショップです。
head: []
---

このワークショップでは、AWS Bedrock と LangGraph で構築されたマルチエージェント AI チャットボット **SwagBot** を題材に、Datadog の LLM Observability を使ってエージェント AI アプリケーションを観測・評価・最適化する方法を学びます。

## 学習内容

- LangGraph + AWS Bedrock アプリケーションへの LLM Observability の有効化
- LLM トレースを通じたマルチエージェントワークフローの可視化（プランナー、オーケストレーター、専門エージェント、レスポンスシンセサイザー）
- LLM-as-a-Judge およびマネージド評価（ハルシネーション検知、Prompt Injection、Failure to Answer）の設定
- LLM Observability モニター（エラー、レイテンシー、コスト）の構築
- 本番環境で発生した問題のトレースからの根本原因分析
- LLM Experiments による複数モデルの比較とデータドリブンなモデル選定

## ワークショップ構成

| 章 | タイトル | 内容 |
|----|---------|------|
| 1 | [エージェント AI に対する完全なオブザーバビリティの有効化](/datadog-labs-ja/dd-ai-observability-aws-v2/01-introduction/) | SwagBot の動作確認、APM/RUM/LLM Observability の有効化、トレースの読み解き |
| 2 | [品質とセキュリティのモニタリング基盤の構築](/datadog-labs-ja/dd-ai-observability-aws-v2/02-enabling-llmobs/) | マネージド評価、カスタム LLM-as-a-Judge、コストモニターの設定 |
| 3 | [エージェント AI のモニタリングとトラブルシューティング](/datadog-labs-ja/dd-ai-observability-aws-v2/03-monitoring/) | エラー・データ品質・レイテンシー問題の根本原因分析と修正 |
| 4 | [エージェント AI アプリケーションの最適化](/datadog-labs-ja/dd-ai-observability-aws-v2/04-optimizing/) | LLM Experiments を使ったモデル比較とコスト・性能最適化 |
| 5 | [クイズ](/datadog-labs-ja/dd-ai-observability-aws-v2/05-quiz/) | 学習内容の最終アセスメントと Credly バッジ取得 |

## 前提条件

- LLM Observability が有効化された Datadog アカウント
- AWS Bedrock モデルへのアクセス権を持つ AWS アカウント（Experiments で使用する Anthropic 各種モデルを含む）
- OpenAI API キー（マネージド評価、特にハルシネーション検知に必要）
