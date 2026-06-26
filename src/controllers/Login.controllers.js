import { User } from "../models/User.models";
import ApiError from "../utils/apierror";
import asyncHandler from "../utils/asynhandler.js"; 

async function generateAccessTokenAndRefreshToken(userId){

    const user = await User.findById(userId);

    try {
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        User.refreshToken = refreshToken;

        await User.save({validateBeforeSave : false});

    } catch (error) {
        throw new ApiError(500,"something went wrong while generating refresh token and access token")
        
    }

}

const loginUser = asyncHandler(async (req,res) =>{

    //get username,email,password
    //validate with database -> if not found throw error
    //verify password and generate tokens

    const{email,username,password} = req.body;
    
    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or : [email,username]
    }
    )


    if(!user){
        throw new ApiError(404,"user does not exist");

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

     

})

export  default loginUser;