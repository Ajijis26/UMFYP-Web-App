<template>
  <div class="account-container">
    <!-- Loading Spinner -->
    <div v-if="isFetching" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">Fetching User Information</p>
    </div>

    <div class="account-details">
      <h1>Account Details</h1>
      <form @submit.prevent="updateAccount">

        <!-- Role / Position -->
        <div class="form-group">
          <label>Role / Position :</label>
          <input
            type="text"
            v-model="user.role"
            disabled
          />
        </div>

        <!-- Full Name -->
        <div class="form-group">
          <label>Full Name :</label>
          <input
            type="text"
            v-model="user.fullname"
            :class="{ 'error-border': errors.fullname }"
            required
          />
          <span v-if="errors.fullname" class="error-text">Full name is required.</span>
        </div>

        <!-- Current Username -->
        <div class="form-group">
          <label>Current Username :</label>
          <input
            type="text"
            v-model="user.username"
            disabled
          />
        </div>

        <!-- User Email -->
        <div class="form-group">
          <label>Email:</label>
          <input
            type="email"
            v-model="user.email"
            :class="{ 'error-border': errors.email }"
            required
          />
          <span v-if="errors.email" class="error-text">Email is required.</span>
        </div>

        <!-- New Username -->
        <div class="form-group">
          <label>New Username :</label>
          <input
            type="text"
            v-model="newUsername"
            placeholder="Enter a new username if you want to change it"
            :class="{ 'error-border': errors.newUsername }"
          />
          <span v-if="errors.newUsername" class="error-text">New username is already taken.</span>
        </div>

        <!-- Old Password -->
        <div class="form-group">
          <label>Old Password :</label>
          <input
            type="password"
            v-model="oldPassword"
            placeholder="Enter your current password to change the password"
            :class="{ 'error-border': errors.oldPassword }"
          />
          <span v-if="errors.oldPassword && !isOldPasswordIncorrect" class="error-text">Old password is required.</span>
          <span v-if="errors.oldPassword && isOldPasswordIncorrect" class="error-text">Old password is incorrect.</span>
        </div>

        <!-- New Password -->
        <div class="form-group">
          <label>New Password :</label>
          <input
            type="password"
            v-model="newPassword"
            placeholder="Enter a new password (optional)"
            :class="{ 'error-border': errors.newPassword }"
          />
        </div>

        <!-- Confirm New Password -->
        <div class="form-group">
          <label>Confirm New Password :</label>
          <input
            type="password"
            v-model="confirmPassword"
            placeholder="Re-enter the new password to confirm"
            :class="{ 'error-border': errors.confirmPassword }"
          />
          <span v-if="errors.newPassword || errors.confirmPassword" class="error-text">
            Passwords do not match.
          </span>
        </div>

        <button type="submit" class="btn-update" :disabled="isLoading">
          {{ isLoading ? "Updating" : "Update Details" }}
        </button>

      </form>
      
    </div>

    <!-- Success Modal -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">Updated !</h2>
        <label for="new-owner-input" class="modal-label">Your account details have been updated successfully.</label>
        <div class="modal-footer">
          <button @click="closeSuccessModal" class="btn-modal">Close</button>
        </div>
      </div>
    </div>
    
  </div>
</template>
  
<script>
import { ref, onMounted } from "vue";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

export default {
  data() {
    return {
      user: {
          role: "",
          fullname: "",
          username: "",
          email: "",
      },
      newUsername: "", // Field for the new username
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      isLoading: false,
      isFetching: true,
      showSuccessModal: false,
      errors: {
        fullname: false,
        email: false,
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
        newUsername: false,
      },
    };
  },

  async mounted() {
      // Fetch the user details when the component mounts
      await this.fetchUserDetails();
      this.isFetching = false;
  },

  methods: {

    /*Fetches the user details from the server.*/
    async fetchUserDetails() {
      try {
        const token = this.getToken();
        const decodedToken = jwtDecode(token);
        const username = decodedToken.username;

        // Fetch user details by username
        const response = await axios.get(
          `http://localhost:3000/api/users/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        this.user = response.data;
      } catch (error) {
        console.error("Error fetching user details:", error);
        this.errorMessage = "Failed to load user's account details.";
      }
    },

    /* Updates the user account details.*/
    async updateAccount() {
      this.isLoading = true;

      // Validation for required fields
      if (!this.validateInputs()) {
        this.isLoading = false;
        return;
      }

      try {
        const token = this.getToken();
        const payload = {
          fullname: this.user.fullname,
          email: this.user.email,
          oldPassword: this.oldPassword,
          newPassword: this.newPassword,
          newUsername: this.newUsername || this.user.username, // Use new username if provided
        };

        const response = await axios.put(
          `http://localhost:3000/api/users/${this.user.username}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Update response:", response.data); // Debugging

        const newToken = response.data.token;
        if (!newToken) {
          this.errorMessage = "Failed to retrieve updated token. Please log in again.";
          console.error("No token found in response");
          return;
        }

        // Success feedback
        this.successMessage = "Account details updated successfully.";

        localStorage.setItem("token", newToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        const updatedUser = jwtDecode(newToken);
        this.$emit('userUpdated', {
          userName: this.user.fullname,
          userRole: this.user.role,
        });

        this.resetFormFields();
        this.showSuccessModal = true;
      } catch (error) {
        console.error("Error updating account details:", error);

        if (error.response?.data?.error === 'Username already exists. Please choose another one.') {
          this.errors.newUsername = true;
          return;
        }

        if (error.response?.data?.error === 'Old password is incorrect') {
          this.errors.oldPassword = true; // Flag the old password field as invalid
          this.isOldPasswordIncorrect = true; // Set specific error for incorrect password
          return;
        }

        if (error.response?.data?.error) {
          this.errorMessage = error.response.data.error; // Backend error message
        } else {
          this.errorMessage = "An error occurred while updating your account.";
        }
      } finally {
        this.isLoading = false;
      }
    },

    validateInputs() {
      this.clearErrors();
      let isValid = true;

      if (!this.user.fullname) {
        this.errors.fullname = true;
        isValid = false;
      }
      if (!this.user.email) {
        this.errors.email = true;
        isValid = false;
      }
      if (this.newUsername && this.newUsername.trim() === "") {
        this.errors.newUsername = true;
        isValid = false;
      }
      if (this.newPassword || this.confirmPassword || this.oldPassword) {
        if (!this.oldPassword) {
          this.errors.oldPassword = true;
          isValid = false;
        }
        if (this.newPassword !== this.confirmPassword) {
          this.errors.newPassword = true;
          this.errors.confirmPassword = true;
          isValid = false;
        }
      }

      return isValid;
    },


    clearErrors() {
      this.errors = {
        fullname: false,
        email: false,
        oldPassword: false,
        newPassword: false,
        confirmPassword: false,
        newUsername: false,
      };
      this.isOldPasswordIncorrect = false;
    },

    /*Resets form fields for passwords and new username.*/
    resetFormFields() {
      this.oldPassword = "";
      this.newPassword = "";
      this.confirmPassword = "";
      if (this.newUsername) {
        this.user.username = this.newUsername;
        this.newUsername = "";
      }
    },

    closeSuccessModal() {
      this.showSuccessModal = false;
      this.$router.push("/dashboard"); // Redirect to dashboard
    },

    /**
     * Retrieves the authentication token from local storage.
     * Throws an error if the token is not found.
     */
    getToken() {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token not found");
      }
      return token;
    },

  },
};
</script>

<style scoped>
.account-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.account-details {
  width: 100%;
  max-width: 600px;
  min-width: 300px;
  padding: 1.5rem;
  border-radius: 30px;
  background-color: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.account-details h1 {
  font-size: 2rem;
  text-align: center;
  margin-bottom: 1.2rem;
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

.form-group input {
  width: 100%;
  padding: 0.5rem;
  font-size: 1rem;
  border-radius: 15px;
  border: 2px solid gray;
  color: black;
}

.form-group input:focus {
  border-color: #007bff; /* Blue border */
  outline: none; /* Remove the default outline */
  color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Add a slight blue glow */
}

.form-group input::placeholder {
  color: gray; /* Blue color for the placeholder */
  font-style: italic; /* Optional: Make the placeholder text italic */
  font-weight: lighter;
  font-size: 0.8rem;
}

.error-border {
  border-color: red !important;
  box-shadow: 0 0 5px rgba(255, 0, 0, 0.5);
}

/* Style for error text messages */
.error-text {
  color: red;
  font-size: 0.9rem;
  margin-top: 0.2rem;
  display: block;
}

.btn-update {
  width: 50%; /* Set a fixed width */
  padding: 0.5rem;
  background-color: #007bff;
  font-size: 1.2rem;
  text-transform: uppercase;
  color: #fff;
  font-weight: bold;
  border: none;
  border-radius: 80px;
  cursor: pointer;
  margin: 1rem auto; /* Center the button and add space above */
  display: block; /* Ensure margin auto works for centering */
  text-align: center;
  transition: all 0.3s ease;
}

.btn-update:hover {
  background-color: #0056b3;
  transform: scale(1.05);
  transition: all 0.3s ease;
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

.success-message,
.error-message {
  transition: opacity 0.3s ease;
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
  border-top: 5px solid #ff0800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
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

</style>
