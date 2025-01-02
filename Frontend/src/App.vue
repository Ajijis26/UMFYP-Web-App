<template>
  <div>
    <header v-if="isLoginPage">
      <LoginHeader />
    </header>
    <header v-else>
      <GeneralHeader :userName="userName" :userRole="userRole" />
    </header>
    <main>
      <router-view @userUpdated="updateUserDetails" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue';
import { useRoute } from 'vue-router';
import LoginHeader from './components/LoginHeader.vue';
import GeneralHeader from './components/GeneralHeader.vue';

const route = useRoute();
const isLoginPage = computed(() => route.path === '/');

// User data (retrieved after login or updated dynamically)
const userName = ref(localStorage.getItem('userName') || '');
const userRole = ref(localStorage.getItem('userRole') || '');

// Provide user data globally
provide('userName', userName);
provide('userRole', userRole);


// Update user details dynamically (from MyAccount.vue or similar components)
const updateUserDetails = (updatedUser) => {
  if (updatedUser.userName) {
    userName.value = updatedUser.userName;
    localStorage.setItem('userName', updatedUser.userName);
  }
  if (updatedUser.userRole) {
    userRole.value = updatedUser.userRole;
    localStorage.setItem('userRole', updatedUser.userRole);
  }
};
</script>

<style scoped>
main {
  padding: 1em;
}
</style>
