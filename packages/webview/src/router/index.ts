import { createRouter, createWebHashHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Chat',
    component: () => import('../views/ChatView.vue')
  },
  {
    path: '/setting',
    name: 'Setting',
    component: () => import('../views/SettingView.vue')
  },
  {
    path: '/session',
    name: 'Session',
    component: () => import('../views/SessionView.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;