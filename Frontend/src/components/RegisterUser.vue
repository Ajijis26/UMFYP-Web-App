<template>
  <div class="register-container">
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">Registering New User</p>
    </div>
    
    <div class="register-details">
      <h1>Register New User</h1>
      <form @submit.prevent="register">
            
        <!-- Role / Position -->
        <div class="form-group">
          <label>Role / Position:</label>
          <select v-model="role" :class="{ 'error-border': errors.role }" >
            <option disabled value="">Select Role / Position</option>
            <option value="Admin">Admin</option>
            <option value="Guest">Guest</option>
          </select>
          <span v-if="errors.role" class="error-text">Role is required.</span>
        </div>

        <!-- Full Name -->
        <div class="form-group">
          <label>Full Name:</label>
          <input
            type="text"
            v-model="fullname"
            :class="{ 'error-border': errors.fullname }"
            placeholder="Enter full name"
          />
          <span v-if="errors.fullname" class="error-text">Full name is required.</span>
        </div>

        <!-- Username -->
        <div class="form-group">
          <label>Username:</label>
          <input
            type="text"
            v-model="username"
            :class="{ 'error-border': errors.username }"
            placeholder="Enter username"
          />
          <span v-if="errors.username" class="error-text">{{ usernameErrorText }}</span>
        </div>

        <!-- Email -->
        <div class="form-group">
          <label>Email:</label>
          <input
            type="email"
            v-model="email"
            :class="{ 'error-border': errors.email }"
            placeholder="Enter email"
            @invalid="handleInvalidEmail"
            @input="clearEmailError"
          />
          <span v-if="errors.email" class="error-text">{{ emailErrorText }}</span>
        </div>

        <!-- Password -->
        <div class="form-group">
          <label>Password:</label>
          <input
            type="password"
            v-model="password"
            :class="{ 'error-border': errors.password }"
            placeholder="Enter password"
            required
          />
          <span v-if="errors.password" class="error-text">Password must be at least 8 characters.</span>
        </div>

        <!-- Confirm Password -->
        <div class="form-group">
          <label>Confirm Password:</label>
          <input
            type="password"
            v-model="confirmPassword"
            :class="{ 'error-border': errors.confirmPassword }"
            placeholder="Re-enter password"
            required
          />  
          <span v-if="errors.confirmPassword" class="error-text">Passwords do not match.</span>
        </div>

        <button type="submit" class="btn-update" :disabled="isLoading">
          {{ isLoading ? "Registering" : "Register" }}
        </button>
      </form>

      <!-- Registration Success Modal -->
      <div v-if="showSuccessModal" class="modal-overlay">
        <div class="modal-content">
          <h2 class="modal-title">Registration Successful</h2>
          <label for="registration-input" class="modal-label">The user has been registered successfully.</label>
          <div class="modal-footer">
              <button class="btn-modal" @click="closeSuccessModal">Close</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
  

<script>
import axios from "axios";
import { jwtDecode } from "jwt-decode";

export default {
  data() {
    return {
      role: "",
      fullname: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      isLoading: false, 
      errors: {
        role: false,
        fullname: false,
        username: false,
        email: false,
        password: false,
        confirmPassword: false,
      },
      usernameErrorText: "",
      emailErrorText: "",
      showSuccessModal: false,
    };
  },
  methods: {
    async register() {
      // Clear all errors
      this.clearErrors();

      let isValid = true;

      if (!this.role) {
        this.errors.role = true;
        isValid = false;
      }
      if (!this.fullname) {
        this.errors.fullname = true;
        isValid = false;
      }
      if (!this.username) {
        this.errors.username = true;
        this.usernameErrorText = "Username is required.";
        isValid = false;
      }
      if (!this.email) {
        this.errors.email = true;
        this.emailErrorText = "Email is required.";
        isValid = false;
      } else if (!this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        this.errors.email = true;
        this.emailErrorText = "Invalid email format.";
        isValid = false;
      }
      if (this.password.length < 8) {
        this.errors.password = true;
        isValid = false;
      }
      if (this.password !== this.confirmPassword) {
        this.errors.confirmPassword = true;
        isValid = false;
      }

      if (!isValid) return; // Stop if validation fails

      this.isLoading = true;

      try {
        // Get token from localStorage
        const token = localStorage.getItem("token");

        // Make axios POST request with Authorization header
        const response = await axios.post(
          "http://localhost:3000/api/register",
          {
            role: this.role,
            fullname: this.fullname,
            username: this.username,
            email: this.email,
            password: this.password,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.showSuccessModal = true;
        this.clearForm();
      } catch (err) {
        console.error("Registration Error:", err);
        if (err.response?.data?.error) {
          if (err.response.data.error === "Username already exists.") {
            this.errors.username = true;
            this.usernameErrorText = "Username already exists.";
          } else if (err.response.data.error === "Email already exists.") {
            this.errors.email = true;
            this.emailErrorText = "Email already exists.";
          } else {
            alert(err.response.data.error);
            this.emailErrorText = err.response.data.error; // Display other backend errors
          }
        } else {
          alert("An unexpected error occurred. Please try again.");
        }
      } finally {
        this.isLoading = false;
      }
    },

    handleInvalidEmail(event) {
      event.preventDefault(); // Prevent the browser's tooltip
      this.errors.email = true;
      if (!this.email) {
        this.emailErrorText = "Email is required.";
      } else {
        this.emailErrorText = "Invalid email format.";
      }
    },

    clearEmailError() {
      this.errors.email = false;
      this.emailErrorText = "";
    },

    clearErrors() {
      this.errors = {
        role: false,
        fullname: false,
        username: false,
        email: false,
        password: false,
        confirmPassword: false,
      };
      this.usernameErrorText = "";
      this.emailErrorText = "";
    },

    clearForm() {
      this.role = "";
      this.fullname = "";
      this.username = "";
      this.email = "";
      this.password = "";
      this.confirmPassword = "";
    },

    closeSuccessModal() {
      this.showSuccessModal = false;
    },
  },

  async mounted() {
    const token = localStorage.getItem('token');
    if (!token) {
      this.$router.push('/'); // Redirect to login if no token
      return;
    }

    try {
      // Decode token to get user role
      const decoded = jwtDecode(token); // Use jwtDecode instead of JSON.parse
     const userRole = decoded.role;

      // Redirect if the user is not an Admin
      if (userRole !== 'Admin') {
        this.$router.push('/dashboard'); // Redirect to dashboard for non-Admins
      }
    } catch (err) {
        console.error("Error decoding token:", err);
        this.$router.push('/'); // Redirect to login on error
    }
  },

};
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.register-details {
  max-width: 600px;
  width: 100%;
  padding: 1.5rem;
  border-radius: 30px;
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.register-details h1 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.2em;
  font-weight: bold;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-weight: bold;
  margin-bottom: 0.1rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 15px;
  border: 2px solid gray;
  color: black;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #007bff;
  outline: none;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

.form-group input::placeholder {
  color: gray;
  font-style: italic;
  font-size: 0.8rem;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 50%;
  min-width: 200px;
  max-width: 400px;
  background: white;
  border-radius: 30px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex; /* Add this */
  flex-direction: column; /* Align children vertically */
  align-items: center;
}

.modal-title {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 20px;
  color:black;
  font-weight: bold;
}

.modal-label {
  font-size: 1rem;
  text-align: center;
  color: #000000;
  margin: 10px 0;
}

.modal-footer {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

.btn-modal {
  padding: 10px 20px;
  background-color: red;
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-modal:hover {
  background-color: darkred;
  transform: scale(1.05);
}

.error-border {
  border-color: red !important;
  box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
}

.error-text {
  color: red;
  font-size: 0.9rem;
  margin-top: 0.2rem;
  display: block;
}

.btn-update {
  width: 50%;
  padding: 0.5rem;
  background-color: #007bff;
  font-size: 1.2rem;
  text-transform: uppercase;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 80px;
  cursor: pointer;
  margin: 1rem auto;
  display: block;
  text-align: center;
  transition: all 0.3s ease;
  margin-bottom: 0px;
}

.btn-update:hover {
  background-color: #0056b3;
  transform: scale(1.05);
}

.success-message {
  text-align: center;
  color: green;
  margin-top: 1rem;
}

.error-message {
  text-align: center;
  color: red;
  margin-top: 1rem;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(109, 109, 109, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
