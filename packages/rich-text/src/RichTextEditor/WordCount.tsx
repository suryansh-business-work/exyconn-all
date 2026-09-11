import { useEditorState } from '@tiptap/react';
import type { Editor } from '@tiptap/core';
import { Text } from '@exyconn/ui';

interface WordCountProps {
  editor: Editor;
}

/** Live word and character count, from the CharacterCount extension's storage. */
export function WordCount({ editor }: Readonly<WordCountProps>) {
  const { words, characters } = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      words: instance.storage.characterCount.words(),
      characters: instance.storage.characterCount.characters(),
    }),
  });

  return (
    <Text size="caption" color="text.secondary" aria-live="polite">
      {words} {words === 1 ? 'word' : 'words'} · {characters}{' '}
      {characters === 1 ? 'character' : 'characters'}
    </Text>
  );
}
