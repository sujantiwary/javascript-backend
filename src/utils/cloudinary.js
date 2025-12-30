import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (LocalPath)=>{
    try {
        if(!LocalPath) return null;
        //upload  the file on cloudinary
         const response = await cloudinary.uploader.upload(LocalPath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        console.log("File uploaded successfully on cloudinary", response.secure_url);
        return response;
        
    } catch (error) {
        fs.unlinkSync(LocalPath)  // remove the file from local storage if any error occurs
        return null;
        
    }
}

export {uploadOnCloudinary}