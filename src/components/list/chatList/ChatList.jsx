import "./chatList.css";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import AddUser from "./addUser/AddUser";
import { useUserStore } from "../../../lib/userStore";
import useChatStore from "../../../lib/chatStore";
import { doc, onSnapshot, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

/**
 * ChatList component that displays a list of chats with a search feature and the ability to add a new user.
 * @component
 */
const ChatList = () => {
  const addUserRef = useRef();
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");
  const { currentUser } = useUserStore();
  const { changeChat } = useChatStore();

  useEffect(() => {
    const fetchChats = async () => {
      const unSub = onSnapshot(
        doc(db, "userchats", currentUser.id),
        async (res) => {
          const items = res.data()?.chats || [];

          const chatData = await Promise.all(
            items.map(async (item) => {
              const userDocSnap = await getDoc(
                doc(db, "users", item.receiverId)
              );
              return { ...item, user: userDocSnap.data() };
            })
          );

          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      );

      return () => unSub();
    };

    fetchChats();
  }, [currentUser.id]);

  const handleSelect = useCallback(
    async (chat) => {
      const userChats = chats.map((item) => ({
        ...item,
        isSeen: item.chatId === chat.chatId ? true : item.isSeen,
      }));

      try {
        await updateDoc(doc(db, "userchats", currentUser.id), {
          chats: userChats,
        });
        changeChat(chat.chatId, chat.user);
      } catch (err) {
        console.error("Error updating chat:", err);
      }
    },
    [chats, currentUser.id, changeChat]
  );

  const debouncedInputHandler = useCallback(
    (e) => {
      const value = e.target.value.toLowerCase();
      const handler = setTimeout(() => setInput(value), 300);
      return () => clearTimeout(handler);
    },
    [setInput]
  );

  const filteredChats = useMemo(() => {
    return chats.filter((c) => c.user.username.toLowerCase().includes(input));
  }, [chats, input]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addUserRef.current && !addUserRef.current.contains(event.target)) {
        setAddMode(false);
      }
    };

    if (addMode) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

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
      {addMode && <AddUser ref={addUserRef} />}
    </div>
  );
};

export default ChatList;
