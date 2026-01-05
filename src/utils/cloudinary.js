import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;

    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });

    // ✅ delete only if file exists
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    
    console.log("File uploaded successfully:", response.secure_url);
    return response;
  } catch (error) {
    // ✅ SAFE cleanup
    if (localPath && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }

    console.error("Cloudinary upload failed:", error);
    return null;
  }
};

export { uploadOnCloudinary };
