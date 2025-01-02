// Function : To routes the pages
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

export default router;


