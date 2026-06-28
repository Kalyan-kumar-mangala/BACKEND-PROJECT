import cookieParser from "cookie-parser";
import { User } from "../models/User.models.js";
import asyncHandler from "../utils/asynhandler.js";
import ApiError from "../utils/apierror.js";
import jwt from "JsonWebToken";

export const verifyJWT = asyncHandler(async(req,res,next)=>{

   try {
     const token = req.cookies?.accessToken || req.headers("accessToken").replace("Bearer ", "");
 
     if(!token){
         throw new ApiError(401, "Unauthorized request");
     }
     
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
     
         if (!user) {
             
             throw new ApiError(401, "Invalid Access Token")
         }
     
         req.user = user;
         next()
 
   } catch (error) {

    throw new ApiError( 401, error?.message || "invalid access token" )
    
   }
})