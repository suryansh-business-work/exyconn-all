import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import { Autocomplete, Chip, TextField } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  useCrmTagsQuery,
  useSetCrmTagsMutation,
  type CrmTagObject,
} from '@exyconn/shell/graphql/generated';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;

interface TagsEditorProps {
  object: CrmTagObject;
  id: string;
  tags: readonly string[];
}

/**
 * A record's own tags, edited where they are shown: type a new one and press Enter, or pick one
 * already used on another record. Each change saves at once.
 */
export function TagsEditor({ object, id, tags }: Readonly<TagsEditorProps>) {
  const t = useT();
  const notify = useNotify();
  const [value, setValue] = useState<string[]>([...tags]);
  const { data } = useCrmTagsQuery({ variables: { object } });
  const [save, { loading }] = useSetCrmTagsMutation();

  const change = async (next: string[]) => {
    const cleaned = next.map((tag) => tag.trim()).filter(Boolean);
    if (cleaned.length > MAX_TAGS || cleaned.some((tag) => tag.length > MAX_TAG_LENGTH)) {
      notify(
        t('Use up to {max} tags of at most {length} characters each.', {
          max: MAX_TAGS,
          length: MAX_TAG_LENGTH,
        }),
        'error',
      );
      return;
    }
    const previous = value;
    setValue(cleaned);
    try {
      const result = await save({
        variables: { object, id, tags: cleaned },
        refetchQueries: ['CrmTags'],
      });
      setValue(result.data?.setCrmTags ?? cleaned);
    } catch (error) {
      setValue(previous);
      portalLogger.warn('crm: saving tags failed', error);
      notify(errorMessage(error, 'Could not save the tags'), 'error');
    }
  };

  return (
    <Autocomplete
      multiple
      freeSolo
      size="small"
      options={data?.crmTags ?? []}
      value={value}
      disabled={loading}
      onChange={(_event, next) => {
        change(next).catch((error: unknown) => portalLogger.warn('crm: tags change failed', error));
      }}
      renderValue={(selected, getItemProps) =>
        selected.map((tag, index) => {
          const { key, ...itemProps } = getItemProps({ index });
          return <Chip key={key} size="small" label={tag} {...itemProps} />;
        })
      }
      renderInput={(params) => (
        <TextField
          {...params}
          label={t('Tags')}
          placeholder={value.length === 0 ? t('Add a tag and press Enter') : undefined}
        />
      )}
    />
  );
}
