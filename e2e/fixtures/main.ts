import { createApp } from 'vue';
import PostCount from './src/components/PostCount.vue';
import { GetPostsDocument } from './src/posts.graphql';

console.log(GetPostsDocument.definitions.length);
createApp(PostCount).mount('#app');
