<script setup>
import { ref, computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import LoginHeader from './components/LoginHeader.vue';
import GeneralHeader from './components/GeneralHeader.vue';

const route = useRoute();
const isLoginPage = computed(() => route.path === '/' || route.path === '/register');

// User data (retrieved after login or updated dynamically)
const userName = ref('');
const userRole = ref('');

// Provide user data globally
provide('userName', userName);
provide('userRole', userRole);

// Simulated login function
const handleLogin = (name, role) => {
  userName.value = name;
  userRole.value = role;
};

// Update user details dynamically (from MyAccount.vue)
const updateUserDetails = (updatedUser) => {
  if (updatedUser.full_name) userName.value = updatedUser.full_name;
  if (updatedUser.role) userRole.value = updatedUser.role;
};
</script>

<template>
  <header v-if="isLoginPage">
    <LoginHeader @login="handleLogin" />
  </header>
  <header v-else>
    <GeneralHeader :userName="userName" :userRole="userRole" />
  </header>

  <main>
    <router-view @userUpdated="updateUserDetails" />
  </main>

</template>


<style scoped>
main {
  padding: 1em;
}
</style>
