<template>
  <div>
    <!-- Show the appropriate header based on the route -->
    <header v-if="isLoginPage">
      <LoginHeader />
    </header>
    <header v-else>
      <GeneralHeader :userName="userName" :userRole="userRole" />
    </header>

    <!-- Main Content -->
    <main>
      <router-view @userUpdated="updateUserDetails" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import LoginHeader from './components/LoginHeader.vue';
import GeneralHeader from './components/GeneralHeader.vue';
import { jwtDecode } from 'jwt-decode';

const route = useRoute();
const isLoginPage = computed(() => route.path === '/');

const userName = ref('');
const userRole = ref('');

// Method to dynamically update user details
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

// Fetch token and set user details on page load
const fetchUserDetailsFromToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userName.value = decoded.fullname || 'Unknown User';
      userRole.value = decoded.role || 'Unknown Role';

      // Update localStorage to ensure persistence
      localStorage.setItem('userName', decoded.fullname);
      localStorage.setItem('userRole', decoded.role);
    } catch (error) {
      console.error('Error decoding token:', error);
      userName.value = 'Error';
      userRole.value = 'Error';
    }
  }
};

onMounted(fetchUserDetailsFromToken);

// Watch localStorage for changes and reflect them in the state
watch(
  () => [localStorage.getItem('userName'), localStorage.getItem('userRole')],
  ([newUserName, newUserRole]) => {
    if (newUserName) userName.value = newUserName;
    if (newUserRole) userRole.value = newUserRole;
  }
);
</script>


<style scoped>
main {
  padding: 1em;
}
</style>
