import { Router } from "express";
import registerUser from "../controllers/RegisterUser.controllers.js";

import { upload } from "../midlewares/Multer.midleware.js";


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

const LoginRoute = router.route()

export default router;