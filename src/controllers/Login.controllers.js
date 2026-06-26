import { User } from "../models/User.models.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asynhandler.js"; 
import ApiResponse from "../utils/apiresponse.js";

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


const logOutUser = asyncHandler(async (req,res)=>{

    await User.findByIdAndUpdate(

        req.user._id,
        {
          $set : {accessToken : undefined}
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

export {loginUser,logOutUser}
