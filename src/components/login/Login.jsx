// File: src/components/Login.js

import React, { useState, useCallback } from "react";
import { auth, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../lib/upload";
import { toast } from "react-toastify";
import "./login.css";

/**
 * Login component for user authentication.
 *
 * Handles user login and registration, including avatar upload.
 * @returns {JSX.Element} The rendered Login component.
 */
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState({ file: null, url: "" });

  /**
   * Handles avatar file selection and updates the state with file and preview URL.
   * @param {React.ChangeEvent<HTMLInputElement>} e The input change event.
   */
  const handleAvatar = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar({
        file,
        url: URL.createObjectURL(file),
      });
    }
  }, []);

  /**
   * Handles user registration with Firebase Authentication and Firestore.
   * @param {React.FormEvent<HTMLFormElement>} e The form submission event.
   */
  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      const formData = new FormData(e.target);
      const { username, email, password } = Object.fromEntries(formData);

      try {
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const imgUrl = avatar.file ? await upload(avatar.file) : "";

        const userDoc = doc(db, "users", user.uid);
        const userChatDoc = doc(db, "userchats", user.uid);

        await setDoc(userDoc, {
          username,
          email,
          avatar: imgUrl,
          id: user.uid,
          blocked: [],
        });

        await setDoc(userChatDoc, {
          chats: [],
        });

        toast.success("حساب کاربری با موفقیت ساخته شد!");
      } catch (error) {
        console.error("Registration Error:", error);
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    },
    [avatar]
  );

  /**
   * Handles user login with Firebase Authentication.
   * @param {React.FormEvent<HTMLFormElement>} e The form submission event.
   */
  const handleLogin = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login Error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className='login'>
      <div className='item'>
        <h2>خوش آمدید</h2>
        <form onSubmit={handleLogin}>
          <input type='email' placeholder='ایمیل' name='email' required />
          <input type='password' placeholder='پسورد' name='password' required />
          <button type='submit' disabled={loading}>
            ورود
          </button>
        </form>
      </div>
      <div className='separator'></div>
      <div className='item'>
        <h2>ساخت حساب کاربری</h2>
        <form onSubmit={handleRegister}>
          <label htmlFor='file'>
            <img src={avatar.url || "./avatar.png"} alt='Profile' />
            آپلود عکس پروفایل
          </label>
          <input
            type='file'
            id='file'
            style={{ display: "none" }}
            onChange={handleAvatar}
          />
          <input
            type='text'
            placeholder='نام کاربری'
            name='username'
            dir='auto'
            required
          />
          <input
            type='email'
            placeholder='ایمیل'
            name='email'
            dir='auto'
            required
          />
          <input
            type='password'
            placeholder='رمز عبور'
            name='password'
            dir='auto'
            required
          />
          <button type='submit' disabled={loading}>
            ثبت نام
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
