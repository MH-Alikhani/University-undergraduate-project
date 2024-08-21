import { create } from "zustand";
import { useUserStore } from "./userStore";

/**
 * Zustand store for chat management.
 * Handles chat selection and user blocking states.
 */
const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,

  /**
   * Changes the current chat context.
   * @param {string} chatId - The ID of the chat to switch to.
   * @param {Object} user - The user object representing the chat participant.
   */
  changeChat: (chatId, user) => {
    const { currentUser } = useUserStore.getState();
    const isCurrentUserBlocked = user.blocked.includes(currentUser.id);
    const isReceiverBlocked = currentUser.blocked.includes(user.id);

    set({
      chatId,
      user: isCurrentUserBlocked ? null : user,
      isCurrentUserBlocked,
      isReceiverBlocked: isCurrentUserBlocked ? false : isReceiverBlocked,
    });
  },

  /**
   * Sets the user data in the store.
   * @param {Object} user - The user object representing the chat participant.
   */
  setUser: (user) => {
    set({ user });
  },

  /**
   * Toggles the `isReceiverBlocked` state.
   */
  changeBlock: () => {
    set((state) => ({ isReceiverBlocked: !state.isReceiverBlocked }));
  },
}));

export default useChatStore;
