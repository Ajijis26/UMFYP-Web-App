<template>
    <div class="login-container">|
      <div class="login">
        <h1>User Login</h1>
        <form @submit.prevent="login">
          <div class="inputbox">
            <div class="input-icon">
              <input type="text" placeholder="Username" v-model="username" id="username" required />
              <box-icon name="user" type="solid" class="username-icon"></box-icon>
            </div>
          </div>
          <div class="inputbox">
            <div class="input-icon">
              <input :type="showPassword ? 'text' : 'password'" placeholder="Password" v-model="password" id="password" required />
              <span @mouseover="showPassword = true" @mouseout="showPassword = false">
                <box-icon :name="showPassword ? 'lock-open-alt' : 'lock-alt'" type="solid"></box-icon>
              </span>
            </div>
          </div>
          <div class="remember-forgot">
            <label>
              <input type="checkbox" v-model="rememberMe" /> Remember Me
            </label>
          </div>
          <button type="submit" class="btn">Login</button>
        </form>
        <p v-if="error" class="error-message">{{ error }}</p>
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
      error: '',
    };
  },
  methods: {
    async login() {
      this.error = ""; // Clear any previous error messages

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
          if (this.rememberMe) {
            localStorage.setItem("rememberedUsername", this.username);
          }

          if (decoded.role === "Admin") {
            this.$router.push("/dashboard");
          } else if (decoded.role === "Guest") {
            this.$router.push("/dashboard"); // Adjust the path as needed
          } else {
            this.$router.push("/myaccount");
          }
        } else {
          // Handle unexpected status codes
          this.error = "Unexpected server response. Please try again.";
          console.error("Unexpected response:", response);
      }
      } catch (err) {
        this.error = err.response?.data?.error || "Invalid username or password";
        console.error("Login error:", err.response || err);
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
box-icon {
  display: inline-block !important; /* Ensure it occupies space */
  visibility: visible !important;  /* Ensure it is visible */
  font-size: 24px !important;      /* Set a proper font size */
  color: black !important;         /* Ensure color is visible */
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

.login .input-icon {
    position: relative;
}

.login input[type="text"],
.login input[type="password"] {
    width: calc(100% - 40px);
    height: 25px;
    padding: 1em;
    border: 1px solid darkgrey;
    border-radius: 40px;
    font-size: 1.2rem;
    transition: all 0.3s ease;
}

.login input[type="text"]::placeholder,
.login input[type="password"]::placeholder {
    color: grey;
    font-size: 1.2rem;
}

.login select:focus,
.login input[type="text"]:focus,
.login input[type="password"]:focus {
    outline: none; /* Remove outline on focus */
    border-color: #007bff; /* Changed border color to blue when focused */
}

/* Styling for icon */
.login .input-icon box-icon {
    color: rgb(0, 0, 0);
    position: absolute;
    top: 50%;
    right: 30px;
    transform: translateY(-50%);
    cursor: pointer;
    width: 24px; /* Adjust this value to make the icon bigger */
    height: 24px; /* Adjust this value to make the icon bigger */
}

/* Styling for Remember Me Labels */
.login label {
    display: block;
    margin-bottom: 0.5em;
    color: black;
}

/* Styling for Submit Button */
.login button[type="submit"] {
    width: 50%;
    padding: 0.5em;
    background-color: #007bff;
    font-size: 1.5rem;
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
.error-message {
    text-align: center;
    color: red;
    margin-top: 1em;
}

</style>
