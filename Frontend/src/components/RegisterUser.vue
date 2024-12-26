<template>
    <div class="register-container">
        <div class="register">
            <h1>Register New User</h1>
            <form @submit.prevent="register">
                <!-- Role/Position Input -->
                <div class="inputbox">
                    <select v-model="role" required>
                        <option disabled value="">Select Role / Position</option>
                        <option value="Admin">Admin</option>
                        <option value="Guest">Guest</option>
                        <!-- Add more roles as needed -->
                    </select>
                </div>

                <!-- Full Name Input -->
                <div class="inputbox">
                    <input type="text" placeholder="Full Name" v-model="fullname" required>
                </div>

                <!-- Username Input -->
                <div class="inputbox">
                    <input type="text" placeholder="Username" v-model="username" required>
                </div>

                <!-- Email Input -->
                <div class="inputbox">
                    <input type="email" placeholder="Email" v-model="email" required>
                </div>

                <!-- Password Input -->
                <div class="inputbox">
                    <input type="password" placeholder="Password" v-model="password" required>
                </div>

                <!-- Confirm Password Input -->
                <div class="inputbox">
                    <input type="password" placeholder="Confirm Password" v-model="confirmPassword" required>
                </div>

                <button type="submit" class="btn" :disabled="isLoading">{{ isLoading ? 'Registering...' : 'Register' }}</button>
            </form>
            <p v-if="error" class="error-message">{{ error }}</p>
            <p v-if="success" class="success-message">{{ success }}</p>
        </div>
    </div>
</template>

<script>
import axios from "axios";

export default {
    data() {
        return {
            role: "",
            fullname: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            error: "",
            success: "",
            isLoading: false, 
        };
    },
    methods: {
        async register() {
            if (this.isLoading) return; // Prevent duplicate submissions
            this.isLoading = true; // Start loading
            this.error = ""; // Clear previous errors
            this.success = ""; // Clear previous success message

            try {
                if (!this.role || !this.fullname || !this.username || !this.email || !this.password || !this.confirmPassword) {
                this.error = 'All fields are required.';
                return;
                }

                if (!this.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                this.error = 'Please enter a valid email address.';
                return;
                }

                if (this.password.length < 8) {
                this.error = 'Password must be at least 8 characters.';
                return;
                }

                if (this.password !== this.confirmPassword) {
                this.error = 'Passwords do not match.';
                return;
                }

                // Make axios POST request
                const response = await axios.post("http://localhost:3000/api/register", {
                    role: this.role,
                    fullname: this.fullname,
                    username: this.username,
                    email: this.email,
                    password: this.password,
                });

                // Handle success
                this.success = response.data.message || "Registration successful!";
                this.role = this.fullname = this.username = this.email = this.password = this.confirmPassword = "";
                
            } catch (err) {
                console.error("Registration Error:", err);
                this.error = err.response?.data?.error || 'Registration failed. Please try again.';
            } finally {
                this.isLoading = false; // Stop loading
            }
        }
    }
};
</script>

<style scoped>
.register-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 75vh;
}

.register {
    max-width: 500px;
    width: 100%;
    margin: auto;
    padding: 2em;
    border-radius: 30px;
    background-color: #fff;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.register h1 {
    font-size: 2rem;
    text-align: center;
    margin-top: 0;
    margin-bottom: 1.5em;
    font-weight: bold;
}

.register .inputbox {
    margin-bottom: 1em;
}

.register select {
    -webkit-appearance: none; /* Remove default arrow in WebKit browsers */
    -moz-appearance: none; /* Remove default arrow in Firefox */
    appearance: none; /* Remove default arrow in modern browsers */
    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 5"><path fill="none" stroke="black" stroke-width=".5" d="M2 4L4 2H0z"/></svg>') no-repeat right 1em center; /* Add custom arrow */
    background-size: 30px 15px; /* Adjust size of custom arrow */
    width: 100%;
    padding: 0.8em;
    border: 1px solid #000000;
    border-radius: 40px;
    vertical-align: middle; /* Align input vertically */
    font-size: 20px;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

.register input[type="text"],
.register input[type="email"],
.register input[type="password"] {
    width: 100%;
    padding: 0.8em;
    border: 1px solid grey;
    border-radius: 40px;
    vertical-align: middle; /* Align input vertically */
    font-size: 1rem;
}

.register input[type="text"]::placeholder,
.register input[type="email"]::placeholder,
.register input[type="password"]::placeholder {
    color: grey; /* Placeholder color */
    font-size: 1rem;
}

.register select:focus,
.register input[type="text"]:focus,
.register input[type="email"]:focus,
.register input[type="password"]:focus {
    outline: none; /* Remove outline on focus */
    border: 2px solid #007bff;
}

.register button[type="submit"] {
    width: 50%;
    padding: 0.5em;
    background-color: #007bff;
    font-size: 1.2rem;
    font-weight: bold;
    text-transform: uppercase;
    color: #fff;
    border: none;
    border-radius: 40px;
    cursor: pointer;
    margin: 0rem auto; /* Center the button and add space above */
    display: block; /* Ensure margin auto works for centering */
    text-align: center;
    transition: background-color 0.3s ease, transform 0.2s ease;
}

.register button[type="submit"]:hover {
    background-color: #0056b3;  
    transform: scale(1.05);
}

.error-message {
    text-align: center;
    color: red;
    margin-top: 1em;
    margin-bottom: 0;
}

.success-message {
    text-align: center;
    color: green;
    margin-top: 1em;
    margin-bottom: 0;
}
</style>
