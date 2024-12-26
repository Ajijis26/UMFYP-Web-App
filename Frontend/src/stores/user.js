import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const userName = ref('');
  const userRole = ref('');

  const setUser = (username, role) => {
    userName.value = username;
    userRole.value = role;
  };

  return { userName, userRole, setUser };
});
