import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { buildOrgTree } from '../../../../src/pages/org-chart';
import { OrgFlowChart } from '../../../../src/pages/org-chart/OrgFlowChart';
import { layoutOrgForest } from '../../../../src/pages/org-chart/org-layout';
import { renderWithProviders } from '../../test-utils';
import { flow } from './xyflow-stub';
import { COMPANY } from './org-people';

vi.mock('@xyflow/react', async () => (await import('./xyflow-stub')).xyflowMock);

function renderChart() {
  const onOpen = vi.fn();
  const { trees } = buildOrgTree(COMPANY);
  renderWithProviders(<OrgFlowChart trees={trees} onOpen={onOpen} />);
  return { onOpen, trees };
}

describe('OrgFlowChart', () => {
  it('places every person in the reporting lines where the tidy layout puts them', () => {
    const { trees } = renderChart();
    const expected = layoutOrgForest(trees).placed.map(({ node, x, y }) => ({
      id: node.id,
      position: { x, y },
    }));

    expect(flow.nodes.map(({ id, type }) => ({ id, type }))).toEqual(
      expected.map(({ id }) => ({ id, type: 'person' })),
    );
    expect(flow.nodes.map(({ id, position }) => ({ id, position }))).toEqual(expected);
    expect(
      flow.nodes.every((node) => (node.style as { pointerEvents: string }).pointerEvents === 'all'),
    ).toBe(true);
  });

  it('draws one stepped line from each manager to each report', () => {
    renderChart();

    expect(
      flow.edges.map(({ id, source, target, type }) => ({ id, source, target, type })),
    ).toEqual([
      { id: 'm->a', source: 'm', target: 'a', type: 'smoothstep' },
      { id: 'a->c', source: 'a', target: 'c', type: 'smoothstep' },
      { id: 'c->d', source: 'c', target: 'd', type: 'smoothstep' },
    ]);
  });

  it('keeps the chart read-only, fitted and in the theme colour mode', () => {
    renderChart();

    expect(flow.props).toMatchObject({
      colorMode: 'light',
      nodesDraggable: false,
      nodesConnectable: false,
      edgesFocusable: false,
      elementsSelectable: false,
      minZoom: 0.1,
      fitView: true,
    });
  });

  it("shows each person's role and how many people sit under them", () => {
    renderChart();

    const maya = screen.getByRole('button', { name: 'Open Maya Iyer' });
    expect(within(maya).getByText('CEO · Leadership')).toBeInTheDocument();
    expect(within(maya).getByText('MI')).toBeInTheDocument();
    expect(within(maya).getByLabelText('3 in team')).toHaveTextContent('3');

    const chen = screen.getByRole('button', { name: 'Open Chen' });
    expect(within(chen).getByText('Platform')).toBeInTheDocument();
    expect(within(chen).getByLabelText('1 in team')).toBeInTheDocument();
  });

  it('writes a dash for somebody with no role and no chip for somebody with no team', () => {
    renderChart();

    const dev = screen.getByRole('button', { name: 'Open Dev' });
    expect(within(dev).getByText('—')).toBeInTheDocument();
    expect(within(dev).queryByLabelText(/in team/)).not.toBeInTheDocument();
  });

  it('shows the photo where there is one', () => {
    renderChart();

    const asha = screen.getByRole('button', { name: 'Open Asha' });
    expect(asha.querySelector('img')).toHaveAttribute('src', 'https://img.example.com/asha.png');
  });

  it('opens the person who was clicked', async () => {
    const { onOpen } = renderChart();

    await userEvent.click(screen.getByRole('button', { name: 'Open Chen' }));

    expect(onOpen).toHaveBeenCalledWith('c');
  });
});
