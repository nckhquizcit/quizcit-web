import { mockUsers } from "../../../mock/mockUser";

export const adminUserService = {
  getUsers() {
    return mockUsers;
  },

  filterUsers(users = mockUsers, { searchTerm = "", status = "ALL" } = {}) {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchSearch =
        !normalizedSearch ||
        user.username.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);
      const matchStatus = status === "ALL" || user.status === status;

      return matchSearch && matchStatus;
    });
  },

  lockUser(users, userId) {
    return users.map((user) =>
      user.user_id === userId ? { ...user, status: "BANNED" } : user,
    );
  },

  updateUserRole(users, userId, role) {
    return users.map((user) =>
      user.user_id === userId ? { ...user, role } : user,
    );
  },
};
