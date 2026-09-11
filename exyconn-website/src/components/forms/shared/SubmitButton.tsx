interface SubmitButtonProps {
  isSubmitting: boolean;
  className: string;
  label: string;
  /** Shown with a spinner while the form is being sent. */
  busyLabel: string;
}

/** A form's send button; it locks while a send is in flight. */
export function SubmitButton({
  isSubmitting,
  className,
  label,
  busyLabel,
}: Readonly<SubmitButtonProps>) {
  return (
    <button type="submit" disabled={isSubmitting} className={className}>
      {isSubmitting ? (
        <>
          <i className="fa-solid fa-spinner fa-spin"></i>
          {busyLabel}
        </>
      ) : (
        <>
          {label}
          <i className="fa-solid fa-paper-plane"></i>
        </>
      )}
    </button>
  );
}
