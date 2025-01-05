<template>
  <header class="general-header">
    <img class="logo" src="/src/assets/Logo UM.png" alt="Logo" />
    <h1 class="header-title">IDS Web Application</h1>
    
    <!-- Hamburger Menu -->
    <button class="hamburger-menu" @click="toggleMenu">
      <span></span>
      <span></span>
      <span></span>
    </button>

    <!-- Main Navigation -->
    <nav class="header-nav">
      <button class="header-button" :class="{ active: isActive('/dashboard') }" @click="goToDashboard">Dashboard</button>
      <button class="header-button" :class="{ active: isActive('/alertdetails') }" @click="goToAlertDetails">IDS Alert</button>
      <button class="header-button" :class="{ active: isActive('/logsdetails') }" @click="goToLogsDetails">IDS Logs</button>
    </nav>

    <!-- Mobile Navigation -->
    <nav :class="['mobile-nav', { 'show-mobile-nav': isMenuOpen }]">
      <button class="header-button" :class="{ active: isActive('/dashboard') }" @click="goToDashboard">Dashboard</button>
      <button class="header-button" :class="{ active: isActive('/alertdetails') }" @click="goToAlertDetails">IDS Alert</button>
      <button class="header-button" :class="{ active: isActive('/logsdetails') }" @click="goToLogsDetails">IDS Logs</button>
    </nav>

    <!-- User Avatar and Dropdown -->
    <nav class="header-nav2">
      <div class="dropdown">
        <button class="header-button" @click="toggleDropdown">
          <img :src="userAvatar" alt="User Avatar" class="user-avatar" />
          Account
        </button>
        <ul :class="['dropdown-menu', { show: showDropdown }]">
          <li><span class="user-info">{{ userName }}</span></li>
          <li><span class="user-role"> (Role : {{ userRole }})</span></li>
          <li><button @click="goToAccount"><i class="bi bi-person"></i>My Account</button></li>
          <li v-if="isAdmin"><button @click="registerUser"><i class="bi bi-person-plus"></i>Register User</button></li>
          <li v-if="isAdmin"><button @click="manageUsers"><i class="bi bi-tools"></i>Manage Users</button></li>
          <li><button @click="logout"><i class="bi bi-box-arrow-right"></i>Logout</button></li>
        </ul>
      </div>
    </nav>

    <!-- Loading Spinner -->
    <div v-if="isLoggingOut" class="loading-spinner-overlay">
      <div class="spinner"></div>
      <p class="logging-out-text">Logging Out</p>
    </div>

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch  } from "vue";
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'vue-router';

const router = useRouter();
const props = defineProps({
  userName: {
    type: String,
    required: true,
  },
  userRole: {
    type: String,
    required: true,
  },
});

const showDropdown = ref(false);
const isMenuOpen = ref(false);
const isLoggingOut = ref(false);
const isActive = (route) => router.currentRoute.value.path === route;
const isAdmin = computed(() => userRole.value === 'Admin');


const userName = ref(props.userName);
const userRole = ref(props.userRole);

// Watch for prop changes and update local state
watch(() => props.userName, (newVal) => {
  userName.value = newVal;
});

watch(() => props.userRole, (newVal) => {
  console.log("User role updated to:", newVal); // Debugging
  userRole.value = newVal;
});

const userAvatar = computed(() => {
  if (userName.value) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.value)}&background=random&color=fff&size=128`;
  }
  return '/src/assets/default-avatar.png'; // Fallback avatar
});

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value;
};

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
  const hamburger = document.querySelector('.hamburger-menu');
  if (hamburger) {
    hamburger.classList.toggle('open', isMenuOpen.value);
  }
  if (showDropdown.value) {
    showDropdown.value = false; // Close the dropdown when opening the mobile menu
  }
};


const goToDashboard = () => router.push('/dashboard');
const goToAlertDetails = () => router.push('/alertdetails');
const goToLogsDetails = () => router.push('/logsdetails');
const goToAccount = () => router.push('/myaccount');
const registerUser = () => router.push('/registeruser');
const manageUsers = () => router.push('/manageuser');

const logout = () => {
  showDropdown.value = false;
  isLoggingOut.value = true;
  setTimeout(() => {
    localStorage.clear();
    router.push('/');
    isLoggingOut.value = false;
  }, 1000);
};

// Fetch token and decode user details on mount
const fetchUserDetails = () => {
  const token = localStorage.getItem("token");
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userName.value = decoded.fullname || "Unknown User";
      userRole.value = decoded.role || "Unknown Role";
    } catch (error) {
      console.error("Error decoding token:", error);
      userName.value = "Error";
      userRole.value = "Error";
    }
  }
};

// Handle click outside the dropdown
const handleOutsideClick = (event) => {
  const dropdownElement = document.querySelector('.dropdown');
  if (dropdownElement && !dropdownElement.contains(event.target)) {
    showDropdown.value = false;
  }
};


onMounted(() => {
  fetchUserDetails();
  document.addEventListener("click", handleOutsideClick);
});

onUnmounted(() => {
  document.removeEventListener("click", handleOutsideClick);
});
</script>


<style scoped>
.general-header {
  display: flex;
  align-items: center;
  justify-content: space-between; /* Ensure the logo stays on the left and buttons align properly */
  padding: 0.5em 1em;
  background-color: #000000; /* Header background color */
  color: #ffffff; /* Text color */
  font-size: 14px;
  font-weight: bold;
  border-top: 3px solid #000080;
  border-bottom: 1px solid #FFE140;
  height: 100%;
}

.logo {
  width: 55px;
  height: 55px;
  margin-right: 10px;
}

.header-title {
  margin-left: 10px; /* Adjust space between logo and title */
  margin-right: auto; /* Push the title to the left */
  white-space: nowrap;
  font-size: 30px;
  overflow: hidden;
  text-overflow: hidden;
  transition: opacity 0.3s ease; /* Smooth transition for opacity */
}

/* Hamburger Menu */
.hamburger-menu {
  display: none;
  flex-direction: column;
  justify-content: space-between; /* Center items vertically */
  align-items: center; /* Center items horizontally */
  width: 40px; /* Adjusted width for better appearance */
  height: 30px; /* Adjusted height for better appearance */
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1000;
  transition: all 0.3s ease;
}

.hamburger-menu span {
  display: block;
  height: 4px;
  width: 100%; /* Make the spans slightly shorter for better visual effect */
  background-color: #ffffff; /* White hamburger icon */
  border-radius: 2px;
  margin: 3px 0; /* Add margin for spacing */
  transition: all 0.3s ease;
}

.hamburger-menu.open span:nth-child(1) {
  transform: translateY(9px) rotate(45deg);
}

.hamburger-menu.open span:nth-child(2) {
  opacity: 0;
}

.hamburger-menu.open span:nth-child(3) {
  transform: translateY(-9px) rotate(-45deg);
}

/* Navigation */
.header-nav {
  display: flex;
  justify-content: space-evenly; /* Evenly space buttons */
  flex-grow: 1; 
}

.header-nav2 {
  display: flex;
  align-items: center;
  justify-content: flex-end; /* Align account button to the right */  
}

.header-button img.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin: 0; /* Remove unnecessary margins */
  object-fit: cover;
  border: 2px solid rgb(255, 255, 255);
  display: inline-block;
}

.header-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: transparent;
  color: #fff;
  font-size: 1.2rem;
  border: none;
  border-radius: 10px;
  padding: 0.8em 1em;
  cursor: pointer;
}

.header-button.active {
  background-color: #3f3f3f; /* Active background color */
  color: #ffffff; /* White text */
  font-weight: bold;
}

.header-button:hover {
  background-color: gray;
  transform: scale(1.1); /* Slight zoom for better feedback */
  transition: all 0.3s ease;
}

.mobile-nav {
  display: none;
  flex-direction: column;
  align-items: center; /* Center items horizontally */
  justify-content: center;
  background-color: #000000;
  border-radius: 10px;
  padding-bottom: 10px;
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  z-index: 1000;
  transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
  transform: translateY(-100%);
  opacity: 0;
}

.mobile-nav.show-mobile-nav {
  display: flex;
  transform: translateY(0);
  opacity: 1;
}

.mobile-nav .header-button {
  width: 90%;
  text-align: center;
  justify-content: center; /* Align text within the button */
  align-items: center;
  padding: 12px 20px;
  color: #ffffff;
  background: #3f3f3f;
  border: none;
  font-size: 16px;
  border-radius: 8px; /* Rounded corners */
  margin-bottom: 10px; /* Space between buttons */
  display: flex;
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.mobile-nav .header-button:hover {
  background-color: #3f3f3f; /* Highlight button on hover */
  color: #ffffff;
  transform: scale(1.05);
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
  padding: 10px 0;
  border-radius: 8px;
  z-index: 2000;
  min-width: 150px; /* Ensure minimum width for dropdown */
  list-style: none; /* Remove bullet points */
  opacity: 0; /* Initially hidden */
  transform: translateY(-10px); /* Move up initially */
  transition: opacity 0.3s ease, transform 0.3s ease; /* Smooth fade and slide */
  pointer-events: none; /* Disable interaction when hidden */
  box-shadow: 0px 1px 5px gray;
  
}

.dropdown-menu.show {
  opacity: 1; /* Fully visible */
  transform: translateY(0); /* Slide into place */
  pointer-events: auto; /* Enable interaction */
}

.dropdown-menu li {
  padding: 5px 10px; /* Reduced padding for compact design */
  margin: 0; /* Removed extra margin */
}

/* User info styling */
.user-info {
  color: #333; /* Change this to the desired color */
  font-size: 16px;
  font-weight: bold; /* Make the text bold */
  margin-bottom: 0px; /* Adds some space between the name and the buttons below */
  display: block; /* Ensures it's treated as a block element */
  text-align: left  ;
  padding-left: 10px; /* Adjust the value as needed for space */
}

.user-role {
  font-weight: bold; /* Make the text bold */
  margin-bottom: 15px; /* Adds some space between the name and the buttons below */
  display: block; /* Ensures it's treated as a block element */
  padding-left: 10px;  /* Adjust the value as needed for space */

  color: #d9534f; /* Bootstrap danger red */
  font-size: 12px; /* Smaller font size */
  margin-top: 2px; /* Reduced margin for better spacing */
  text-align: left;
}

.dropdown-menu button {
  display: flex;
  align-items: center; /* Center icon and text vertically */
  gap: 10px; /* Space between icon and text */
  background-color: transparent;
  border: none;
  cursor: pointer;
  color: #000000;
  font-size: 14px;
  font-weight: bold;
  padding: 8px 12px; /* Adjust spacing */
  text-align: left;
  width: 150px; /* Ensure button width matches dropdown */
  border-radius: 20px;
  transition: background-color 0.3s ease;
}

.dropdown-menu li:last-child {
  display: flex;
  justify-content: flex-end; /* Aligns the content to the right */
}

.dropdown-menu button:last-child {
  margin-bottom: 0; /* Removes margin after the last button */
}

.dropdown-menu button:hover {
  background-color: #6B6B6B; /* Light hover background */
  color: white; /* Accent color for hover */
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.loading-spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Semi-transparent background */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999; /* Ensure it appears above everything else */
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid white;
  border-top: 5px solid red;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.logging-out-text {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
  text-align: center;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}


/* Media query for screens smaller than 600px */
@media (max-width: 600px) {
  /* Hide the desktop navigation */
  .header-nav {
    display: none;
  }

  /* Show the hamburger menu */
  .hamburger-menu {
    display: flex;
  }

  .header-title {
    display: none; /* Hide the title for smaller screens */
  }

  .logo {
    display: none; /* Ensure logo aligns to the left */
  }

  .mobile-nav {
    top: 60px; /* Position below the header */
  }
}

</style>
