---
title: "[改訂版] エージェント AI のオブザーバビリティ - AWS Bedrock + LangGraph"
description: AWS Bedrock と LangGraph で構築したエージェント AI アプリケーションを Datadog LLM Observability でモニタリング・評価・最適化する実践ワークショップの改訂版 (v3) です。
head: []
---

:::note
このコースは「エージェント AI のオブザーバビリティ - AWS Bedrock + LangGraph」の**改訂版 (v3)** です。内容が刷新されています。旧版は[こちら](/datadog-labs-ja/dd-ai-observability-aws-v2/)から参照できます。
:::

このワークショップでは、AWS Bedrock と LangGraph で構築されたマルチエージェント AI チャットボット **SwagBot** を題材に、Datadog の LLM Observability を使ってエージェント AI アプリケーションを観測・評価・最適化する方法を学びます。

## 学習内容

- LangGraph + AWS Bedrock アプリケーションへの LLM Observability の有効化
- LLM トレースを通じたマルチエージェントワークフローの可視化
- Evaluation （品質・セキュリティ）の設定
- LLM Observability モニター（エラー、レイテンシー、コスト）の構築
- 本番環境で発生した問題のトレースからの根本原因分析
- LLM Experiments による複数モデルの比較とデータドリブンなモデル選定

## ワークショップ構成

| 章 | タイトル | 内容 |
|----|---------|------|
| 1 | [エージェント AI に対する完全なオブザーバビリティの有効化](/datadog-labs-ja/dd-ai-observability-aws-v3/01-introduction/) | SwagBot の動作確認、APM/RUM/LLM Observability の有効化、トレースの読み解き |
| 2 | [品質とセキュリティのモニタリング基盤の構築](/datadog-labs-ja/dd-ai-observability-aws-v3/02-enabling-llmobs/) | 評価、アラート、コストモニターの設定 |
| 3 | [エージェント AI のモニタリングとトラブルシューティング](/datadog-labs-ja/dd-ai-observability-aws-v3/03-monitoring/) | Agent Observability による問題の評価と根本原因分析 |
| 4 | [エージェント AI アプリケーションの最適化](/datadog-labs-ja/dd-ai-observability-aws-v3/04-optimizing/) | LLM Experiments を使ったモデル比較とコスト・性能最適化 |

## 前提条件

- LLM Observability が有効化された Datadog アカウント
- AWS Bedrock モデルへのアクセス権を持つ AWS アカウント
- OpenAI API キー
