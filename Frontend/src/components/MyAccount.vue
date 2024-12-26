<template>
    <div class="account-container">
      <div class="account-details">
        <h1>Account Details</h1>
        <form @submit.prevent="updateAccount">
          <div class="form-group">
            <label>Role / Position :</label>
            <input type="text" v-model="user.role" disabled />
          </div>
  
          <div class="form-group">
            <label>Full Name :</label>
            <input type="text" v-model="user.fullname" required />
          </div>
  
          <div class="form-group">
            <label>Current Username :</label>
            <input type="text" v-model="user.username" disabled />
          </div>
  
          <!-- New Username -->
          <div class="form-group">
            <label>New Username :</label>
            <input type="text" v-model="newUsername" placeholder="Enter new username (optional)" />
          </div>
  
          <!-- Old Password -->
          <div class="form-group">
            <label>Old Password :</label>
            <input type="password" v-model="oldPassword" placeholder="Enter old password" />
          </div>
  
          <!-- New Password -->
          <div class="form-group">
            <label>New Password :</label>
            <input type="password" v-model="newPassword" placeholder="Enter new password" />
          </div>
  
          <!-- Confirm New Password -->
          <div class="form-group">
            <label>Confirm New Password :</label>
            <input type="password" v-model="confirmPassword" placeholder="Confirm new password" />
          </div>
  
          <div class="form-group">
            <label>Email :</label>
            <input type="email" v-model="user.email" required />
          </div>
  
          <button type="submit" class="btn-update" :disabled="isLoading">
            {{ isLoading ? "Updating..." : "Update Details" }}
          </button>
        </form>
        <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
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
    successMessage: "",
    errorMessage: "",
    isLoading: false,
    };
},
async mounted() {
    try {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Token not found");
    }
    const decodedToken = jwtDecode(token);
    const username = decodedToken.username;

    // Fetch user details by username
    const response = await axios.get(`http://localhost:3000/api/users/${username}`, {
        headers: {
        Authorization: `Bearer ${token}`,
        },
    });
    this.user = response.data;
    } catch (error) {
    console.error("Error fetching user details:", error);
    this.errorMessage = "Failed to load account details.";
    }
},
methods: {
    async updateAccount() {
    this.isLoading = true;
    this.successMessage = "";
    this.errorMessage = "";

    // Validation for password change
    if (this.newPassword || this.confirmPassword || this.oldPassword) {
        if (!this.oldPassword) {
            this.errorMessage = "Old password is required.";
            this.isLoading = false;
            return;
        }
        if (this.newPassword !== this.confirmPassword) {
            this.errorMessage = "New passwords do not match.";
            this.isLoading = false;
            return;
        }
    }

    try {
        const token = localStorage.getItem("token");
        if (!token) {
        throw new Error("Token not found");
        }

        // Update user details
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

        this.successMessage = "Account details updated successfully.";

        // Update the local token with the new one from the server
        localStorage.setItem("token", response.data.token);

        // Emit the event to update parent components
        this.$emit("userUpdated", { 
            full_name: this.user.fullname, 
            role: this.user.role 
        });


        // Update local data
        this.oldPassword = this.newPassword = this.confirmPassword = "";
        if (this.newUsername) {
            this.user.username = this.newUsername; // Update username in UI
            this.newUsername = ""; // Clear the new username field
        }
    } catch (error) {
        console.error("Error updating account details:", error);
        this.errorMessage =
            error.response?.data?.error || "Failed to update account details.";
    } finally {
        this.isLoading = false;
    }
    },
},
};
</script>



<style scoped>
/* Container and form styling */

.account-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.account-details {
    width: 100%;
    max-width: 500px;
    padding: 2rem;
    border-radius: 30px;
    background-color: #fff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.account-details h1 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 1.5rem;
    font-weight: bold;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.5rem;
    font-size: 1rem;
    border-radius: 8px;
    border: 1px solid #ccc;
}

.btn-update {
    width: 50%; /* Set a fixed width */
    padding: 0.75rem;
    background-color: #007bff;
    color: #fff;
    font-weight: bold;
    border: none;
    border-radius: 80px;
    cursor: pointer;
    text-transform: uppercase;
    margin: 1rem auto; /* Center the button and add space above */
    display: block; /* Ensure margin auto works for centering */
    text-align: center;
}

.btn-update:hover {
    background-color: #0056b3;
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
</style>
