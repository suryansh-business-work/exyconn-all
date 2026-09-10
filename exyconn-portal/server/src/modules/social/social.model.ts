import { Schema, model, type InferSchemaType, type Model } from 'mongoose';

/**
 * The internal social feed: what employees post to each other, and the reactions to it.
 *
 * Three collections rather than one document with nested arrays. A popular post gathers
 * likes and comments indefinitely, and a growing subdocument array is the one shape
 * MongoDB handles badly — it rewrites the whole document on every reaction and eventually
 * meets the 16 MB ceiling.
 */

const postSchema = new Schema(
  {
    authorId: { type: String, required: true, index: true },
    /**
     * Not required, because a share with nothing added to it is a real thing to post —
     * "look at this" is the whole message. An original post with an empty body is not,
     * and the service refuses one before it gets here.
     */
    body: { type: String, default: '', trim: true, maxlength: 5000 },
    /** One optional image, uploaded through the same ImageKit path as every other upload. */
    imageUrl: { type: String, default: '', trim: true },
    /**
     * The post this one shares, when it is a share. The original is never copied: it can
     * be edited or deleted afterwards, and a share showing text its author has since
     * taken down is how an internal feed becomes a liability.
     */
    sharedFromId: { type: String, default: null, index: true },
    /**
     * Reaction totals, kept beside the post rather than counted per read.
     *
     * A feed page shows twenty posts, and counting likes and comments for each would be
     * forty extra queries to render one screen. They are only ever moved by `$inc` next
     * to the write that caused them, so they cannot drift by a lost read-modify-write.
     */
    likeCount: { type: Number, required: true, default: 0, min: 0 },
    commentCount: { type: Number, required: true, default: 0, min: 0 },
    shareCount: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

// The feed and a profile both read newest-first, one over everybody and one over a person.
postSchema.index({ createdAt: -1 });
postSchema.index({ authorId: 1, createdAt: -1 });

const commentSchema = new Schema(
  {
    postId: { type: String, required: true, index: true },
    authorId: { type: String, required: true, index: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, createdAt: 1 });

const likeSchema = new Schema(
  {
    postId: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

/**
 * One like per person per post, enforced by the database rather than by a read-then-write.
 * Two taps racing each other would both find no like and both insert one; the unique index
 * makes the loser fail instead, and the counter stays honest.
 */
likeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export type SocialPostDocument = InferSchemaType<typeof postSchema>;
export type SocialCommentDocument = InferSchemaType<typeof commentSchema>;
export type SocialLikeDocument = InferSchemaType<typeof likeSchema>;

export const SocialPostModel: Model<SocialPostDocument> = model<SocialPostDocument>(
  'SocialPost',
  postSchema,
);
export const SocialCommentModel: Model<SocialCommentDocument> = model<SocialCommentDocument>(
  'SocialComment',
  commentSchema,
);
export const SocialLikeModel: Model<SocialLikeDocument> = model<SocialLikeDocument>(
  'SocialLike',
  likeSchema,
);
