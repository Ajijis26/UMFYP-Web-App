<template>
  <header class="general-header">
    <img class="logo" src="/src/assets/Logo UM.png" alt="Logo" />
    <h1 class="header-title">IDS Web Application</h1>
    <nav class="header-nav">
      <button class="header-button" @click="goToDashboard">Dashboard</button>
      <button class="header-button" @click="goToAlertDetails">IDS Alert</button>
      <button class="header-button" @click="goToLogsDetails">IDS Logs</button>
    </nav>
    <nav class="header-nav2">
      <div class="dropdown" @mouseover="showDropdown = true" @mouseleave="hideDropdownWithDelay">
        <button class="header-button">Account</button>
        <ul v-if="showDropdown" class="dropdown-menu">
          <li><span class="user-info">{{ userName }}</span></li>
          <li><span class="user-role"> (Role : {{ userRole }})</span></li>
          <li><button @click="goToAccount"><box-icon type="solid" name="user" color="#000000"></box-icon> My Account</button></li>
          <li v-if="isAdmin"><button @click="registerUser"><box-icon name='user-plus' type='solid' color="#000000"></box-icon>Register User</button></li>
          <li v-if="isAdmin"><button @click="manageUsers"><box-icon name='user-detail' type='solid' color="#000000"></box-icon>Manage Users</button></li>
          <li><button @click="logout"><box-icon name='log-out-circle' color="#000000"></box-icon>Logout</button></li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'vue-router';

const router = useRouter();
const showDropdown = ref(false);
const userName = ref("");
const userRole = ref("");

// Listen for changes to user data (via App.vue)
const updateUserDetails = (updatedUser) => {
  userName.value = updatedUser.full_name || userName.value;
  userRole.value = updatedUser.role || userRole.value;
};

// Fetch token and decode user details on mount
const fetchUserDetails = () => {
  const token = localStorage.getItem("token");
  if (token) {
    const decoded = jwtDecode(token);
    userName.value = decoded.full_name || "Error";
    userRole.value = decoded.role || "Error";
  }
};

onMounted(fetchUserDetails);


const isAdmin = computed(() => userRole.value === 'Admin');

const goToDashboard = () => router.push('/dashboard');
const goToAlertDetails = () => router.push('/alertdetails');
const goToLogsDetails = () => router.push('/logsdetails');
const goToAccount = () => router.push('/myaccount');
const registerUser = () => router.push('/registeruser');
const manageUsers = () => router.push('/manageuser');
const logout = () => {
  localStorage.removeItem('token'); // Remove the token
  router.push('/'); // Redirect to login
};

// Hide dropdown with a delay
const hideDropdownWithDelay = () => {
  setTimeout(() => {
    showDropdown.value = false;
  }, 200); // 200ms delay for smoother UX
};
</script>


<style scoped>
.general-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensure the logo stays on the left and buttons align properly */
  padding: 0.5em;
  background-color: #000000; /* Header background color */
  color: #ffffff; /* Text color */
  font-size: 14px;
  font-weight: bold;
  border-top: 3px solid #000080;
  border-bottom: 1px solid #FFE140;
  margin-bottom: 0em;
  height: 60px;
}

.logo {
  width: 55px;
  height: 55px;
  margin-right: 10px;
}

.header-title {
  margin-left: 10px; /* Adjust space between logo and title */
  margin-right: auto; /* Push the title to the left */
  transition: opacity 0.3s ease; /* Smooth transition for opacity */
  font-size: 30px;
}

.header-nav {
  display: flex;
  justify-content: space-evenly; /* Evenly space buttons */
  flex-grow: 1; /* Take up remaining space */
  /*margin-right: auto;  Push the second nav to the far right */
}

.header-nav2 {
  display: flex;
  justify-content: flex-end; /* Align account button to the right */
}

.header-button {
  background-color: transparent;
  color: #fff;
  font-size: 18px;
  border: none;
  border-radius: 25px;
  padding: 0.5em 1em;
  cursor: pointer;
}

.header-button:hover {
  background-color: #3f3f3f;
}

/* Dropdown styles */
.dropdown {
  position: relative;
  display: inline-block;
}

.dropdown-menu {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  position: absolute;
  top: 100%;
  right: 0;
  border: 1px solid #000000;
  padding: 10px;
  border-radius: 5px;
  z-index: 10;
  max-width: 160px; /* Ensure minimum width for dropdown */
  margin-top: 0; /* Remove any margin that creates space */
  list-style: none; /* Remove bullet points */
  padding-left: 0; /* Remove left padding */
  padding-right: 0; /* Remove left padding */
}

.dropdown-menu li {
  margin: 0px 0;
}

/* User info styling */
.user-info {
  color: rgb(0, 0, 0); /* Change this to the desired color */
  font-size: 14px;
  font-weight: bold; /* Make the text bold */
  margin-bottom: 0px; /* Adds some space between the name and the buttons below */
  display: block; /* Ensures it's treated as a block element */
  text-align: left  ;
  padding-left: 10px; /* Adjust the value as needed for space */
}

.user-role {
  color: darkred; /* Change this to the desired color */
  font-size: 10px;
  font-weight: bold; /* Make the text bold */
  margin-top: 0%;
  margin-bottom: 15px; /* Adds some space between the name and the buttons below */
  display: block; /* Ensures it's treated as a block element */
  text-align: left;
  padding-left: 10px;  /* Adjust the value as needed for space */
}

.dropdown-menu button {
  background-color: transparent;
  border: none;
  cursor: pointer;
  margin-left: 2px;
  margin-right: 2px;
  display: flex;
  align-items: center;
  color: #000000;
  font-size: 14px;
  font-weight: bold;
  border-radius: 10px;
  padding: 1em 1em;
  width: 150px;
  text-align: right;
  justify-content: flex-start;
}

.dropdown-menu li:last-child {
  display: flex;
  justify-content: flex-end; /* Aligns the content to the right */
}

.dropdown-menu button:last-child {
  margin-bottom: 0; /* Removes margin after the last button */
}

.dropdown-menu button box-icon {
  margin-right: 8px; /* Add space between icon and text */
}

.dropdown-menu button:hover {
  background-color: #6B6B6B;
}

/* Media query to hide the header title on smaller screens */
@media (max-width: 600px) {
  .header-title {
    opacity: 0;
    pointer-events: none;
    visibility: hidden; /* Ensure it doesn't take up space */
    width: 0; /* Collapse the width to prevent it from taking space */
    margin: 0; /* Remove margin when hidden */
  }

  .logo {
    margin-right: 10px;
  }
}
</style>
