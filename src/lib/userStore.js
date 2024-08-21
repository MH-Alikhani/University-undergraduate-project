import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { create } from "zustand";
import { db } from "./firebase";

/**
 * @typedef {Object} User
 * @property {string} uid - Unique identifier for the user.
 * @property {string} [email] - The user's email address.
 * @property {string} [displayName] - The user's display name.
 * @property {string} [photoURL] - The user's profile picture URL.
 */

/**
 * Zustand store for managing user data.
 * @type {import("zustand").UseStore<{
 *   currentUser: User | null,
 *   isLoading: boolean,
 *   fetchUserInfo: (uid: string) => Promise<void>
 * }>}
 */
export const useUserStore = create((set) => ({
  currentUser: null,
  isLoading: true,

  /**
   * Fetches user information from Firestore and updates the store.
   * @param {string} uid - The UID of the user to fetch.
   * @returns {Promise<void>} - A promise that resolves when the user data has been fetched.
   */
  fetchUserInfo: async (uid) => {
    if (!uid) {
      set({ currentUser: null, isLoading: false });
      return;
    }

    set({ isLoading: true });

    try {
      const docSnap = await getDoc(doc(db, "users", uid));

      set({
        currentUser: docSnap.exists() ? docSnap.data() : null,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to fetch user info:", err);
      set({ currentUser: null, isLoading: false });
    }
  },
}));
