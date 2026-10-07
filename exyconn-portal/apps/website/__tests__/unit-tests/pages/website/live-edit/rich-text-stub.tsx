/** The RhfRichText props the article body field hands over. */
interface RichTextStubProps {
  name: string;
  label: string;
  folder: string;
  placeholder: string;
  minHeight: number;
  helperText: string;
}

/**
 * Stands in for the shell's RhfRichText (TipTap needs a real layout engine): a labelled
 * region that lists the props the field was given, so a test can read them.
 */
export function RhfRichTextStub(props: Readonly<RichTextStubProps>) {
  return (
    <section aria-label={props.label}>
      <p>{`field: ${props.name}`}</p>
      <p>{`folder: ${props.folder}`}</p>
      <p>{`placeholder: ${props.placeholder}`}</p>
      <p>{`min height: ${props.minHeight}`}</p>
      <p>{props.helperText}</p>
    </section>
  );
}
