import { useUserStore } from "../../../lib/userStore";
import "./userInfo.css";

const UserInfo = () => {
  const { currentUser } = useUserStore();

  return (
    <div className='userInfo'>
      <div className='user'>
        <img src={currentUser.avatar || "/avatar.png"} alt='avatar' />
        <h2>{currentUser.username || "کاربر"}</h2>
      </div>
    </div>
  );
};

export default UserInfo;
