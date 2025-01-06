<template>
  <div class="manage-user-container">
    <!-- Loading Spinner -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p class="loading-text">Deleting Users</p>
    </div>

    <div class="manage-user-header">
      <h1>Manage User</h1>

      <div class="action-buttons">
        <!-- Refresh Button -->
        <button class="btn-refresh" @click="fetchUsers">
          <i class="bi bi-arrow-clockwise"></i>
        </button>

        <!-- Attribute Selection -->
        <select v-model="selectedAttribute" class="attribute-select">
          <option disabled value="">Select Attribute</option>
          <option value="username">Username</option>
          <option value="email">Email</option>
          <option value="role">Role</option>
          <option value="fullname">Fullname</option>
        </select>

        <!-- Search Input -->
        <div class="search-bar-wrapper">
          <label for="search-bar" class="search-bar-label">Search by:</label>
          <input
            id="search-bar"
            type="text"
            v-model="searchTerm"
            :placeholder="selectedAttribute || 'Search Users'"
            @input="filterUsers"
            class="search-input"
          />
          <button v-if="searchTerm" @click="clearSearch" class="btn-clear">
            <i class="bi bi-x-circle"></i>
          </button>
        </div>

        <!-- Delete Button -->
        <div class="btn-delete-container">
          <button class="btn-delete" @click="confirmDeleteUsers">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Alerts Table -->
    <div class="table-container">
      <div v-if="isLoading" class="loading-spinner-overlay">
        <div class="spinner-table"></div>
        <p class="fetching-users-text">Fetching Users</p>
      </div>
      <table class="user-table">
        <thead>
          <tr>
            <th>
              <label class="checkbox-container">
                <input type="checkbox" v-model="selectAll" @change="toggleSelectAll" />
              </label>
            </th>
            <th @click="sortUsers('id')">ID</th>
            <th @click="sortUsers('role')">Role / Position</th>
            <th @click="sortUsers('username')">Username</th>
            <th @click="sortUsers('fullname')">Fullname</th>
            <th @click="sortUsers('email')">Email</th>
            <th @click="sortUsers('createdDate')">Created Date</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredUsers.length === 0">
            <td colspan="7" class="no-users-message">No users found.</td>
          </tr>
          <tr v-else v-for="user in filteredUsers" :key="user.id">
            <td>
              <label class="checkbox-container">
                <input type="checkbox" v-model="selectedUsers" :value="user.id" />
              </label>
            </td>
            <td>{{ user.id }}</td>
            <td>{{ user.role }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.fullname }}</td>
            <td>{{ user.email }}</td>
            <td>{{ user.createdDate }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <!-- Rows per page dropdown -->
      <label for="rowsPerPage" class="pagination-label">Rows per page:</label>
      <select
        id="rowsPerPage"
        v-model="pageSize"
        @change="updatePagination"
        class="pagination-select"
      >
        <option :value="5">5</option>
        <option :value="10">10</option>
        <option :value="25">25</option>
        <option :value="50">50</option>
      </select>

      <!-- Previous button -->
      <button class="btn-prev" @click="previousPage" :disabled="currentPage === 1">
        Previous
      </button>

      <!-- Page navigation -->
      <span>Page {{ currentPage }} of {{ totalPages }}</span>

      <!-- Next button -->
      <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">
        Next
      </button>

      <!-- Go to page input -->
      <label for="goToPage" class="pagination-label">Go to Page:</label>
      <input
        type="number"
        id="goToPage"
        v-model.number="goToPageInput"
        @change="goToPage(goToPageInput)"
        class="pagination-input"
        :min="1"
        :max="totalPages"
      />
    </div>

    <!-- Confirmation Modal -->
    <div v-if="showConfirmationModal" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">Confirm Deletion</h2>
        <p>Are you sure you want to delete the selected users?</p>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showConfirmationModal = false">Cancel</button>
          <button class="btn-confirm" @click="deleteSelectedUsersConfirmed">Confirm</button>
        </div>
      </div>
    </div>

    <!-- Success Modal -->
    <div v-if="showDeletionSuccessModal" class="modal-overlay">
      <div class="modal-content">
        <h2 class="modal-title">Success</h2>
        <p>The selected users have been successfully deleted.</p>
        <button class="btn-close" @click="closeDeletionSuccessModal">Close</button>
      </div>
    </div>

  </div>
</template>


<script>
import axios from 'axios';

export default {
  data() {
    return {
      users: [], // All user data
      filteredUsers: [], // Filtered users based on search
      searchTerm: "",
      selectedUsers: [], // Selected user IDs
      selectAll: false,
      currentPage: 1,
      pageSize: 10,
      goToPageInput: 1,
      isLoading: false,
      selectedAttribute: "",
      sortKey: "",
      sortOrder: "asc",
      showConfirmationModal: false,
      showDeletionSuccessModal: false,
    };
  },
  computed: {
    totalPages() {
      const searchValue = this.searchTerm.toLowerCase();
      const filtered = this.users.filter((user) => {
        switch (this.selectedAttribute) {
          case "username":
            return user.username.includes(searchValue);
          case "email":
            return user.email.toLowerCase().includes(searchValue);
          case "role":
            return user.role.toLowerCase().includes(searchValue);
          case "fullname":
            return user.fullname.toLowerCase().includes(searchValue);
          default:
            return (
              user.username.includes(searchValue) ||
              user.email.toLowerCase().includes(searchValue) ||
              user.role.toLowerCase().includes(searchValue) ||
              user.fullname.toLowerCase().includes(searchValue)
            );
        }
      });
      return Math.ceil(filtered.length / this.pageSize);
    },
  },
  methods: {
    async fetchUsers() {
      this.isLoading = true;
      try {
        const token = localStorage.getItem("token");
        const apiBackendUrl = import.meta.env.VITE_BACKEND_URL; // Use environment variable
        const response = await axios.get(`${apiBackendUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        this.users = response.data;
        this.filterUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
        if (error.response?.status === 401) {
            alert("Session expired. Redirecting to login.");
            localStorage.removeItem("token"); // Clear token
            this.$router.push("/"); // Redirect to login
        } else {
            alert(
                error.response?.data?.error || "Failed to fetch users. Please try again."
            );
        }
      } finally {
        this.isLoading = false;
      }
    },

    // Show the delete confirmation modal
    confirmDeleteUsers() {
      if (!this.selectedUsers.length) {
        alert("No users selected for deletion.");
        return;
      }
      this.showConfirmationModal = true;
    },

    async deleteSelectedUsersConfirmed() {
      this.showConfirmationModal = false; // Close the confirmation modal
      if (!this.selectedUsers.length) return;

      this.isLoading = true; // Show loading spinner
      try {
        const token = localStorage.getItem("token");
        const apiBackendUrl = import.meta.env.VITE_BACKEND_URL;
        await axios.delete(`${apiBackendUrl}/api/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { userIds: this.selectedUsers },
        });
        this.selectedUsers = []; // Clear selected users
        this.fetchUsers(); // Refresh user data
        this.showDeletionSuccessModal = true; // Show success modal
      } catch (error) {
        console.error("Error deleting users:", error);
        if (error.response?.status === 401) {
            alert("Session expired. Redirecting to login.");
            localStorage.removeItem("token"); // Clear token
            this.$router.push("/"); // Redirect to login
        } else {
            alert(
                error.response?.data?.error || "Failed to delete users. Please try again."
            );
        }
      } finally {
        this.isLoading = false; // Hide loading spinner
      }
    },

    // Close the success modal
    closeDeletionSuccessModal() {
      this.showDeletionSuccessModal = false;
    },

    filterUsers() {
      const searchValue = this.searchTerm.toLowerCase();
      const filtered = this.users.filter((user) => {
        switch (this.selectedAttribute) {
          case "username":
            return user.username.includes(searchValue);
          case "email":
            return user.email.toLowerCase().includes(searchValue);
          case "role":
            return user.role.toLowerCase().includes(searchValue);
          case "fullname":
            return user.fullname.toLowerCase().includes(searchValue);
          default:
            return (
              user.username.includes(searchValue) ||
              user.email.toLowerCase().includes(searchValue) ||
              user.role.toLowerCase().includes(searchValue) ||
              user.fullname.toLowerCase().includes(searchValue)
            );
        }
      });

      // Sort the filtered data
      const sorted = this.sortData(filtered);

      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;

      this.filteredUsers = sorted.slice(startIndex, endIndex);
    },

    // Sort the data based on sortKey and sortOrder
    sortData(data) {
      if (!this.sortKey) return data; // No sorting if sortKey is not set
      return data.sort((a, b) => {
        let aValue = a[this.sortKey];
        let bValue = b[this.sortKey];

        // Handle undefined values
        if (aValue === undefined) return this.sortOrder === "asc" ? 1 : -1;
        if (bValue === undefined) return this.sortOrder === "asc" ? -1 : 1;

        // Handle case-insensitive sorting for strings
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        // Handle sorting for dates
        if (this.sortKey === "createdDate") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) return this.sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return this.sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    },

    // Handle sorting logic
    sortUsers(key) {
      if (this.sortKey === key) {
        // If the same column is clicked, toggle the sort order
        this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
      } else {
        // Otherwise, set the new column and default to ascending order
        this.sortKey = key;
        this.sortOrder = "asc";
      }
      this.filterUsers(); // Re-filter users to apply sorting
    },

    // Handle changing rows per page
    updatePagination() {
      this.currentPage = 1; // Reset to the first page
      this.filterUsers(); // Recalculate the filtered users
    },


    goToPage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page;
        this.filterUsers();
      }
    },

    previousPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.filterUsers();
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.filterUsers();
      }
    },

    clearSearch() {
      this.searchTerm = "";
      this.filterUsers();
    },


    toggleSelectAll() {
      this.selectedUsers = this.selectAll
        ? this.filteredUsers.map((user) => user.id)
        : [];
    },

  },
  mounted() {
    const token = localStorage.getItem("token");
    if (!token) {
        alert("No valid session found. Redirecting to login.");
        this.$router.push("/"); // Redirect to login
        return;
    }

    this.fetchUsers(); // Fetch data on component load
  },
};
</script>


<style scoped>
.manage-user-container {
  max-width: 80%;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.manage-user-header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

.manage-user-header h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 20px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap; /* Allows wrapping if screen width is too small */
  gap: 20px; /* Spacing between elements */
  align-items: center; /* Vertically aligns items */
  justify-content: flex-start; /* Pushes elements apart (left and right) */
  width: 100%;
  padding: 5px ;
}

.btn-refresh {
  padding: 8px;
  background-color: green;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid green;
  transition: all 0.3s ease;
}

.btn-refresh:hover {
  background-color: darkgreen;
  border: 2px solid darkgreen;
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.btn-clear {
  padding: 5px;
  background-color: red;
  color: white;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
}

.btn-clear:hover {
  background-color: darkred; /* Hover color */
  transform: scale(1.05); /* Slight zoom */
}

.btn-delete-container {
  margin-left: auto; /* Pushes the button to the right side */
}

.btn-delete {
  padding: 8px;
  background-color: red;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  border: 2px solid red;
  transition: all 0.3s ease;
}

.btn-delete:hover {
  background-color: darkred;
  border: 2px solid darkred;
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.attribute-select {
  padding: 5px;
  border: 1.5px solid #000000;
  border-radius: 5px;
  color: #000000;
  outline: none; /* Removes the default focus outline */
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.attribute-select:focus {
  border: 1.5px solid #007bff; /* Highlight border on focus */
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5); /* Add a subtle shadow */
}

.search-bar-wrapper {
  display: flex;
  align-items: center; /* Aligns labels and inputs in the center */
  gap: 10px;
}

.search-bar-label {
  font-size: 0.9rem;
  font-weight: bold;
  color: #333;
  white-space: nowrap;
}

.search-input {
  padding: 5px;
  border: 1.5px solid #000000;
  border-radius: 5px;
  color: #000000;
  outline: none;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  width: 100%; /* Set default width to 100% */
  max-width: 500px;
}

.search-input:focus {
  border: 1.5px solid #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
}

/* Checkbox Styling */
.checkbox-container {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  height: 100%;
}

.checkbox-container input[type="checkbox"] {
  width: 16px;
  height: 16px;
  appearance: none; /* Remove default checkbox */
  background-color: white;
  border: 2px solid orangered;
  border-radius: 4px; /* Optional: rounded corners */
  transition: background-color 0.3s ease, transform 0.2s ease;
}

/* Hover Effect */
.checkbox-container input[type="checkbox"]:hover {
  background-color: #e6f7ff; /* Light blue background */
  border-color: red; /* Blue border on hover */
  transform: scale(1.1); /* Slight zoom for better feedback */
  transition: all 0.3s ease;
}

/* Checked State */
.checkbox-container input[type="checkbox"]:checked {
  background-color: darkred; /* Blue background when checked */
  border-color: #000000; /* Darker border when checked */
  transform: scale(1.1); /* Slight zoom when checked */
}

.table-container {
  max-height: 65vh; /* Adjust height as needed */
  overflow-y: auto; /* Add vertical scrolling */
  overflow-x: auto;
  border: 1px solid #ccc;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.no-users-message {
  text-align: center;
  font-style: italic;
  color: gray;
  padding: 20px;
}

.user-table th {
  position: sticky;
  top: 0;
  background-color: #000000;
  z-index: 1; /* Ensure it stays above other elements */
  color: #ffffff;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
}

.user-table td {
  font-size: 0.9rem;
  border-right: 1px solid #ccc;
  word-wrap: break-word;
  max-width: 250px; /* Adjust as needed */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-table th,
.user-table td {
  text-align: center;
  vertical-align: middle;
  padding: 10px;
  border-bottom: 1px solid #ccc;
}

.user-table tbody tr:hover {
  background-color: lightgray; /* Light gray background color on hover */
  cursor: pointer; /* Change cursor to pointer to indicate interactivity */
  transition: background-color 0.3s ease; /* Smooth transition effect */
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.btn-prev,
.btn-next {
  padding: 5px 10px;
  margin: 0 10px;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 5px;
  cursor: pointer;
}

.btn-prev[disabled],
.btn-next[disabled] {
  background-color: #ccc;
  cursor: not-allowed;
}

.btn-prev:hover:not([disabled]),
.btn-next:hover:not([disabled]) {
  background-color: #0056b3;
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.pagination {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

.pagination-label {
  font-size: 0.9rem;
  font-weight: bold;
  margin-right: 5px;
}

.pagination-select,
.pagination-input {
  padding: 5px;
  border: 1px solid #777;
  border-radius: 10px;
  text-align: center;
  width: auto;
}

.pagination-input {
  max-width: 100px; /* Adjust width for the input field */
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
  background: white;
  border-radius: 10px;
  padding: 20px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #333;
  font-weight: bold;
}

.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.btn-cancel,
.btn-confirm,
.btn-close {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.3s ease;
}

.btn-cancel {
  background-color: gray;
  color: white;
}

.btn-confirm {
  background-color: red;
  color: white;
}

.btn-close {
  margin-top: 20px;
  background-color: #007bff;
  color: white;
}

.btn-cancel:hover {
  background-color: darkgray;
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.btn-confirm:hover {
  background-color: darkred;
  transform: scale(1.05);
  transition: all 0.3s ease;
}

.btn-close:hover {
  background-color: #0056b3;
  transform: scale(1.05);
  transition: all 0.3s ease;
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
  border-top: 5px solid red;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 15px;
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
}

.loading-spinner-overlay {
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
  z-index: 9999; /* Ensure it overlays the table */
}

.spinner-table {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #ff0800;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.fetching-users-text {
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

/* Responsive design for smaller screens */
@media screen and (max-width: 768px) {
  .search-input {
    width: 100%; /* Full width for smaller screens */
    max-width: 100%; /* Remove maximum width limit */
  }

  .search-bar-wrapper {
    flex-direction: column; /* Stack elements vertically */
    align-items: flex-start; /* Align to the left */
    gap: 10px; /* Add spacing between elements */
  }
}
</style>
