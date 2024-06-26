import Home from '@/views/Home.vue'

const routes: Routes[] = [
  {
    path: '/',
    redirect: '/recent_connections',
    name: 'Home',
    component: Home,
    children: [
      { path: '/recent_connections', name: 'Connections', component: () => import('@/views/connections/index.vue') },
      {
        path: '/recent_connections/:id',
        name: 'ConnectionDetails',
        component: () => import('@/views/connections/index.vue'),
      },
      { path: '/settings', name: 'Settings', component: () => import('@/views/settings/index.vue') },
      { path: '/about', name: 'About', component: () => import('@/views/about/index.vue') },
      { path: '/script', name: 'Script', component: () => import('@/views/script/index.vue') },
      { path: '/log', name: 'Log', component: () => import('@/views/log/index.vue') },
      { path: '/new_window/:id', name: 'newWindow', component: () => import('@/views/window/Window.vue') },
      { path: '/help', name: 'Help', component: () => import('@/views/help/index.vue') },
      { path: '/test_plan', name: 'TestPlan', component: () => import('@/views/testplan/index.vue') },
    ],
  },
]

export default routes
