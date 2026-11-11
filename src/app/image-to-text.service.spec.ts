import { TextBlock, blocksToText } from './image-to-text.service';

function word(text: string, x1: number, y1: number): TextBlock {
  return { text, bounding_box: { x1, y1, x2: x1 + 40, y2: y1 + 20 } };
}

describe('blocksToText', () => {
  it('returns an empty string when nothing was found', () => {
    expect(blocksToText([])).toBe('');
  });

  it('joins words of one line with spaces', () => {
    expect(blocksToText([word('Hello', 0, 10), word('world', 50, 12)])).toBe('Hello world');
  });

  it('starts a new line when a word is lower on the image', () => {
    const blocks = [word('First', 0, 10), word('line', 50, 10), word('Second', 0, 50)];
    expect(blocksToText(blocks)).toBe('First line\nSecond');
  });
});
