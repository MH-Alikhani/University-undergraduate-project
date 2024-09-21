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
 * Login component handling both user registration and login functionality.
 * It includes form validation (email, password), avatar upload, and Firebase authentication.
 */
const Login = () => {
  // State variables for managing form loading, avatar image, form validation, etc.
  const [loading, setLoading] = useState(false); // Controls loading spinner on form submission
  const [avatar, setAvatar] = useState({ file: null, url: "" }); // Stores uploaded avatar file and URL for preview
  const [passwordMismatch, setPasswordMismatch] = useState(false); // Flags if password and confirm password don't match
  const [emailError, setEmailError] = useState(""); // Holds validation message for invalid email
  const [passwordError, setPasswordError] = useState(""); // Holds validation message for invalid password
  const [valid, setValid] = useState(true); // Tracks overall form validation status

  /**
   * Handles avatar file selection and updates the avatar state.
   * @param {Object} e - The file input change event.
   */
  const handleAvatar = useCallback((e) => {
    const file = e.target.files[0]; // Get the selected file
    if (file) {
      // Update avatar state with selected file and create a URL for preview
      setAvatar({
        file,
        url: URL.createObjectURL(file),
      });
    }
  }, []);

  /**
   * Validates the email format using a regular expression.
   * Displays an error message if the email is invalid.
   * @param {string} email - The email address to validate.
   */
  const validateEmail = (email) => {
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/; // Email regex pattern
    if (!emailRegex.test(email)) {
      setEmailError("ایمیل وارد شده معتبر نیست"); // Invalid email message (in Persian)
      setValid(false);
    } else {
      setEmailError(""); // Clear error if email is valid
      setValid(true);
    }
  };

  /**
   * Validates the password based on length, inclusion of numbers, and case requirements.
   * Displays appropriate error messages if password is invalid.
   * @param {string} password - The password to validate.
   */
  const validatePassword = (password) => {
    const minLength = 8; // Minimum password length requirement
    const hasNumber = /\d/; // At least one number
    const hasUpper = /[A-Z]/; // At least one uppercase letter
    const hasLower = /[a-z]/; // At least one lowercase letter

    if (password.length < minLength) {
      setPasswordError("رمز عبور باید حداقل ۸ کاراکتر باشد"); // Error message for password length
      setValid(false);
    } else if (!hasNumber.test(password)) {
      setPasswordError("رمز عبور باید حداقل شامل یک عدد باشد"); // Error for missing number
      setValid(false);
    } else if (!hasUpper.test(password)) {
      setPasswordError("رمز عبور باید حداقل شامل یک حرف بزرگ باشد"); // Error for missing uppercase letter
      setValid(false);
    } else if (!hasLower.test(password)) {
      setPasswordError("رمز عبور باید حداقل شامل یک حرف کوچک باشد"); // Error for missing lowercase letter
      setValid(false);
    } else {
      setPasswordError(""); // Clear error if password is valid
      setValid(true);
    }
  };

  /**
   * Handles user registration using Firebase Authentication and Firestore.
   * Validates form input, checks password match, uploads avatar if provided, and saves user data to Firestore.
   * @param {Object} e - The form submit event.
   */
  const handleRegister = useCallback(
    async (e) => {
      e.preventDefault(); // Prevent form default submit behavior
      setLoading(true); // Show loading spinner during submission

      const formData = new FormData(e.target); // Extract form data
      const { username, email, password, confirmPassword } =
        Object.fromEntries(formData);

      // Validate email and password
      validateEmail(email);
      validatePassword(password);

      // Stop if validation fails
      if (!valid) {
        setLoading(false);
        return;
      }

      // Check if password matches confirmation
      if (password !== confirmPassword) {
        setPasswordMismatch(true); // Display password mismatch error
        setLoading(false);
        return;
      }

      setPasswordMismatch(false); // Clear password mismatch error

      try {
        // Create a new user with Firebase Auth
        const { user } = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        // Upload avatar image if one is selected
        const imgUrl = avatar.file ? await upload(avatar.file) : "";

        // Save user details to Firestore 'users' and 'userchats' collections
        const userDoc = doc(db, "users", user.uid); // Reference to 'users' document
        const userChatDoc = doc(db, "userchats", user.uid); // Reference to 'userchats' document

        await setDoc(userDoc, {
          username,
          email,
          avatar: imgUrl,
          id: user.uid,
          blocked: [], // Blocked users list (initially empty)
        });

        await setDoc(userChatDoc, {
          chats: [], // Initialize chats as an empty array
        });

        toast.success("حساب کاربری با موفقیت ساخته شد!"); // Success message (in Persian)
      } catch (error) {
        console.error("Registration Error:", error); // Log registration error
        toast.error(error.message); // Show error message
      } finally {
        setLoading(false); // Hide loading spinner after registration
      }
    },
    [avatar, valid] // Dependencies: re-run callback when avatar or valid changes
  );

  /**
   * Handles user login using Firebase Authentication.
   * @param {Object} e - The form submit event.
   */
  const handleLogin = useCallback(async (e) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Show loading spinner during login

    const formData = new FormData(e.target); // Extract form data
    const { email, password } = Object.fromEntries(formData); // Destructure email and password from form data

    try {
      // Sign in user with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login Error:", error); // Log login error
      toast.error(error.message); // Display login error message
    } finally {
      setLoading(false); // Hide loading spinner after login
    }
  }, []);

  return (
    <div className='login'>
      {/* Login form */}
      <div className='item'>
        <h2>خوش آمدید</h2>
        <form onSubmit={handleLogin}>
          <input
            type='email'
            placeholder='ایمیل'
            name='email'
            dir='rtl'
            required
          />
          <input
            type='password'
            placeholder='رمز عبور'
            name='password'
            dir='rtl'
            required
          />
          <button type='submit' disabled={loading}>
            {loading ? "در حال بارگذاری..." : "ورود"}
          </button>
        </form>
      </div>

      <div className='separator'></div>

      {/* Registration form */}
      <div className='item'>
        <h2>ایجاد حساب کاربری</h2>
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
            dir='rtl'
            required
          />
          <input
            type='email'
            placeholder='ایمیل'
            name='email'
            dir='rtl'
            onBlur={(e) => validateEmail(e.target.value)}
            required
          />
          {emailError && <p className='error'>{emailError}</p>}
          <input
            type='password'
            placeholder='رمز عبور'
            name='password'
            dir='rtl'
            onBlur={(e) => validatePassword(e.target.value)}
            required
          />
          {passwordError && <p className='error'>{passwordError}</p>}
          <input
            type='password'
            placeholder='تأیید رمز عبور'
            name='confirmPassword'
            dir='rtl'
            required
          />
          {passwordMismatch && (
            <p className='error'>رمز عبور و تأیید آن یکسان نیست</p>
          )}
          <button type='submit' disabled={loading}>
            {loading ? "در حال بارگذاری..." : "ثبت نام"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
