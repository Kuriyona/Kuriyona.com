import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('../views/index.vue')
    },
    {
      path: '/admin',
      component: () => import('../views/admin.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      component: () => import('../views/404.vue')
    }
  ]
});

export default router;
