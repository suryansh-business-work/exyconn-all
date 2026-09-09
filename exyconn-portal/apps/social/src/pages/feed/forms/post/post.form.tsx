import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@exyconn/shell/components/ui';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RhfImageField, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { SocialFeedDocument, useCreateSocialPostMutation } from '@exyconn/shell/graphql/generated';
import { MAX_POST_LENGTH, postSchema, type PostFormValues } from './post.schema';

const EMPTY: PostFormValues = { body: '', imageUrl: '' };

interface PostFormProps {
  /** Called after a post lands, so the page around the composer can react. */
  onPosted?: () => void;
}

/**
 * The composer at the top of the feed — React Hook Form with a Zod schema, like every
 * other form in the portal.
 *
 * It refetches the feed rather than writing the new post into the cache by hand: between
 * posting and the page updating, colleagues will have posted too, and a hand-inserted
 * post would show yours on top of a feed that has quietly gone stale underneath it.
 */
export function PostForm({ onPosted }: Readonly<PostFormProps>) {
  const notify = useNotify();
  const [createPost] = useCreateSocialPostMutation({ refetchQueries: [SocialFeedDocument] });

  const methods = useForm<PostFormValues, unknown, PostFormValues>({
    resolver: zodResolver(postSchema),
    defaultValues: EMPTY,
  });

  const onSubmit = async (values: PostFormValues) => {
    try {
      await createPost({
        variables: { input: { body: values.body, imageUrl: values.imageUrl } },
      });
      methods.reset(EMPTY);
      notify('Posted to the feed');
      onPosted?.();
    } catch (error) {
      notify(errorMessage(error, 'Could not publish that post'), 'error');
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <EntityForm
          methods={methods}
          onSubmit={onSubmit}
          isEdit={false}
          onCancel={() => methods.reset(EMPTY)}
          submitLabel="Post"
        >
          <RhfTextField
            name="body"
            label="Share something with the company"
            multiline
            minRows={3}
            helperText={`Up to ${MAX_POST_LENGTH} characters. Everyone signed in can see this.`}
          />
          <RhfImageField name="imageUrl" label="Photo" folder="social" />
        </EntityForm>
      </CardContent>
    </Card>
  );
}
