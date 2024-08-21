// file: upload.js

import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Uploads a file to Firebase Storage and returns the download URL.
 * @param {File} file - The file to be uploaded.
 * @returns {Promise<string>} - A promise that resolves to the download URL of the uploaded file.
 * @throws {Error} - Throws an error if the upload fails.
 */
const upload = async (file) => {
  try {
    const formattedDate = new Date().toISOString().replace(/[:.]/g, "-");
    const storageRef = ref(storage, `images/${formattedDate}-${file.name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    const downloadURL = await new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        handleProgress,
        (error) => {
          console.error("آپلود موفق نبود: ", error.code);
          reject(new Error("آپلود موفقت آمیز نبود. دوباره تلاش کنید."));
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(new Error("خطا در گرفتن url"));
          }
        }
      );
    });

    return downloadURL;
  } catch (error) {
    throw new Error(`مشکلی در آپلود رخ داده است: ${error.message}`);
  }
};

/**
 * Handles the progress of the file upload.
 * @param {object} snapshot - The snapshot object containing the upload progress.
 */
const handleProgress = (snapshot) => {
  const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  console.info(`تکمیل شده است ${progress.toFixed(2)}%`);
};

export default upload;
