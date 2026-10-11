import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import { groups } from './content-map.mjs';

export default defineConfig({
  site:'https://iosbackup.isw.app',
  trailingSlash:'always',
  output:'static',
  integrations:[starlight({
    title:'iOS Backup',
    description:'Self-hosted iPhone and iPad backups on your NAS.',
    defaultLocale:'en',
    locales:{en:{label:'English',lang:'en'},'zh-cn':{label:'简体中文',lang:'zh-CN'}},
    sidebar:groups.map(group=>({label:group.en,translations:{'zh-CN':group.zh},items:group.ids.map(id=>({slug:`docs/${id}`}))})),
    social:[{icon:'github',label:'GitHub',href:'https://github.com/razeencheng/iosbackup'}],
    favicon:'/assets/logo-mark.png',
    customCss:['./src/styles/docs.css'],
    components:{SiteTitle:'./src/components/SiteTitle.astro',PageTitle:'./src/components/PageTitle.astro',Head:'./src/components/DocsHead.astro',LanguageSelect:'./src/components/LanguageSelect.astro',Footer:'./src/components/DocsFooter.astro'},
    lastUpdated:true,
    pagination:true,
    credits:false,
    disable404Route:true,
    expressiveCode:{shiki:{langAlias:{uci:'text'}}},
  }),sitemap({filter:page=>new URL(page).pathname!=='/',i18n:{defaultLocale:'en',locales:{en:'en','zh-cn':'zh-CN'}}})],
});
