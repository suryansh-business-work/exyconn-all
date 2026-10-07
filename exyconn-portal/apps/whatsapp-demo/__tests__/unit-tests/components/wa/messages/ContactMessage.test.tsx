import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { ContactMessage } from '../../../../../src/components/wa/messages/ContactMessage';
import { frame, renderMessage } from './messages.fixtures';

describe('ContactMessage', () => {
  it('shows the name, role and organisation and the number', () => {
    const { container } = renderMessage(
      <ContactMessage
        content={{
          type: 'contact',
          contact: {
            name: 'Dr. Rao',
            phone: '+91 98450 00000',
            role: 'Dentist',
            organisation: 'Smile Clinic',
          },
        }}
        frame={frame}
      />,
    );
    expect(container).toHaveTextContent('Dr. RaoDentist · Smile Clinic+91 98450 00000');
  });

  it('joins only the parts it has', () => {
    const { container } = renderMessage(
      <ContactMessage
        content={{
          type: 'contact',
          contact: { name: 'Front desk', phone: '+91 80 1111', organisation: 'Smile Clinic' },
        }}
        frame={frame}
      />,
    );
    expect(container).toHaveTextContent('Front deskSmile Clinic+91 80 1111');
    expect(container).not.toHaveTextContent('·');
  });

  it.each(['Message', 'Call'])('explains that %s would leave the demo', async (label) => {
    const { actions, user } = renderMessage(
      <ContactMessage
        content={{ type: 'contact', contact: { name: 'Dr. Rao', phone: '+91 98450 00000' } }}
        frame={frame}
      />,
    );
    await user.click(screen.getByRole('button', { name: label }));
    expect(actions.explainExternal).toHaveBeenCalledWith('+91 98450 00000');
  });
});
