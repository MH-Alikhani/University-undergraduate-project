import "./chatList.css";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import useChatStore from "../../../lib/chatStore";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

/**
 * ChatList component displays a list of user chats with a search bar.
 * It allows users to search through chats, select a chat, and add new users.
 * @component
 */
const ChatList = () => {
  // Ref to manage the add user modal DOM element
  const addUserRef = useRef();

  // State variables to store chats, toggle add mode, and store search input
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  // Retrieve the current user and chat handling methods from respective stores
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  // Effect to fetch and subscribe to the current user's chats in real-time
  useEffect(() => {
    /**
     * Fetch the chats from the Firestore database and keep them updated in real-time.
     * This fetches the user chats and also resolves the associated user data for each chat.
     */
    const fetchChats = async () => {
      // Subscribe to updates on the user's chats
      const unSub = onSnapshot(
        doc(db, "userchats", currentUser.id),
        async (res) => {
          const items = res.data()?.chats || [];

          // Retrieve additional user data for each chat
          const chatData = await Promise.all(
            items.map(async (item) => {
              const userDocSnap = await getDoc(
                doc(db, "users", item.receiverId)
              );
              return { ...item, user: userDocSnap.data() };
            })
          );

          // Sort chats based on the latest updated timestamp
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      );

      // Cleanup the subscription when the component unmounts
      return () => unSub();
    };

    // Call the fetchChats function
    fetchChats();
  }, [currentUser.id]);

  /**
   * Handle the selection of a chat. Mark the chat as seen and update it in Firestore.
   * This function also triggers the changeChat method to open the selected chat.
   * @param {Object} chat - The chat object that was selected.
   */
  const handleSelect = useCallback(
    async (chat) => {
      // Update the 'isSeen' status of the selected chat
      const userChats = chats.map((item) => ({
        ...item,
        isSeen: item.chatId === chat.chatId ? true : item.isSeen,
      }));

      try {
        // Update the chats in Firestore
        await updateDoc(doc(db, "userchats", currentUser.id), {
          chats: userChats,
        });
        // Trigger chat change in the app (UI state)
        changeChat(chat.chatId, chat.user);
      } catch (err) {
        console.error("Error updating chat:", err);
      }
    },
    [chats, currentUser.id, changeChat]
  );

  /**
   * Debounced input handler to manage chat search.
   * It delays the search execution to optimize performance when the user types quickly.
   * @param {Event} e - The input change event.
   */
  const debouncedInputHandler = useCallback(
    (e) => {
      const value = e.target.value.toLowerCase();
      const handler = setTimeout(() => setInput(value), 300);
      // Cleanup timeout to avoid multiple overlapping calls
      return () => clearTimeout(handler);
    },
    [setInput]
  );

  /**
   * Filter the chat list based on the search input.
   * Only chats whose usernames contain the search input will be displayed.
   */
  const filteredChats = useMemo(() => {
    return chats.filter((c) => c.user.username.toLowerCase().includes(input));
  }, [chats, input]);

  // Effect to handle closing the 'AddUser' modal when clicking outside of it
  useEffect(() => {
    /**
     * Handle clicks outside the AddUser modal to close it.
     * @param {Event} event - The click event.
     */
    const handleClickOutside = (event) => {
      if (addUserRef.current && !addUserRef.current.contains(event.target)) {
        setAddMode(false);
      }
    };

    if (addMode) {
      // Add event listener to detect clicks outside the modal
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      // Cleanup the event listener when modal is closed
      document.removeEventListener("mousedown", handleClickOutside);
    }

    // Cleanup on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [addMode]);

  return (
    <div className='chatList'>
      <div className='search'>
        <div className='searchBar'>
          <img src='/search.png' alt='search icon' />
          <input
            type='text'
            placeholder='جست و جو'
            dir='auto'
            onChange={debouncedInputHandler}
          />
        </div>
        <img
          src={addMode ? "/minus.png" : "/plus.png"}
          className='add'
          alt='Add icon'
          onClick={() => setAddMode(!addMode)}
        />
      </div>

      {/* Render filtered chats */}
      {filteredChats.map((chat) => (
        <div
          className='item'
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
          style={{ backgroundColor: chat.isSeen ? "transparent" : "#5183fe" }}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "/avatar.png"
                : chat.user?.avatar
            }
            alt=''
          />
          <div className='texts'>
            <span>
              {chat.user.blocked.includes(currentUser.id)
                ? "کاربر"
                : chat.user?.username || "کاربر ناشناخته"}
            </span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {/* Render AddUser component when in add mode */}
      {addMode && <AddUser ref={addUserRef} />}
    </div>
  );
};

export default ChatList;
