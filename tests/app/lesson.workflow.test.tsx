import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/app/App';

describe('Lesson end-to-end workflow', () => {
  it('loads the lesson library', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /TMA Trainer/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Why One Bearing Is Not Enough/i)
    ).toBeInTheDocument();
  });

  it('selects a lesson, advances through tasks, submits estimate, views debrief, and retries', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Select the first lesson
    const lessonCard = screen.getByRole('button', {
      name: /Why One Bearing Is Not Enough/i,
    });
    expect(lessonCard).toBeInTheDocument();
    await user.click(lessonCard);

    // Now in lesson workspace — task 1 visible
    expect(screen.getByText(/First Observation/i)).toBeInTheDocument();

    // Playback controls visible
    expect(screen.getByRole('button', { name: /^Play$/i })).toBeInTheDocument();

    // Advance to task 2
    await user.click(screen.getByRole('button', { name: /Next Task/i }));
    expect(screen.queryByText(/First Observation/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Observe Bearing Rate/i)).toBeInTheDocument();

    // Advance to task 3
    await user.click(screen.getByRole('button', { name: /Next Task/i }));
    expect(screen.getByText(/Estimate Range/i)).toBeInTheDocument();

    // Fill in estimate form
    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '8000');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '270');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '10');

    await user.click(screen.getByRole('button', { name: /Submit Estimate/i }));

    // Finish lesson
    await user.click(screen.getByRole('button', { name: /Finish Lesson/i }));

    // View debrief
    await user.click(screen.getByRole('button', { name: /View Debrief/i }));

    // Debrief should render
    expect(
      screen.getByRole('heading', { level: 2, name: /Debrief/i })
    ).toBeInTheDocument();

    // Retry should reset back to library or lesson
    const retryBtn = screen.getByRole('button', { name: /Retry Lesson/i });
    await user.click(retryBtn);

    // Back to lesson workspace, task 1
    expect(screen.getByText(/First Observation/i)).toBeInTheDocument();
  });

  it('play/pause toggles playback state inside a lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Enter a lesson
    await user.click(
      screen.getByRole('button', { name: /Why One Bearing Is Not Enough/i })
    );

    const playBtn = screen.getByRole('button', { name: /^Play$/i });
    expect(playBtn).toBeInTheDocument();

    await user.click(playBtn);
    expect(
      screen.getByRole('button', { name: /^Pause$/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Pause$/i }));
    expect(screen.getByRole('button', { name: /^Play$/i })).toBeInTheDocument();
  });

  it('speed selection changes active speed inside a lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /Why One Bearing Is Not Enough/i })
    );

    const speed1x = screen.getByRole('button', { name: '1x' });
    const speed4x = screen.getByRole('button', { name: '4x' });

    expect(speed1x).toHaveClass('active');
    expect(speed4x).not.toHaveClass('active');

    await user.click(speed4x);

    expect(speed4x).toHaveClass('active');
    expect(speed1x).not.toHaveClass('active');
  });

  it('contact panel shows detected contact with expandable details', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /Why One Bearing Is Not Enough/i })
    );

    expect(screen.getByText(/CONTACT-1/i)).toBeInTheDocument();

    await user.click(screen.getByText(/CONTACT-1/i));
    expect(screen.getByText(/Bearing history/i)).toBeInTheDocument();
    expect(screen.getByText(/Source/i)).toBeInTheDocument();
  });

  it('estimate form validates and accepts input', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /Why One Bearing Is Not Enough/i })
    );

    // Advance to Task 3
    await user.click(screen.getByRole('button', { name: /Next Task/i }));
    await user.click(screen.getByRole('button', { name: /Next Task/i }));

    expect(
      screen.getByText(/Submit Estimate for CONTACT-1/i)
    ).toBeInTheDocument();

    // Submit empty
    await user.click(screen.getByRole('button', { name: /Submit Estimate/i }));
    expect(
      screen.getByText(/Range must be a positive number/i)
    ).toBeInTheDocument();

    // Fill valid
    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '8000');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '270');
    await user.clear(inputs[2]);
    await user.type(inputs[2], '10');

    await user.click(screen.getByRole('button', { name: /Submit Estimate/i }));
    expect(
      screen.getByText(/#1: R=8000yd, C=270°, S=10kt/i)
    ).toBeInTheDocument();
  });

  it('hints can be revealed individually', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /Why One Bearing Is Not Enough/i })
    );

    const showHintBtn = screen.getAllByRole('button', {
      name: /Show Hint/i,
    })[0];
    expect(showHintBtn).toBeInTheDocument();

    await user.click(showHintBtn);

    expect(
      screen.getByText(/A bearing is a line, not a point/i)
    ).toBeInTheDocument();
  });

  it('returns to library from lesson', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(
      screen.getByRole('button', { name: /Why One Bearing Is Not Enough/i })
    );

    const backBtn = screen.getByRole('button', { name: /Library/i });
    await user.click(backBtn);

    expect(
      screen.getByRole('heading', { name: /TMA Trainer/i })
    ).toBeInTheDocument();
  });
});
