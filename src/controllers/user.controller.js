import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { upload } from '../middlewares/multer.middleware.js';
import { ApiResponse } from '../utils/ApiResponse.js';

const registerUser = asyncHandler(async (req, res)=>{
//get user details from frontend
//validate the user details
//check if user already exists
//check for images ,avatar
//upload image and avatar to the cloudinary
//create user object - create entry in db
//remove password and refresh token from the response
//check for user creation success
//return response to frontend

const {fullname, email, username, password} = req.body;
console.log("email:", email);

//validate user details
if ([username, email, password, fullname].some((field)=> 
    field?.trim()==="")
)
     {
        throw new ApiError(400, "All fields are required")
    
}
//check if user already exists
const existedUser = User.findOne({
    $or: [{ email },{ username}]
})

if(existedUser){
    throw new ApiError(409, "User already exists with this email or username")  
}

//check for images ,avatar
const avatarLocalPath =req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;

if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required")
}

//upload image and avatar to the cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

if (!avatar) {
    throw new ApiError(400, "Avatar  is required")
    
}

//create user object - create entry in db
const user = await User.create({
    username,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url|| "",
    email,
    fullname,
    password
})

//remove password and refresh token from the response
const createdUser = await User.findById(user._id).select("-password -refreshToken")

//check for user creation
if(!createdUser){
    throw new ApiError(500, "User registration failed")
}

//return response to frontend
return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
)

})

export {registerUser}