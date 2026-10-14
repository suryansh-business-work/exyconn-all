import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { VerifiedBadge } from '../../../../../src/components/wa/common/VerifiedBadge';
import { WaAvatar } from '../../../../../src/components/wa/common/WaAvatar';
import { Wallpaper } from '../../../../../src/components/wa/common/Wallpaper';
import { renderWithProviders } from '../../../test-utils';

describe('VerifiedBadge', () => {
  it('names the mark for screen readers, translated', () => {
    renderWithProviders(<VerifiedBadge />, {
      messages: { 'Verified business': 'Entreprise vérifiée' },
    });
    expect(screen.getByTitle('Entreprise vérifiée')).toBeInTheDocument();
  });

  it('takes the colour it is given', () => {
    renderWithProviders(<VerifiedBadge color="rgb(1, 2, 3)" />);
    expect(screen.getByTitle('Verified business').closest('svg')).toHaveStyle({
      color: 'rgb(1, 2, 3)',
    });
  });
});

describe('WaAvatar', () => {
  it('draws the business icon and is named when labelled', () => {
    const { container } = renderWithProviders(
      <WaAvatar label="City Clinic" size="40px" accent="teal" icon="doctor" />,
    );
    expect(screen.getByTestId('MedicalServicesIcon')).toBeInTheDocument();
    expect(container.querySelector('[aria-hidden="true"].MuiAvatar-root')).toBeNull();
  });

  it('shows initials instead of an icon, hidden from screen readers when unlabelled', () => {
    const { container } = renderWithProviders(
      <WaAvatar size="40px" accent="slate" initials="AK" />,
    );
    expect(screen.getByText('AK')).toBeInTheDocument();
    expect(container.querySelector('.MuiAvatar-root')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('svg')).toBeNull();
  });
});

describe('Wallpaper', () => {
  it('lays the conversation over the doodle tile', () => {
    renderWithProviders(
      <Wallpaper>
        <p>Messages</p>
      </Wallpaper>,
    );
    expect(screen.getByText('Messages').parentElement).toHaveStyle({ backgroundRepeat: 'repeat' });
    const styles = [...document.querySelectorAll('style')].map((s) => s.textContent).join('');
    expect(styles).toContain('data:image/svg+xml');
  });
});
