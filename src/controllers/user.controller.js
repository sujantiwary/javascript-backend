import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { upload } from "../middlewares/multer.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshToken = async(userId)=>{
    try {
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      user.refreshToken = refreshToken
      await user.save({validateBeforeSave: false})
      return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens")
    }
  }


const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validate the user details
  //check if user already exists
  //check for images ,avatar
  //upload image and avatar to the cloudinary
  //create user object - create entry in db
  //remove password and refresh token from the response
  //check for user creation success
  //return response to frontend

  

  const { fullname, email, username, password } = req.body;
  // console.log("email:", email);

  //validate user details
  if (
    [username, email, password, fullname].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  //check if user already exists
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists with this email or username");
  }
  // console.log("req.files:", req.files);
  // console.log("REQ BODY:", req.body);

  //check for images ,avatar
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  // avatar is mandatory
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image is required");
  }

  // upload avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed");
  }

  // upload cover image ONLY if provided
  let coverImage = null;

  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
 console.log("coverImage:", coverImage);
    if (!coverImage) {
      throw new ApiError(500, "Cover image upload failed");
    }
  }

  //create user object - create entry in db
  const user = await User.create({
    username,
    avatar: avatar.secure_url,
    coverImage: coverImage?.secure_url || "",
    email,
    fullname,
    password,
  });

  //remove password and refresh token from the response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "User registration failed");
  }

  //return response to frontend
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res)=>{
  //req body - username , password
  //username or password
  //find the user
  //password check
  //access and  refresh token
  //send cookie
  
 console.log("Hello:", req.body);
  const { username, email, password} = req.body;
  if (!username && !email){
    throw new ApiError(400, "username and email is required")
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  if (!user) {
    throw new ApiError (404, "User not found")
    
  }
  
  const isPasswordCorrect = await user.isPasswordCorrect(password)
  if (!isPasswordCorrect){
    throw new ApiError(401, "Invalid user credentials")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
  const options = {
    httpOnly: true,
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User logged in successfully"

      )
    )


});


const logOutUser = asyncHandler(async (req, res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new:true
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
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async(req ,res)=>{
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken
  if (!incomingRefreshToken) {
    throw new ApiError(401 , "Unauthorized request")
  }

    try {
      const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
      const user = await User.findById(decodedToken?._id)
      if (!user) {
      throw new ApiError(401 , "Invalid refresh token")}
  
      if (incomingRefreshToken !== user?.refreshToken) {
        
        throw new ApiError(401, "Refresh token is expired or used")
      }
    const options ={
      httpOnly:true,
      secure: true
    }
  
   const{accessToken, newRefreshToken} =  await generateAccessAndRefreshToken(user._id)
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
    } catch (error) {
      throw new ApiError(401, error?.message || "Inavlid refresh token")
      
    }
  

})

export { registerUser, loginUser, logOutUser, refreshAccessToken };
