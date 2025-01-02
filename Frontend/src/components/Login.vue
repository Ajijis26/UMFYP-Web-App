<template>
    <div class="login-container">
      <div class="login">
        <h1>User Login</h1>
        <form @submit.prevent="login">
          <!-- Username Input-->
          <div class="inputbox">
            <input
              type="text"
              placeholder="Username"
              v-model="username"
              id="username"
              required
              autofocus
              @input="clearError"
            />
          </div>

          <!-- Password Input -->
          <div class="inputbox">
            <input
              :type="showPassword ? 'text' : 'password'"
              placeholder="Password"
              v-model="password"
              id="password"
              required
              autocomplete="off"
              @input="clearError"
            />
          </div>

          <!-- Show Password Checkbox -->
          <div class="checkbox-container show-password">
            <label>
              <input type="checkbox" v-model="showPassword" />
              <span>Show Password</span>
            </label>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="checkbox-container remember-me">
            <label>
              <input type="checkbox" v-model="rememberMe" />
              <span>Remember Me</span>
            </label>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="btn" :disabled="isLoading">
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>

        </form>
        <p v-if="error" class="error-banner">{{ error }}</p>
      </div>
    </div>
  </template>
  
<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
  data() {
    return {
      username: '',
      password: '',
      showPassword: false,
      rememberMe: false,
      isLoading: false,
      error: '',
    };
  },
  methods: {
    clearError() {
      this.error = ""; // Clear the error message
    },
    
    async login() {
      this.error = "";
      this.isLoading = true;

      try {
        const response = await axios.post('http://localhost:3000/api/login', {
          username: this.username,
          password: this.password,
        });

        if (response.status === 200) {
          const { token } = response.data;
          const decoded = jwtDecode(token);

          console.log("Login successful:", decoded); // Log success

          localStorage.setItem("token", token);
          console.log("Token stored:", token);
          localStorage.setItem("userName", decoded.fullname); // Save user name
          localStorage.setItem("userRole", decoded.role); // Save user role

          if (this.rememberMe) {
            localStorage.setItem("rememberedUsername", this.username);
          }

          if (decoded.role === "Admin" || decoded.role === "Guest") {
            this.$router.push(this.$route.query.redirect || "/dashboard");
          } else {
            alert("Invalid Account. Please try log in again.");
            localStorage.removeItem("token");
            this.$router.push("/");
          }
        } else {
          // Handle unexpected status codes
          this.error = "Unexpected server response. Please try again.";
          this.username = ""; 
          this.password = "";
      }
      } catch (err) {
        this.error = err.response?.data?.error || "Invalid username or password";
        this.username = "";
        this.password = "";
        console.error("Login error:", err.response || err);
      } finally {
        this.isLoading = false; // End loading
      }
    },
  },
};
</script>

<style scoped>
/* Centering the login-container */

.login-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 75vh;
}

.login {
    max-width: 500px;
    width: 100%;
    margin: auto;
    padding: 2em;
    border-radius: 16px;
    background-color: #f9f9f9;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.login h1 {
    font-size: 40px;
    text-align: center;
    margin-bottom: 1em;
    font-weight: bold;
}

/* Styling for Input Fields */
.login .inputbox {
    margin-bottom: 1em;
}

.login input[type="text"],
.login input[type="password"] {
    width: 100%;
    height: 45px;
    padding: 1em;
    border: 1px solid darkgrey;
    border-radius: 40px;
    font-size: 1.2rem;
    transition: all 0.3s ease;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.1);
}

.login input[type="text"]::placeholder,
.login input[type="password"]::placeholder {
    color: grey;
    font-size: 1.2rem;
}

.login input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow:0px 0 5px royalblue; /* Glow effect on focus */
  background-color: #f9f9ff; /* Slight background color change */
}

/* Checkbox Styling */
.checkbox-container {
  margin-bottom: 0.5em;
}

.checkbox-container label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.show-password label:hover span{
  color: #ff0000; /* Highlight text on hover */
  transition: color 0.3s ease; /* Smooth transition effect */
}

.remember-me label:hover span{
  color: gray; /* Highlight text on hover */
  transition: color 0.3s ease; /* Smooth transition effect */
}

.checkbox-container input[type="checkbox"] {
  width: 15px;
  height: 15px;
  margin-right: 8px;
  appearance: none; /* Remove default checkbox */
  background-color: white;
  border: 2px solid #000000;
  border-radius: 4px;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.show-password input[type="checkbox"]:hover {
  background-color: #e6f7ff; /* Light blue background */
  border-color: #ff0000; /* Blue border on hover */
  transform: scale(1.1); /* Slight zoom for better feedback */
  transition: all 0.3s ease; /* Smooth transition effect */
}

.remember-me input[type="checkbox"]:hover {
  background-color: #e6f7ff; /* Light blue background */
  border-color: gray; /* Blue border on hover */
  transform: scale(1.1); /* Slight zoom for better feedback */
  transition: all 0.3s ease; /* Smooth transition effect */
}

.show-password input[type="checkbox"]:checked {
  background-color: #ff0000;
  transform: scale(1.1); /* Slight zoom when checked */
  border-color: #000000; /* Darker border when checked */
}

.remember-me input[type="checkbox"]:checked {
  background-color: grey;
  transform: scale(1.1); /* Slight zoom when checked */
  border-color: #000000; /* Darker border when checked */
}

.checkbox-container span {
  font-size: 0.8rem;
  color: black;
}

.show-password input[type="checkbox"]:checked + span {
  color: red; /* Changes the label text color when checked */
  font-weight: bold; /* Optional: bold the label text */
}

/* Specific Styling for "Remember Me" Checkbox */
.remember-me input[type="checkbox"]:checked + span {
  color: rgb(0, 0, 0); /* Changes the label text color when checked */
  font-weight: bold; /* Optional: bold the label text */
}

/* Styling for Submit Button */
.login button[type="submit"] {
    width: 50%;
    padding: 0.5em;
    background-color: #007bff;
    font-size: 1.2rem;
    text-transform: uppercase;
    color: #fff;
    border: none;
    border-radius: 40px;
    cursor: pointer;
    margin: 1rem auto; /* Center the button and add space above */
    display: block; /* Ensure margin auto works for centering */
    text-align: center;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

/* Hover Styles for Submit Button */
.login button[type="submit"]:hover {
    background-color: #0056b3;
    transform: scale(1.05);
}

/* Styling for Error Message */
.error-banner {
  background-color: #ffdddd; /* Light red background */
  color: red;
  padding: 10px;
  border-radius: 5px;
  margin-top: 1em;
  text-align: center;
  font-size: 1rem;
  border: 1px solid red;
}


@media (max-width: 600px) {
  .login h1 {
    font-size: 1.5rem; /* Reduce font size for smaller screens */
  }
  .login button {
    width: 100%; /* Full-width button for small screens */
  }
}
</style>
