// Sanity test: confirms vitest + jsdom + jest-dom are wired correctly
// before we layer real hook tests on top.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('test harness', () => {
  it('renders to jsdom and matches a jest-dom matcher', () => {
    render(<h1>hello</h1>);
    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByRole('heading')).toHaveTextContent('hello');
  });

  it('stubs EventSource so SSE hooks can be tested', () => {
    const es = new EventSource('http://x/y');
    expect(typeof es.addEventListener).toBe('function');
    expect(globalThis.__MockEventSource.instances).toHaveLength(1);
  });
});
