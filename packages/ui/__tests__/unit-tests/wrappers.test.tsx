import { createRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppBar } from '../../src/AppBar';
import { Button } from '../../src/Button';
import { Drawer } from '../../src/Drawer';
import { IconButton } from '../../src/IconButton';
import { TextField } from '../../src/TextField';

describe('AppBar', () => {
  it('defaults to a flat, inherit-coloured, fixed bar', () => {
    const ref = createRef<HTMLDivElement>();
    render(<AppBar ref={ref}>Top</AppBar>);
    const bar = screen.getByText('Top');
    expect(bar).toBe(ref.current);
    expect(bar).toHaveClass('MuiAppBar-positionFixed', 'MuiAppBar-colorInherit');
    expect(bar).toHaveClass('MuiPaper-elevation0');
  });

  it('lets a caller override position, colour and elevation', () => {
    render(
      <AppBar position="static" color="primary" elevation={4}>
        Top
      </AppBar>,
    );
    const bar = screen.getByText('Top');
    expect(bar).toHaveClass('MuiAppBar-positionStatic', 'MuiAppBar-colorPrimary');
    expect(bar).toHaveClass('MuiPaper-elevation4');
    expect(bar).not.toHaveClass('MuiAppBar-positionFixed');
  });
});

describe('Button', () => {
  it('renders a real button that forwards its ref and click handler', () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(
      <Button ref={ref} variant="contained" onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBe(ref.current);
    expect(button).toHaveClass('MuiButton-contained');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('becomes an external link when given href, target and rel', () => {
    render(
      <Button href="https://example.com/docs" target="_blank" rel="noopener noreferrer">
        Docs
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Docs' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders through a router link component with its `to`', () => {
    function RouterLink({ to, children, ...rest }: Readonly<{ to: string } & ComponentProps<'a'>>) {
      return (
        <a href={`#${to}`} {...rest}>
          {children}
        </a>
      );
    }
    render(
      <Button component={RouterLink} to="/settings">
        Settings
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '#/settings');
  });

  it('does not fire when disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Off' });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('forwards its accessible name, ref and handler', () => {
    const ref = createRef<HTMLButtonElement>();
    const onClick = vi.fn();
    render(
      <IconButton ref={ref} aria-label="Close" onClick={onClick}>
        x
      </IconButton>,
    );
    const button = screen.getByRole('button', { name: 'Close' });
    expect(button).toBe(ref.current);
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('TextField', () => {
  it('labels its input and reports changes', () => {
    const ref = createRef<HTMLDivElement>();
    const onChange = vi.fn();
    render(<TextField ref={ref} label="Email" helperText="Work address" onChange={onChange} />);
    const input = screen.getByLabelText('Email');
    expect(ref.current).toHaveClass('MuiTextField-root');
    expect(screen.getByText('Work address')).toBeInTheDocument();
    fireEvent.change(input, { target: { value: 'a@b.co' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(input).toHaveValue('a@b.co');
  });
});

describe('Drawer', () => {
  it('shows its content only while open and reports a backdrop close', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Drawer open={false} onClose={onClose}>
        Menu
      </Drawer>,
    );
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();
    rerender(
      <Drawer open onClose={onClose}>
        Menu
      </Drawer>,
    );
    expect(screen.getByText('Menu')).toBeInTheDocument();
    fireEvent.keyDown(screen.getByText('Menu'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('forwards its ref to the root of a permanent drawer', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Drawer ref={ref} variant="permanent">
        Nav
      </Drawer>,
    );
    expect(ref.current).toHaveClass('MuiDrawer-root');
    expect(ref.current).toContainElement(screen.getByText('Nav'));
  });
});
