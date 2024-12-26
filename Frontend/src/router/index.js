//to routes the pages
// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import { jwtDecode } from 'jwt-decode';

const Login = () => import('../components/Login.vue');
const Dashboard = () => import('../components/Dashboard.vue');
const MyAccount = () => import('../components/MyAccount.vue');
const RegisterUser = () => import('../components/RegisterUser.vue');
const ManageUser = () => import('../components/ManageUser.vue');
const LogsDetails = () => import('../components/LogsDetails.vue');
const AlertDetails = () => import('../components/AlertDetails.vue');

const routes = [
  { path: "/", component: Login },
  { path: "/dashboard", component: Dashboard, meta: { requiresAuth: true } },
  { path: "/myaccount", component: MyAccount, meta: { requiresAuth: true } },
  { path: "/registeruser", component: RegisterUser , meta: { requiresAuth: true, requiresAdmin: true } },
  { path: "/manageuser", component: ManageUser, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: "/logsdetails", component: LogsDetails, meta: { requiresAuth: true } },
  { path: "/alertdetails", component: AlertDetails, meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');

  if (to.meta.requiresAuth) {
    if (!token) {
      return next('/');
    }

    try {
      const decoded = jwtDecode(token);
      
      // Check token expiration
      const isTokenExpired = () => {
        const { exp } = decoded;
        return Date.now() >= exp * 1000;
      };

      if (isTokenExpired()) {
        localStorage.removeItem('token');
        return next('/');
      }

      if (to.meta.requiresAdmin && decoded.role !== 'Admin') {
        return next('/dashboard');
      }
    } catch (err) {
      console.error('Invalid token', err);
      localStorage.removeItem('token');
      return next('/');
    }
  }

  next();
});


export default router;


