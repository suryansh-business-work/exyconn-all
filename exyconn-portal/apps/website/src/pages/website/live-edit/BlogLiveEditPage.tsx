import { useParams } from 'react-router-dom';
import { useGetBlogPostQuery, useUpdateBlogPostMutation } from '@exyconn/shell/graphql/generated';
import type { LiveDesign } from '@exyconn/live-editor';
import { LiveEditScreen } from './LiveEditScreen';
import { RecordState } from './RecordState';
import { MEDIA_FOLDERS, siteUrl } from './live-edit.config';

/** Live-edits a blog post's body at /website/blog/:id/live-edit. */
export function BlogLiveEditPage() {
  const { id = '' } = useParams();
  const { data, loading, error } = useGetBlogPostQuery({
    variables: { id },
    skip: id === '',
    fetchPolicy: 'network-only',
  });
  const [updateBlogPost] = useUpdateBlogPostMutation();
  const post = data?.getBlogPost;

  if (!post) {
    return <RecordState loading={loading} error={error} label="blog post" />;
  }

  // Only the body changes; the required identity fields ride along unchanged.
  const save = (design: LiveDesign) =>
    updateBlogPost({
      variables: {
        id: post.id,
        input: {
          slug: post.slug,
          title: post.title,
          author: {
            name: post.author.name,
            role: post.author.role,
            initials: post.author.initials,
          },
          content: design.html,
          contentCss: design.css,
        },
      },
    });

  return (
    <LiveEditScreen
      key={post.id}
      title={post.title}
      pageUrl={siteUrl(`/blog/${post.slug}`)}
      backPath="/website/blog"
      folder={MEDIA_FOLDERS.blog}
      initial={{ html: post.content, css: post.contentCss }}
      onSave={save}
    />
  );
}
