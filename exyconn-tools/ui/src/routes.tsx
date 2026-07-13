import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import ToolsPage from './pages/ToolsPage';

const Loading: React.FC = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
    <CircularProgress />
  </Box>
);

const lazy = React.lazy;

const toolRoutes = [
  { path: 'logo-set', Component: lazy(() => import('./tools/logo-maker')) },
  { path: 'email-signature', Component: lazy(() => import('./tools/email-signature')) },
  { path: 'lead-generator', Component: lazy(() => import('./tools/lead-generator')) },
  { path: 'contact-extractor', Component: lazy(() => import('./tools/contact-extractor')) },
  { path: 'sitemap-finder', Component: lazy(() => import('./tools/sitemap-finder')) },
  { path: 'chatbot-roi-calculator', Component: lazy(() => import('./tools/chatbot-roi-calculator')) },
  // AI Prompt & Generator Tools
  { path: 'ai-prompt-generator', Component: lazy(() => import('./tools/ai-prompt-generator')) },
  { path: 'ai-prompt-optimizer', Component: lazy(() => import('./tools/ai-prompt-optimizer')) },
  { path: 'ai-answer-generator', Component: lazy(() => import('./tools/ai-answer-generator')) },
  { path: 'ai-reply-generator', Component: lazy(() => import('./tools/ai-reply-generator')) },
  { path: 'ai-email-reply-generator', Component: lazy(() => import('./tools/ai-email-reply-generator')) },
  { path: 'ai-letter-generator', Component: lazy(() => import('./tools/ai-letter-generator')) },
  { path: 'ai-blog-title-generator', Component: lazy(() => import('./tools/ai-blog-title-generator')) },
  { path: 'ai-chatbot-name-generator', Component: lazy(() => import('./tools/ai-chatbot-name-generator')) },
  { path: 'ai-saas-name-generator', Component: lazy(() => import('./tools/ai-saas-name-generator')) },
  // AI Chat Tools
  { path: 'chat-with-website', Component: lazy(() => import('./tools/chat-with-website')) },
  { path: 'chat-with-text', Component: lazy(() => import('./tools/chat-with-text')) },
  { path: 'chat-with-documents', Component: lazy(() => import('./tools/chat-with-documents')) },
  { path: 'chat-with-pdf', Component: lazy(() => import('./tools/chat-with-pdf')) },
  { path: 'chat-with-word', Component: lazy(() => import('./tools/chat-with-word')) },
  { path: 'ai-chat-analyzer', Component: lazy(() => import('./tools/ai-chat-analyzer')) },
  // Website & URL Tools
  { path: 'website-url-extractor', Component: lazy(() => import('./tools/website-url-extractor')) },
  { path: 'website-page-scanner', Component: lazy(() => import('./tools/website-page-scanner')) },
  { path: 'site-structure-analyzer', Component: lazy(() => import('./tools/site-structure-analyzer')) },
  // Sitemap Tools
  { path: 'sitemap-validator', Component: lazy(() => import('./tools/sitemap-validator')) },
  { path: 'sitemap-generator', Component: lazy(() => import('./tools/sitemap-generator')) },
  { path: 'sitemap-url-extractor', Component: lazy(() => import('./tools/sitemap-url-extractor')) },
  { path: 'sitemap-compare', Component: lazy(() => import('./tools/sitemap-compare')) },
  { path: 'sitemap-split-merge', Component: lazy(() => import('./tools/sitemap-split-merge')) },
  { path: 'sitemap-insights', Component: lazy(() => import('./tools/sitemap-insights')) },
  { path: 'sitemap-index-generator', Component: lazy(() => import('./tools/sitemap-index-generator')) },
  { path: 'robots-sitemap-generator', Component: lazy(() => import('./tools/robots-sitemap-generator')) },
  { path: 'sitemap-frequency-analyzer', Component: lazy(() => import('./tools/sitemap-frequency-analyzer')) },
  // File & Data Converter Tools
  { path: 'pdf-to-markdown', Component: lazy(() => import('./tools/pdf-to-markdown')) },
  { path: 'csv-to-markdown', Component: lazy(() => import('./tools/csv-to-markdown')) },
  { path: 'json-to-markdown', Component: lazy(() => import('./tools/json-to-markdown')) },
  { path: 'docx-to-markdown', Component: lazy(() => import('./tools/docx-to-markdown')) },
  { path: 'rtf-to-markdown', Component: lazy(() => import('./tools/rtf-to-markdown')) },
  { path: 'html-to-markdown', Component: lazy(() => import('./tools/html-to-markdown')) },
  { path: 'webpage-to-markdown', Component: lazy(() => import('./tools/webpage-to-markdown')) },
  { path: 'notion-to-markdown', Component: lazy(() => import('./tools/notion-to-markdown')) },
  { path: 'google-docs-to-markdown', Component: lazy(() => import('./tools/google-docs-to-markdown')) },
  { path: 'xml-to-markdown', Component: lazy(() => import('./tools/xml-to-markdown')) },
  { path: 'text-to-markdown', Component: lazy(() => import('./tools/text-to-markdown')) },
  // FAQ & Support Tools
  { path: 'website-faq-generator', Component: lazy(() => import('./tools/website-faq-generator')) },
  { path: 'pdf-faq-generator', Component: lazy(() => import('./tools/pdf-faq-generator')) },
  { path: 'webpage-faq-generator', Component: lazy(() => import('./tools/webpage-faq-generator')) },
  { path: 'docx-faq-generator', Component: lazy(() => import('./tools/docx-faq-generator')) },
  { path: 'html-faq-generator', Component: lazy(() => import('./tools/html-faq-generator')) },
  { path: 'google-docs-faq-generator', Component: lazy(() => import('./tools/google-docs-faq-generator')) },
  { path: 'notion-faq-generator', Component: lazy(() => import('./tools/notion-faq-generator')) },
  { path: 'support-script-generator', Component: lazy(() => import('./tools/support-script-generator')) },
  // Domain & Network Tools
  { path: 'ssl-checker', Component: lazy(() => import('./tools/ssl-checker')) },
  { path: 'mx-record-checker', Component: lazy(() => import('./tools/mx-record-checker')) },
  { path: 'dns-lookup', Component: lazy(() => import('./tools/dns-lookup')) },
  { path: 'whois-lookup', Component: lazy(() => import('./tools/whois-lookup')) },
  { path: 'domain-expiry-checker', Component: lazy(() => import('./tools/domain-expiry-checker')) },
  { path: 'nameserver-checker', Component: lazy(() => import('./tools/nameserver-checker')) },
  { path: 'domain-availability', Component: lazy(() => import('./tools/domain-availability')) },
  { path: 'ip-lookup', Component: lazy(() => import('./tools/ip-lookup')) },
  { path: 'reverse-ip-lookup', Component: lazy(() => import('./tools/reverse-ip-lookup')) },
  { path: 'http-headers-check', Component: lazy(() => import('./tools/http-headers-check')) },
  { path: 'website-status-checker', Component: lazy(() => import('./tools/website-status-checker')) },
  { path: 'page-speed-checker', Component: lazy(() => import('./tools/page-speed-checker')) },
  { path: 'blacklist-check', Component: lazy(() => import('./tools/blacklist-check')) },
  { path: 'ssl-expiry-monitor', Component: lazy(() => import('./tools/ssl-expiry-monitor')) },
  { path: 'txt-record-checker', Component: lazy(() => import('./tools/txt-record-checker')) },
  { path: 'cname-checker', Component: lazy(() => import('./tools/cname-checker')) },
  { path: 'subdomain-finder', Component: lazy(() => import('./tools/subdomain-finder')) },
  { path: 'domain-age-checker', Component: lazy(() => import('./tools/domain-age-checker')) },
  { path: 'redirect-checker', Component: lazy(() => import('./tools/redirect-checker')) },
  { path: 'open-ports-check', Component: lazy(() => import('./tools/open-ports-check')) },
  // SEO Tools
  { path: 'seo-checker', Component: lazy(() => import('./tools/seo-checker')) },
  { path: 'serp-simulator', Component: lazy(() => import('./tools/serp-simulator')) },
  { path: 'plagiarism-checker', Component: lazy(() => import('./tools/plagiarism-checker')) },
  { path: 'summary-generator', Component: lazy(() => import('./tools/summary-generator')) },
  { path: 'paragraph-rewriter', Component: lazy(() => import('./tools/paragraph-rewriter')) },
  { path: 'paraphrasing-tool', Component: lazy(() => import('./tools/paraphrasing-tool')) },
  { path: 'sentence-rewriter', Component: lazy(() => import('./tools/sentence-rewriter')) },
  { path: 'gbp-description-generator', Component: lazy(() => import('./tools/gbp-description-generator')) },
  { path: 'google-review-link', Component: lazy(() => import('./tools/google-review-link')) },
  { path: 'review-qr-code', Component: lazy(() => import('./tools/review-qr-code')) },
  { path: 'website-authority-checker', Component: lazy(() => import('./tools/website-authority-checker')) },
  { path: 'ai-search-visibility', Component: lazy(() => import('./tools/ai-search-visibility')) },
  { path: 'keyword-tool', Component: lazy(() => import('./tools/keyword-tool')) },
  { path: 'keyword-volume-checker', Component: lazy(() => import('./tools/keyword-volume-checker')) },
  { path: 'keyword-rank-checker', Component: lazy(() => import('./tools/keyword-rank-checker')) },
  { path: 'backlink-checker', Component: lazy(() => import('./tools/backlink-checker')) },
  { path: 'website-traffic-checker', Component: lazy(() => import('./tools/website-traffic-checker')) },
  { path: 'serp-checker', Component: lazy(() => import('./tools/serp-checker')) },
  { path: 'competitor-finder', Component: lazy(() => import('./tools/competitor-finder')) },
  { path: 'ai-text-generator', Component: lazy(() => import('./tools/ai-text-generator')) },
  // PDF Tools
  { path: 'merge-pdf', Component: lazy(() => import('./tools/merge-pdf')) },
  { path: 'split-pdf', Component: lazy(() => import('./tools/split-pdf')) },
  { path: 'compress-pdf', Component: lazy(() => import('./tools/compress-pdf')) },
  { path: 'pdf-to-word', Component: lazy(() => import('./tools/pdf-to-word')) },
  { path: 'pdf-to-powerpoint', Component: lazy(() => import('./tools/pdf-to-powerpoint')) },
  { path: 'pdf-to-excel', Component: lazy(() => import('./tools/pdf-to-excel')) },
  { path: 'word-to-pdf', Component: lazy(() => import('./tools/word-to-pdf')) },
  { path: 'powerpoint-to-pdf', Component: lazy(() => import('./tools/powerpoint-to-pdf')) },
  { path: 'excel-to-pdf', Component: lazy(() => import('./tools/excel-to-pdf')) },
  { path: 'edit-pdf', Component: lazy(() => import('./tools/edit-pdf')) },
  { path: 'pdf-to-jpg', Component: lazy(() => import('./tools/pdf-to-jpg')) },
  { path: 'jpg-to-pdf', Component: lazy(() => import('./tools/jpg-to-pdf')) },
  { path: 'sign-pdf', Component: lazy(() => import('./tools/sign-pdf')) },
  { path: 'watermark-pdf', Component: lazy(() => import('./tools/watermark-pdf')) },
  { path: 'rotate-pdf', Component: lazy(() => import('./tools/rotate-pdf')) },
  { path: 'unlock-pdf', Component: lazy(() => import('./tools/unlock-pdf')) },
  { path: 'protect-pdf', Component: lazy(() => import('./tools/protect-pdf')) },
  { path: 'organize-pdf', Component: lazy(() => import('./tools/organize-pdf')) },
  { path: 'pdf-to-pdfa', Component: lazy(() => import('./tools/pdf-to-pdfa')) },
  { path: 'repair-pdf', Component: lazy(() => import('./tools/repair-pdf')) },
  { path: 'pdf-page-numbers', Component: lazy(() => import('./tools/pdf-page-numbers')) },
  { path: 'ocr-pdf', Component: lazy(() => import('./tools/ocr-pdf')) },
  { path: 'compare-pdf', Component: lazy(() => import('./tools/compare-pdf')) },
  { path: 'redact-pdf', Component: lazy(() => import('./tools/redact-pdf')) },
  { path: 'crop-pdf', Component: lazy(() => import('./tools/crop-pdf')) },
];

const AppRoutes: React.FC = () => (
  <Suspense fallback={<Loading />}>
    <Routes>
      <Route path="/" element={<ToolsPage />} />
      <Route path="/tools" element={<ToolsPage />} />
      {toolRoutes.map(({ path, Component }) => (
        <Route key={path} path={`/tools/${path}`} element={<Component />} />
      ))}
      <Route path="*" element={<Navigate to="/tools" replace />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
