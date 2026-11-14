import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GroveTree } from './GroveTree';

const rect = (left: number, top: number, width: number, height: number) =>
  ({
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
  }) as DOMRect;

beforeEach(() => {
  Object.defineProperty(SVGSVGElement.prototype, 'getScreenCTM', {
    configurable: true,
    value: () => ({ a: 1 }),
  });
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    return this.tagName.toLowerCase() === 'svg' ? rect(0, 0, 832, 480) : rect(400, 200, 40, 40);
  });
});
afterEach(() => vi.restoreAllMocks());

describe('GroveTree decorations', () => {
  it('is a picture, not something to interact with, unless moving is switched on', () => {
    render(<GroveTree stage="sapling" decorations={['apples']} />);
    expect(screen.getByRole('img', { name: 'A sapling with apples' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('draws a decoration where it was moved to', () => {
    const { container } = render(
      <GroveTree
        stage="sapling"
        decorations={['apples']}
        positions={{ apples: { x: 30, y: -10 } }}
      />,
    );
    expect(container.querySelector('[data-decoration="apples"]')).toHaveAttribute(
      'transform',
      'translate(30 -10)',
    );
  });

  it('moves a decoration with the arrow keys and saves when the key is let go', () => {
    const onMove = vi.fn();
    render(<GroveTree stage="sapling" decorations={['apples']} onMove={onMove} />);
    const apples = screen.getByRole('button', { name: /apples/i });

    fireEvent.keyDown(apples, { key: 'ArrowRight' });
    fireEvent.keyUp(apples, { key: 'ArrowRight' });
    expect(onMove).toHaveBeenLastCalledWith('apples', { x: 8, y: 0 });

    fireEvent.keyDown(apples, { key: 'ArrowUp', shiftKey: true });
    fireEvent.keyUp(apples, { key: 'ArrowUp' });
    expect(onMove).toHaveBeenLastCalledWith('apples', { x: 0, y: -32 });
  });

  it('never moves a decoration out of the scene', () => {
    const onMove = vi.fn();
    render(
      <GroveTree
        stage="sapling"
        decorations={['apples']}
        positions={{ apples: { x: 0, y: 0 } }}
        onMove={onMove}
      />,
    );
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: Element,
    ) {
      return this.tagName.toLowerCase() === 'svg' ? rect(0, 0, 832, 480) : rect(790, 200, 40, 40);
    });
    const apples = screen.getByRole('button', { name: /apples/i });
    fireEvent.keyDown(apples, { key: 'ArrowRight', shiftKey: true });
    fireEvent.keyUp(apples, { key: 'ArrowRight' });
    expect(onMove).toHaveBeenLastCalledWith('apples', { x: 2, y: 0 });
  });

  it('drags a decoration with the mouse', () => {
    const onMove = vi.fn();
    render(<GroveTree stage="sapling" decorations={['apples']} onMove={onMove} />);
    const apples = screen.getByRole('button', { name: /apples/i });

    fireEvent.pointerDown(apples, { pointerId: 1, button: 0, clientX: 420, clientY: 220 });
    fireEvent.pointerMove(apples, { pointerId: 1, clientX: 470, clientY: 200 });
    fireEvent.pointerUp(apples, { pointerId: 1, clientX: 470, clientY: 200 });
    expect(onMove).toHaveBeenCalledWith('apples', { x: 50, y: -20 });
  });
});
