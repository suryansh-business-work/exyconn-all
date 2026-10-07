// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import Surface from '../../../../src/renderer/components/Surface';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

function paper(): Element | null {
  return document.querySelector('.MuiPaper-root');
}

describe('Surface', () => {
  it('is a Paper that carries the caller’s props and content', async () => {
    await render(
      <Surface id="totals" component="section">
        <p>All time</p>
      </Surface>,
    );
    expect(paper()?.tagName).toBe('SECTION');
    expect(paper()?.id).toBe('totals');
    expect(paper()?.textContent).toBe('All time');
  });

  it('takes the caller’s sx as one style or as a list of them', async () => {
    await render(
      <>
        <Surface sx={{ p: 4 }}>single</Surface>
        <Surface sx={[{ p: 1 }, (theme) => ({ color: theme.palette.text.secondary })]}>
          list
        </Surface>
      </>,
    );
    const papers = [...document.querySelectorAll('.MuiPaper-root')];
    expect(papers.map((node) => node.textContent)).toEqual(['single', 'list']);
    // Each sx produced its own style on top of the surface recipe.
    expect(papers[0].className).not.toBe(papers[1].className);
  });
});
