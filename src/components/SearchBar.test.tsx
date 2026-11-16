import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../test/axe';
import { SearchBar } from './SearchBar';

const DEBOUNCE = 250;

/** A parent that stores the value like the URL does: applied `lag` ms after onChange. */
function Host({ lag = 0, initial = '', spy }: { lag?: number; initial?: string; spy?: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <SearchBar
        value={value}
        placeholder="Search"
        onChange={(v) => {
          spy?.(v);
          if (lag) setTimeout(() => setValue(v), lag);
          else setValue(v);
        }}
      />
      <button type="button" onClick={() => setValue('external')}>
        external
      </button>
      <output>{value}</output>
    </>
  );
}

const wait = (ms: number) => act(() => new Promise((r) => setTimeout(r, ms)));

describe('SearchBar', () => {
  it('reports the text once typing pauses (debounced)', async () => {
    const spy = vi.fn();
    const user = userEvent.setup();
    render(<Host spy={spy} />);
    await user.type(screen.getByPlaceholderText('Search'), 'cedula');
    expect(spy).not.toHaveBeenCalled();
    await wait(DEBOUNCE + 50);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('cedula');
  });

  it('shows values set from outside (e.g. Back in the browser)', async () => {
    const user = userEvent.setup();
    render(<Host initial="first" />);
    expect(screen.getByPlaceholderText('Search')).toHaveValue('first');
    await user.click(screen.getByRole('button', { name: 'external' }));
    expect(screen.getByPlaceholderText('Search')).toHaveValue('external');
  });

  it('does not overwrite what the user typed while its own last value was still being applied', async () => {
    const user = userEvent.setup();
    render(<Host lag={100} />);
    const box = screen.getByPlaceholderText('Search');
    await user.type(box, 'abc');
    await wait(DEBOUNCE + 20); // 'abc' reported; the parent applies it 100 ms later
    await user.type(box, 'd'); // typed before that
    await wait(150); // the echo of 'abc' arrives
    expect(box).toHaveValue('abcd');
    await wait(DEBOUNCE + 150);
    expect(screen.getByRole('status')).toHaveTextContent('abcd');
  });

  it('a cleared box stays cleared when the echo of the old text arrives', async () => {
    const user = userEvent.setup();
    render(<Host lag={100} />);
    const box = screen.getByPlaceholderText('Search');
    await user.type(box, 'abc');
    await wait(DEBOUNCE + 20);
    await user.clear(box);
    await wait(150);
    expect(box).toHaveValue('');
    await wait(DEBOUNCE + 150);
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('is accessible: named search box, decorative icon hidden', async () => {
    const { container } = render(<Host />);
    expect(screen.getByRole('searchbox', { name: 'Search' })).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expectNoAxeViolations(container, { component: true });
  });
});
