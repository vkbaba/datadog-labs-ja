import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeExternalLinks from 'rehype-external-links';

export default defineConfig({
  site: 'https://vkbaba.github.io',
  base: '/datadog-labs-ja',
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
    ],
  },
  integrations: [
    starlight({
      title: 'Datadog Labs (JP)',
      customCss: ['./src/styles/custom.css'],
      tableOfContents: false,
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
          label: 'SRE 基礎 - 基本から自動修復まで',
          items: [
            { label: 'コース概要', slug: 'dd-gcp-sre-fundamentals' },
            { label: '第1章: ラボ環境の確認', slug: 'dd-gcp-sre-fundamentals/01-introduction' },
            { label: '第2章: SLO の作成', slug: 'dd-gcp-sre-fundamentals/02-creating-an-slo' },
            { label: '第3章: 環境の分析', slug: 'dd-gcp-sre-fundamentals/03-analyzing-the-environment' },
            { label: '第4章: まとめ - 自動ワークフローの確認', slug: 'dd-gcp-sre-fundamentals/04-automation-workflow' },
          ],
        },
      ],
    }),
  ],
});
