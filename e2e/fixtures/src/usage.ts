import type { ComputedRef } from 'vue';
import {
  GetPostsDocument,
  useGetPostsQuery,
  useGetPostQuery,
  useGetCountQuery,
  useCreatePostMutation,
  useDeletePostMutation,
} from './posts.graphql';

const { posts } = useGetPostsQuery();
const postsCheck: ComputedRef<{ id: string; title: string }[]> = posts;
const { post } = useGetPostQuery({ id: '1' });
const { count } = useGetCountQuery();
const countCheck: ComputedRef<number | undefined> = count;
const { createPost } = useCreatePostMutation();
const { deletePost } = useDeletePostMutation();

export async function run() {
  const { data: newPost, cache } = await createPost({ input: { title: 'T' } });
  const title: string = newPost.title;
  cache.updateQuery({ query: GetPostsDocument }, (data) => data);
  await deletePost({ id: '1' });
  return [postsCheck, post, countCheck, title];
}
