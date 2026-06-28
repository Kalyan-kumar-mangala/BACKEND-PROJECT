import { User } from "../models/User.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynhandler.js"; 
import ApiResponse from "../utils/apiresponse.js";
import jwt from "jsonwebtoken"


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

export {loginUser,logOutUser,RefreshToken}
