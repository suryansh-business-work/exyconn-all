import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderTypedSignature, SIGNATURE_HEIGHT } from '@/components/signature';
import { TYPED, stubCanvas } from './signaturePadMock';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('renderTypedSignature', () => {
  it('writes the trimmed name in script ink across the canvas and returns the PNG', () => {
    const context = stubCanvas();
    const created: HTMLCanvasElement[] = [];
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const element = createElement(tag);
      created.push(element as HTMLCanvasElement);
      return element;
    });

    expect(renderTypedSignature('  Asha Rao ', '#212121', 500)).toBe(TYPED);

    expect(created[0]).toMatchObject({ width: 500, height: SIGNATURE_HEIGHT });
    expect(context).toMatchObject({ fillStyle: '#212121', textBaseline: 'middle' });
    expect(context?.font).toContain('italic 56px');
    expect(context?.fillText).toHaveBeenCalledWith('Asha Rao', 24, SIGNATURE_HEIGHT / 2, 452);
    expect(HTMLCanvasElement.prototype.toDataURL).toHaveBeenCalledWith('image/png');
  });

  it('is 600 px wide unless told otherwise', () => {
    const context = stubCanvas();
    renderTypedSignature('Asha', '#000');
    expect(context?.fillText).toHaveBeenCalledWith('Asha', 24, SIGNATURE_HEIGHT / 2, 552);
  });

  it('gives no signature when the browser has no 2D canvas', () => {
    stubCanvas(null);
    expect(renderTypedSignature('Asha', '#000')).toBe('');
    expect(HTMLCanvasElement.prototype.toDataURL).not.toHaveBeenCalled();
  });
});
