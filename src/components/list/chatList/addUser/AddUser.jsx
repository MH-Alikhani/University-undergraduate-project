import "./addUser.css";
import { forwardRef, useState } from "react";
import { db } from "../../../../lib/firebase";
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useUserStore } from "../../../../lib/userStore";

/**
 * AddUser component allows searching for a user by username and adding them to chats.
 * It uses Firebase Firestore to manage user and chat data.
 *
 * @component
 * @param {Object} props - The component props.
 * @param {React.Ref} ref - The ref forwarded to the component.
 * @returns {JSX.Element} The rendered AddUser component.
 */
const AddUser = forwardRef((props, ref) => {
  const [user, setUser] = useState(null); // State to hold the found user
  const { currentUser } = useUserStore(); // Retrieve current user from the user store

  /**
   * Handles the search form submission, fetching user data from Firestore.
   *
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>} A promise that resolves when the search is complete.
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username"); // Get username from form input

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username)); // Create a query to find the user
      const querySnapShot = await getDocs(q); // Execute the query

      if (!querySnapShot.empty) {
        setUser(querySnapShot.docs[0].data()); // Set the found user data
      } else {
        setUser(null); // Reset user state if not found
        console.log("User not found.");
      }
    } catch (err) {
      console.error("Error searching user:", err); // Log any errors encountered
    }
  };

  /**
   * Handles adding the found user to chats.
   *
   * @returns {Promise<void>} A promise that resolves when the user is added to chats.
   */
  const handleAdd = async () => {
    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
      const newChatRef = doc(chatRef); // Create a reference for a new chat document

      // Set up the new chat document with initial data
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Update user chats for the current user
      await updateDoc(doc(userChatsRef, user.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      // Update user chats for the found user
      await updateDoc(doc(userChatsRef, currentUser.id), {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });
    } catch (err) {
      console.log(err); // Log any errors encountered during adding
    }
  };

  return (
    <div className='addUser' ref={ref}>
      <form onSubmit={handleSearch}>
        <input
          type='text'
          placeholder='نام کاربری'
          name='username'
          dir='auto'
        />
        <button type='submit'>جست و جو</button>
      </form>
      {user && (
        <div className='user'>
          <div className='detail'>
            <img src={user.avatar || "./avatar.png"} alt='' />
            <span>{user.username || "Unknown User"}</span>
          </div>
          <button onClick={handleAdd}>اضافه کردن کاربر</button>
        </div>
      )}
    </div>
  );
});

// Set display name for the component for better debugging
AddUser.displayName = "AddUser";

export default AddUser;
