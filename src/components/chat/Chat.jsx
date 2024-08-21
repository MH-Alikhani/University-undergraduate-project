import "./chat.css";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { format, register } from "timeago.js";
import upload from "../../lib/upload";
import { db } from "../../lib/firebase";
import EmojiPicker from "emoji-picker-react";
import useChatStore from "../../lib/chatStore";
import { useUserStore } from "../../lib/userStore";
import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Chat component to handle user messages and interactions.
 * @component
 */
const Chat = () => {
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [img, setImg] = useState({ file: null, url: "" });
  const [loading, setLoading] = useState(false); // Loading state for async operations

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } =
    useChatStore();

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => {
      unSub();
    };
  }, [chatId]);

  useEffect(() => {
    register(
      "fa",
      (number, index) =>
        [
          ["همین حالا", "همین حالا"],
          ["%s ثانیه پیش", "در %s ثانیه"],
          ["1 دقیقه پیش", "در 1 دقیقه"],
          ["%s دقیقه پیش", "در %s دقیقه"],
          ["1 ساعت پیش", "در 1 ساعت"],
          ["%s ساعت پیش", "در %s ساعت"],
          ["1 روز پیش", "در 1 روز"],
          ["%s روز پیش", "در %s روز"],
          ["1 هفته پیش", "در 1 هفته"],
          ["%s هفته پیش", "در %s هفته"],
          ["1 ماه پیش", "در 1 ماه"],
          ["%s ماه پیش", "در %s ماه"],
          ["1 سال پیش", "در 1 سال"],
          ["%s سال پیش", "در %s سال"],
        ][index]
    );
  }, []);

  const handleEmoji = useCallback((e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  }, []);

  const handleImg = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setImg({ file, url: URL.createObjectURL(file) });
    }
  }, []);

  /**
   * Sends the message and optionally an image to the Firestore.
   */
  const handleSend = useCallback(async () => {
    if (!text.trim() && !img.file) return;

    if (!currentUser || !user || !chatId) {
      console.error("Missing currentUser, user, or chatId");
      return;
    }

    setLoading(true); // Set loading state to true

    let imgUrl = null;

    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const userIDs = [currentUser.id, user.id];

      await Promise.all(
        userIDs.map(async (id) => {
          const userChatsRef = doc(db, "userchats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);

          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chats.findIndex(
              (c) => c.chatId === chatId
            );

            if (chatIndex !== -1) {
              userChatsData.chats[chatIndex] = {
                ...userChatsData.chats[chatIndex],
                lastMessage: text || "Image",
                isSeen: id === currentUser.id,
                updatedAt: new Date(),
              };

              await updateDoc(userChatsRef, { chats: userChatsData.chats });
            }
          }
        })
      );
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false); // Reset loading state
      setImg({ file: null, url: "" });
      setText("");
    }
  }, [text, img, currentUser, chatId, user]);

  return (
    <div className='chat'>
      <div className='top'>
        <div className='user'>
          <img src={user?.avatar || "./avatar.png"} alt='User Avatar' />
          <div className='texts'>
            <span>{user?.username || "کاربر"}</span>
            <p>{user?.email || "ایمیل در دسترس نیست"}</p>
          </div>
        </div>
      </div>
      <div className='center'>
        {chat?.messages?.map((message, index) => (
          <div
            className={`message ${
              message.senderId === currentUser?.id ? "own" : "notOwn"
            }`}
            key={message?.createdAt?.toMillis() || index}
          >
            <div className='texts'>
              {message.img && <img src={message.img} alt='Message Image' />}
              <p dir='auto'>{message.text}</p>
              <span>{format(message.createdAt?.toDate(), "fa")}</span>
            </div>
          </div>
        ))}
        {img.url && (
          <div className='message own'>
            <div className='texts'>
              <img src={img.url} alt='Preview Image' />
            </div>
          </div>
        )}
        <div ref={endRef}></div>
      </div>

      <div className='bottom'>
        <div className='icons'>
          <label htmlFor='file'>
            <img src='./img.png' alt='Upload Icon' />
          </label>
          <input
            type='file'
            id='file'
            style={{ display: "none" }}
            onChange={handleImg}
          />
        </div>
        <input
          type='text'
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "شما نمی توانید پیام ارسال کنید"
              : "در اینجا بنویسید"
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked || loading} // Disable input during loading
        />
        <div className='emoji'>
          <img
            src='./emoji.png'
            alt='Emoji Picker'
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className='picker'>
              <EmojiPicker onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>
        <button
          className='sendButton'
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked || loading} // Disable button during loading
        >
          {loading ? "در حال ارسال..." : "ارسال"} {/* Display loading text */}
        </button>
      </div>
    </div>
  );
};

export default Chat;
