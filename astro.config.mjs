import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://vkbaba.github.io',
  base: '/datadog-labs-ja',
  vite: {
    ssr: {
      noExternal: ['zod'],
    },
  },
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  integrations: [
    { name: '@astrojs/sitemap', hooks: {} },
    starlight({
      title: 'Datadog Labs',
      logo: {
        src: './src/assets/learning-center-bits.png',
        alt: 'Datadog Learning Center Bits',
      },
      customCss: ['./src/styles/custom.css'],
      tableOfContents: false,
      components: {
        Sidebar: './src/components/Sidebar.astro',
        Pagination: './src/components/Pagination.astro',
      },
      head: [
        { tag: 'script', attrs: { src: '/datadog-labs-ja/lightbox.js', defer: true } },
      ],
      defaultLocale: 'ja',
      locales: {
        root: {
          label: '日本語',
          lang: 'ja',
        },
      },
      sidebar: [
        {
          label: 'Datadog Fundamentals 認定試験対策ワークショップ',
          items: [
            { label: 'コース概要', link: '/cert01-datadog-fundamentals-prep/' },
            { label: '第1章: 学習環境の確認', link: '/cert01-datadog-fundamentals-prep/01-environment-lab/' },
            { label: '第2章: ホスト上の Datadog Agent', link: '/cert01-datadog-fundamentals-prep/02-agent-host/' },
            { label: '第3章: コンテナ上の Datadog Agent', link: '/cert01-datadog-fundamentals-prep/03-agent-container/' },
            { label: '第4章: インテグレーション', link: '/cert01-datadog-fundamentals-prep/04-integrations/' },
            { label: '第5章: アプリケーションパフォーマンスモニタリング (APM)', link: '/cert01-datadog-fundamentals-prep/05-apm/' },
            { label: '第6章: メトリクスとモニター', link: '/cert01-datadog-fundamentals-prep/06-metrics-monitors/' },
            { label: '第7章: ログのクエリと分析', link: '/cert01-datadog-fundamentals-prep/07-logs/' },
            { label: '第8章: ダッシュボード', link: '/cert01-datadog-fundamentals-prep/08-dashboards/' },
          ],
        },
        {
          label: 'SRE 基礎 - 基本から自動修復まで',
          items: [
            { label: 'コース概要', link: '/dd-gcp-sre-fundamentals/' },
            { label: '第1章: ラボ環境の確認', link: '/dd-gcp-sre-fundamentals/01-introduction/' },
            { label: '第2章: SLO の作成', link: '/dd-gcp-sre-fundamentals/02-creating-an-slo/' },
            { label: '第3章: 環境の分析', link: '/dd-gcp-sre-fundamentals/03-analyzing-the-environment/' },
            { label: '第4章: まとめ - 自動ワークフローの確認', link: '/dd-gcp-sre-fundamentals/04-automation-workflow/' },
          ],
        },
        {
          label: '[改訂版] エージェント AI のオブザーバビリティ - AWS Bedrock + LangGraph',
          items: [
            { label: 'コース概要', link: '/dd-ai-observability-aws-v3/' },
            { label: '第1章: 完全なオブザーバビリティの有効化', link: '/dd-ai-observability-aws-v3/01-introduction/' },
            { label: '第2章: 品質とセキュリティのモニタリング基盤', link: '/dd-ai-observability-aws-v3/02-enabling-llmobs/' },
            { label: '第3章: モニタリングとトラブルシューティング', link: '/dd-ai-observability-aws-v3/03-monitoring/' },
            { label: '第4章: アプリケーションの最適化', link: '/dd-ai-observability-aws-v3/04-optimizing/' },
          ],
        },
        {
          label: 'エージェント AI のオブザーバビリティ - AWS Bedrock + LangGraph',
          items: [
            { label: 'コース概要', link: '/dd-ai-observability-aws-v2/' },
            { label: '第1章: 完全なオブザーバビリティの有効化', link: '/dd-ai-observability-aws-v2/01-introduction/' },
            { label: '第2章: 品質とセキュリティのモニタリング基盤', link: '/dd-ai-observability-aws-v2/02-enabling-llmobs/' },
            { label: '第3章: モニタリングとトラブルシューティング', link: '/dd-ai-observability-aws-v2/03-monitoring/' },
            { label: '第4章: アプリケーションの最適化', link: '/dd-ai-observability-aws-v2/04-optimizing/' },
          ],
        },
      ],
    }),
  ],
});
