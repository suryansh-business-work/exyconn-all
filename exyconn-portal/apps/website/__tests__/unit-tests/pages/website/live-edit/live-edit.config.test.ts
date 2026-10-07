import { describe, expect, it } from 'vitest';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import {
  ARTICLE_CANVAS_STYLES,
  ARTICLE_CLASS,
  MEDIA_FOLDERS,
  siteUrl,
} from '../../../../../src/pages/website/live-edit/live-edit.config';
import { LIVE_EDIT_ACTION } from '../../../../../src/pages/website/live-edit/live-edit.action';

describe('siteUrl', () => {
  it('resolves a path against the public website', () => {
    expect(siteUrl('/blog/hello-world')).toBe('https://exyconn.com/blog/hello-world');
    expect(siteUrl('case-studies/acme')).toBe('https://exyconn.com/case-studies/acme');
  });

  it('keeps an absolute URL as it is', () => {
    expect(siteUrl('https://cdn.example.test/a.css')).toBe('https://cdn.example.test/a.css');
  });
});

describe('live-edit config', () => {
  it('styles the canvas with the site’s own article stylesheet and class', () => {
    expect(ARTICLE_CANVAS_STYLES).toEqual(['https://exyconn.com/styles/article-canvas.css']);
    expect(ARTICLE_CLASS).toBe('article-body');
  });

  it('uploads each kind of website media into its own folder', () => {
    expect(MEDIA_FOLDERS).toEqual({
      blog: 'website/blog',
      caseStudies: 'website/case-studies',
      careers: 'website/careers',
      tools: 'website/tools',
    });
  });

  it('offers a primary "live edit" grid action', () => {
    expect(LIVE_EDIT_ACTION).toEqual({
      key: 'liveEdit',
      label: 'live edit',
      icon: DesignServicesIcon,
      color: 'primary',
    });
  });
});
