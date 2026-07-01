import { Router } from "express";
import registerUser from "../controllers/RegisterUser.controllers.js";

import { upload } from "../midlewares/Multer.midleware.js";
import { verifyJWT } from "../midlewares/auth.midleware.js";
import { loginUser,logOutUser,RefreshToken,changeCurrentPassword,
    getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage
    ,getUserChannelProfile,getWatchHistory } from "../controllers/User.controllers.js";

const router = Router();

const UserRoute = router.route("/register").post(upload.fields(
    [{
     name : "avatar",
     maxCount : 1
    },{
      name : "coverImage",
      maxCount:1
    }]
),registerUser);

const LoginRoute = router.route("/login").post(loginUser)
const LogoutRoute = router.route("/logout").post(verifyJWT,logOutUser)
const Refresh_Token = router.route("/Refresh-Token").post(RefreshToken)

router.route("/logout").post(verifyJWT,  logOutUser)
router.route("/refresh-token").post(RefreshToken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)





export default router;