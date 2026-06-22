import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/insert-stock'
      },
      {
        path: 'insert-stock',
        component: () => import('../pages/InsertStock.vue')
      },
      {
        path: 'register-stock',
        component: () => import('../pages/RegisterStock.vue')
      },
      {
        path: 'stock-list',
        name: 'stock-list',
        component: () => import('../pages/StockList.vue')
      },
      {
        path: 'stock/:id',
        name: 'stock-detail',
        component: () => import('../pages/StockDetailPage.vue')
      },
      {
        path: 'scan-barcode',
        component: () => import('../pages/ScanBarcode.vue')
      }
    ]
  },
  {
    path: '/login',
    component: () => import('../pages/LoginPage.vue')
  },
  {
    path: '/auth/callback',
    component: () => import('../pages/OAuthCallback.vue')
  },
  // Catch-all route for 404
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue')
  }
]

export default routes
