import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('App smoke test', () => {
  it('renders the lesson library on first load', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: /TMA Trainer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Learn Target Motion Analysis/i)
    ).toBeInTheDocument();

    // Lessons visible on library screen
    expect(
      screen.getByText(/Why One Bearing Is Not Enough/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/How Bearing Rate Helps Solve the Puzzle/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ownship Maneuvers Improve the Solution/i)
    ).toBeInTheDocument();
  });
});
