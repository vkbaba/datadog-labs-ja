---
title: Datadog Fundamentals 認定試験対策ワークショップ
description: Datadog Foundation 認定資格の取得に向けて、Agent のインストールから APM・ログ・メトリクス・モニター・ダッシュボードまで、Datadog プラットフォームの基礎をハンズオンで学ぶワークショップです。
head: []
---

このワークショップは、**Datadog Foundation 認定資格 (Datadog Fundamentals Certification)** の取得を目指す方を対象とした実践的なハンズオンコースです。題材には、Docker Compose で動作する e コマースアプリケーション **Storedog** を使用します。

Datadog Agent のインストールと設定から、インテグレーション、APM、ログ、メトリクス、モニター、ダッシュボードまで、Datadog プラットフォームの中核機能をひととおり体験しながら学びます。

## 学習内容

- Datadog Agent のホストおよびコンテナへのインストールと設定
- Agent コマンド（`status`、`config`、`configcheck`）の使い方
- Datadog インテグレーションの設定
- APM によるトレースの収集とサービスの可視化
- メトリクスの探索とモニターの作成
- ログのクエリ、分析、パターン抽出
- ダッシュボードによるデータの一元的な可視化

## ワークショップ構成

| 章 | タイトル | 内容 |
|----|---------|------|
| 1 | [学習環境の確認](/datadog-labs-ja/cert01-datadog-fundamentals-prep/01-environment-lab/) | ラボ環境と Storedog アプリケーションの確認、Datadog へのログイン |
| 2 | [ホスト上の Datadog Agent](/datadog-labs-ja/cert01-datadog-fundamentals-prep/02-agent-host/) | ホストへの Agent インストール、YAML 設定、ホスト名・ログ収集の構成 |
| 3 | [コンテナ上の Datadog Agent](/datadog-labs-ja/cert01-datadog-fundamentals-prep/03-agent-container/) | コンテナ環境での Agent のデプロイと Autodiscovery |
| 4 | [インテグレーション](/datadog-labs-ja/cert01-datadog-fundamentals-prep/04-integrations/) | OOTB インテグレーションの設定とメトリクス・ログの収集 |
| 5 | [アプリケーションパフォーマンスモニタリング (APM)](/datadog-labs-ja/cert01-datadog-fundamentals-prep/05-apm/) | サービスからのトレース収集、フレームグラフ、サービスマップ |
| 6 | [メトリクスとモニター](/datadog-labs-ja/cert01-datadog-fundamentals-prep/06-metrics-monitors/) | メトリクスの探索、モニターと SLO の作成 |
| 7 | [ログのクエリと分析](/datadog-labs-ja/cert01-datadog-fundamentals-prep/07-logs/) | 検索、グループ化、パターン、トランザクションによるログ分析 |
| 8 | [ダッシュボード](/datadog-labs-ja/cert01-datadog-fundamentals-prep/08-dashboards/) | グラフ・ログ・メトリクスを一元化するダッシュボードの構築 |

## 前提条件

- ラボ環境内でプロビジョニングされる Datadog トレーニングアカウント
- 基本的な Linux / ターミナル操作の知識
