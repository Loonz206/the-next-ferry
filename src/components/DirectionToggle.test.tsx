import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DirectionToggle } from './DirectionToggle';

describe('DirectionToggle', () => {
  it('renders both direction options', () => {
    render(<DirectionToggle direction="eastbound" onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: /^Bremerton → Seattle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Seattle → Bremerton/i })).toBeInTheDocument();
  });

  it('calls onChange when a direction is selected', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<DirectionToggle direction="eastbound" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /^Seattle → Bremerton/i }));

    expect(onChange).toHaveBeenCalledWith('westbound');
  });

  it('supports switching back to eastbound when westbound is active', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<DirectionToggle direction="westbound" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /^Bremerton → Seattle/i }));

    expect(onChange).toHaveBeenCalledWith('eastbound');
  });
});
