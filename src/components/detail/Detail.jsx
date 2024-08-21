import { useEffect } from "react";
import useChatStore from "../../lib/chatStore";
import { auth, db } from "../../lib/firebase";
import { useUserStore } from "../../lib/userStore";
import {
  doc,
  updateDoc,
  arrayRemove,
  arrayUnion,
  onSnapshot,
} from "firebase/firestore";
import "./detail.css";

/**
 * Detail component displays user details and provides block/unblock and logout functionality.
 * @returns {JSX.Element} The Detail component.
 */
const Detail = () => {
  const {
    user,
    isCurrentUserBlocked,
    isReceiverBlocked,
    changeBlock,
    setUser,
  } = useChatStore();
  const { currentUser } = useUserStore();

  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, "users", user.id);

    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      if (doc.exists()) {
        setUser(doc.data());
      }
    });

    return () => unsubscribe();
  }, [user, setUser]);

  const handleBlock = async () => {
    if (!user || !currentUser) return;

    const userDocRef = doc(db, "users", currentUser.id);

    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
      });
      changeBlock();
    } catch (err) {
      console.error("Error updating block status:", err);
    }
  };

  const handleLogout = () => {
    auth.signOut().catch((err) => console.error("Error during sign out:", err));
  };

  return (
    <div className='detail'>
      <div className='user'>
        <img src={user?.avatar || "./avatar.png"} alt='User Avatar' />
        <h2>{user?.username || " کاربر"}</h2>
        <p>{user?.email || " ایمیل در دسترس نیست"}</p>
      </div>
      <div className='info'>
        <button className='block' onClick={handleBlock}>
          {isCurrentUserBlocked
            ? "شما مسدود شده اید!"
            : isReceiverBlocked
            ? "کاربر مسدود شده است"
            : "مسدود کردن کاربر"}
        </button>
        <button className='logout' onClick={handleLogout}>
          خروج
        </button>
      </div>
    </div>
  );
};

export default Detail;
