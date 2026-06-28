import { Router } from "express";
import registerUser from "../controllers/RegisterUser.controllers.js";

import { upload } from "../midlewares/Multer.midleware.js";
import { verifyJWT } from "../midlewares/auth.midleware.js";
import { loginUser,logOutUser,RefreshToken } from "../controllers/Login.controllers.js";

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



export default router;