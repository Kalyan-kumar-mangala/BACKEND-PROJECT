import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})


const uploadOnCloudinary = async (localFilePath) => {
    //console.log(cloudinary.config())
    try {
        //console.log("reached before if condition");
        if (!localFilePath) {
           return null;
        }
        // console.log("reached after if condition");
        // console.log(process.cwd())
        // console.log(localFilePath)
        // console.log(fs.existsSync(localFilePath))
        // console.log(process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET, process.env.CLOUDINARY_CLOUD_NAME)
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        // file has been uploaded successfull
        //console.log("file is uploaded on cloudinary ", response.url);
       // console.log("this is before unlinking");
        fs.unlinkSync(localFilePath);
        //console.log(`this is response ${response}`);
        return response;
        

    } catch (error) {
        console.log(error)
        console.log("unlinking cause of error");
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



async function deleteImageByUrl(imageUrl) {
  try {
    // 1. Extract the ID
    const publicId = getPublicIdFromUrl(imageUrl);
    
    // 2. Trigger deletion
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true // Clears CDN cache so the URL stops working immediately
    });
    
    return result;
  } catch (error) {
    console.error("Failed to delete asset:", error);
    throw error;
  }
}

// Usage execution:
const targetUrl = "https://cloudinary.com";
deleteImageByUrl(targetUrl);



export {uploadOnCloudinary,deleteImageByUrl}