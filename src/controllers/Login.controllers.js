import { User } from "../models/User.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynhandler.js"; 
import ApiResponse from "../utils/apiresponse.js";
import jwt from "jsonwebtoken"
import { uploadOnCloudinary, deleteImageByUrl } from "../utils/cloudinary.js";


// token generator

async function generateAccessTokenAndRefreshToken(userId){

    const user = await User.findById(userId);

    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave : false});

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh token and access token",{error})
        
    }

}

//login controller

const loginUser = asyncHandler(async (req,res) =>{

    //get username,email,password
    //validate with database -> if not found throw error
    //verify password and generate tokens

    const{email, username, password} = req.body
    
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [{email},{username}]
    }
    )


    if(!user){
        throw new ApiError(404,"user does not exist");

    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }
    
    const{accessToken,refreshToken} = await  generateAccessTokenAndRefreshToken(user._id);

     
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})

// logout controller

const logOutUser = asyncHandler(async (req,res)=>{

    await User.findByIdAndUpdate(

        req.user._id,
        {
          $set : {refreshToken : undefined}
        }
    )
    
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

     

})

// Refresh token verifier

const RefreshToken = asyncHandler(async(req,res,next)=>{

    const IncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!IncomingRefreshToken){
        throw new ApiError(401,"invalid request")
    }

    try {
    const DecodedRefreshToken = jwt.verify(IncomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
    throw new ApiError(401,"invalid signature(token)")
    }

    const user = await User.findById(DecodedRefreshToken?._id);

    if(!(user.refreshToken == IncomingRefreshToken)){  // to check if Incoming token is not outdated with database token

        throw new ApiError(401,"invalid token(outdated Refresh Token)")

    }

    const options = {
        httpOnly: true,
        secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )


})

//change currentPassword controller

const changeCurrentPassword = asyncHandler(async(req,res)=>{

    const{oldPassword,newPassword} = req.body;

    user = await User.findById(req?.user?._id);
    
    if(!(await user.isPasswordCorrect(oldPassword))){
        throw new ApiError(401,"invalid oldPassword")
    };

    user.password = newPassword;
    await user.save({validateBeforeSave:false});
    const updatedUser = User.findById(user._id).select("-password -refreshToken")

    return res.status(200).json(
     new ApiResponse(200,{updatedUser},"password changed successfully")
    )
})

// fetch to current user controller
const getCurrentUser = asyncHandler(async(req,res)=>{

    return res.status(200).json(new ApiResponse(200,res?.user,"current user fetched sucessfully"));
})

//update other feilds of user
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

//update Avatar of user
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    //TODO: delete old image 
    const imageUrl = req?.user?.avatar;
    await deleteImageByUrl(imageUrl);


    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

// update coverImage of user
const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    //TODO: delete old image 
    const imageUrl = req?.user?.coverImage;
    if(imageUrl){
    await deleteImageByUrl(imageUrl);} 


    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelsSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel.length) {
        throw new ApiError(404, "Channel not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], "Channel profile fetched successfully"))
})


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = User.aggregate([{
        $match: {
            _id: mongoose.Types.ObjectId(req.user?._id)
        }
    },
    {
        $lookup:{
            from: "videos",
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
                //pipeline inside videos schema
                {
                //populating the owner of the video
                $lookup: {
                    from: "Users",
                    localField: "Owner",
                    foreignField: "_id",
                    as: "Owner",
                    //pipeline to only return the required fields of the owner
                    pipeline: [
                    // pipelining inside user schema  
                        {
                        $project: {
                            fullName: 1,
                            username: 1,
                            avatar: 1
                        }
                    }]
                }

            },
            // pipeline to overide the owner field to only return the first element of the array
            {
                $addFields: {
                    owner: {
                        $arrayElemAt: ["$owner", 0]
                    }
                }

            }]
        }
    },
    {
        $project: {
            watchHistory: 1
        } 
    }])

})

res.status(200).json(new ApiResponse(200, user[0], "Watch history fetched successfully"))


export {loginUser,logOutUser,RefreshToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage,getUserChannelProfile,getWatchHistory}
