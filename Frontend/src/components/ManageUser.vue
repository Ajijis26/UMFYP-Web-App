<template>
  <div class="manage-user-container">
    <div class="manage-user-header">
      <h1>Manage User</h1>

      <div class="action-buttons">
        <!-- Refresh Button -->
        <button class="btn-refresh" @click="fetchUsers">
          <i class="fas fa-sync-alt"></i> Refresh
        </button>
        
        <!-- Delete Button -->
        <button class="btn-delete" @click="deleteSelectedUsers">
          <i class="fas fa-trash"></i> Delete
        </button>
        
        <!-- Search Input -->
        <input 
          type="text" 
          v-model="searchTerm" 
          placeholder="Search Username" 
          @input="filterUsers" 
          class="search-input"
        />
      </div>
    </div>

    <table class="user-table">
      <thead>
        <tr>
          <th><input type="checkbox" v-model="selectAll" @change="toggleSelectAll" /></th>
          <th>ID</th>
          <th>Role / Position</th>
          <th>Username</th>
          <th>Fullname</th>
          <th>Email</th>
          <th>Created Date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.id">
          <td><input type="checkbox" v-model="selectedUsers" :value="user.id" /></td>
          <td>{{ user.id }}</td>
          <td>{{ user.role }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.fullname }}</td>
          <td>{{ user.email }}</td>
          <td>{{ user.createdDate }}</td>
        </tr>
      </tbody>
    </table>
    <div class="pagination">
      <button class="btn-prev" @click="previousPage" :disabled="currentPage === 1">Previous</button>
      <span>{{ currentPage }}</span>
      <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">Next</button>
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
      pageSize: 10, // Users per page
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.users.length / this.pageSize);
    },
  },
  methods: {
    async fetchUsers() {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get('http://localhost:3000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        this.users = response.data;
        this.filterUsers();
      } catch (error) {
        console.error("Error fetching users:", error);
        alert("Failed to fetch users. Please try again.");
      }
    },
    filterUsers() {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = startIndex + this.pageSize;
      const filtered = this.users.filter(user =>
        user.username.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
      this.filteredUsers = filtered.slice(startIndex, endIndex);
    },
    toggleSelectAll() {
      this.selectedUsers = this.selectAll ? this.filteredUsers.map(user => user.id) : [];
    },
    async deleteSelectedUsers() {
      if (!this.selectedUsers.length) {
        alert("No users selected for deletion.");
        return;
      }
      try {
        const token = localStorage.getItem("token");
        await axios.delete('http://localhost:3000/api/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          data: { userIds: this.selectedUsers },
        });
        alert("Users deleted successfully.");
        this.fetchUsers();
      } catch (error) {
        console.error("Error deleting users:", error);
        alert("Failed to delete users. Please try again.");
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
  },
  mounted() {
    this.fetchUsers(); // Fetch data on component load
  },
};
</script>


<style scoped>
.manage-user-container {
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.manage-user-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.manage-user-header h1 {
  font-size: 2  rem;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 20px; /* Increase spacing between buttons */
}

.btn-delete {
  padding: 5px; /* Increase padding */
  font-size: 0.8rem; /* Make the icons/text larger */
  background-color: red; /* Refresh/Delete button color */
  color: white;
  border-radius: 10px; /* Make buttons slightly rounded */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 2px solid #d32f2f; /* Slightly darker red border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Add a shadow */
}

.btn-delete:hover {
  background-color:darkred; /* Darker blue on hover */
  border: 2px solid darkred; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add a shadow */
}

.btn-refresh {
  padding: 5px; /* Increase padding */
  font-size: 0.8rem; /* Make the icons/text larger */
  background-color: green; /* Refresh/Delete button color */
  color: white;
  border-radius: 8px; /* Make buttons slightly rounded */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  border: 2px solid green; /* Slightly darker red border */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); /* Add a shadow */
}

.btn-refresh:hover {
  background-color:darkgreen; /* Darker blue on hover */
  border: 2px solid darkgreen; /* Slightly darker red border */
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.3); /* Add a shadow */
}

.btn-refresh i,
.btn-delete i {
  font-size: 1.5rem; /* Larger icon size */
}


.search-input {
  padding: 5px;
  border: 1px solid #7a7a7a;
  border-radius: 5px;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
}

.user-table th,
.user-table td {
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #ccc;
  font-size: 0.8rem;
}

.user-table th {
  background-color: #000000;
  color: #ffffff;
  font-weight: bold;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.btn-prev,
.btn-next {
  padding: 5px 10px;
  margin: 0 5px;
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
</style>
