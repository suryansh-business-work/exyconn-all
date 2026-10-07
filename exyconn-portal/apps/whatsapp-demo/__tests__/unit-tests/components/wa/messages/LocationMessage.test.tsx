import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LocationMessage } from '../../../../../src/components/wa/messages/LocationMessage';
import { frame, renderMessage } from './messages.fixtures';

const location = {
  name: 'Smile Clinic',
  address: '12 MG Road, Bengaluru',
  lat: 12.9716,
  lng: 77.5946,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('LocationMessage', () => {
  it('shows a drawn map with the place and its address', () => {
    renderMessage(<LocationMessage content={{ type: 'location', location }} frame={frame} />);
    expect(screen.getByRole('img', { name: 'Map of Smile Clinic' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open Smile Clinic in maps' })).toHaveTextContent(
      'Smile Clinic12 MG Road, Bengaluru',
    );
  });

  it('opens the spot in real maps in a new tab', async () => {
    const open = vi.spyOn(globalThis, 'open').mockReturnValue(null);
    const { user } = renderMessage(
      <LocationMessage
        content={{ type: 'location', location, caption: 'Parking at the back' }}
        frame={frame}
      />,
    );
    expect(screen.getByText('Parking at the back')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open Smile Clinic in maps' }));
    expect(open).toHaveBeenCalledWith(
      'https://www.google.com/maps/search/?api=1&query=12.9716,77.5946',
      '_blank',
      'noopener,noreferrer',
    );
  });
});
