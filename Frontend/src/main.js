// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';  // Import Pinia
import App from './App.vue';
import router from './router';
import './assets/main.css'; // Import the global CSS file




//import './assets/main.css'; // Import global CSS here

const app = createApp(App);

// Create a Pinia instance and use it in the app
const pinia = createPinia();

app.use(router);
app.use(pinia);  // Use Pinia
app.mount('#app');
