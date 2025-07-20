import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body
    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false
      });
    };
    
    const file = req.file;
    let profilePhotoUrl = "";
    
    if (file) {
      try {
        const fileUri = getDataUri(file);
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
          resource_type: 'image',
          public_id: `profile_photos/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          access_mode: 'public'
        });
        profilePhotoUrl = cloudResponse.secure_url;
      } catch (uploadError) {
        console.log("Error uploading profile photo to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Failed to upload profile photo. Please try again.",
          success: false
        });
      }
    }

    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({
        message: 'User already exist with this email.',
        success: false,
      })
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile:{
        profilePhoto: profilePhotoUrl,
      }
    })

    return res.status(200).json({
      message: "Account created successfully",
      success: true
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
}
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body
    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false
      });
    };
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    };
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    };
    // check role is correct
    if (role !== user.role) {
      return res.status(400).json({
        message: "Account doesn't exist with current role.",
        success: false
      })
    }
    const tokenData = {
      userId: user._id
    }
    const token = await jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: '1d' });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile
    }

    // For deployed environment, we need to set secure cookies
    const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined;
    
    console.log("Login - Setting cookie with settings:", {
        maxAge: 1 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/'
    });
    
    return res.status(200).cookie("token", token, { 
        maxAge: 1 * 24 * 60 * 60 * 1000, 
        httpOnly: true, 
        sameSite: 'none',
        secure: true,
        path: '/'
    }).json({
      message: `Welcome back ${user.fullname}`,
      user,
      success: true
    })

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
}
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { 
        maxAge: 0,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
        path: '/'
    }).json({
      message: "Logged out successfully.",
      success: true
    })
  } catch (error) {
    console.log(error);
  }
}
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const files = req.files; // Now we get files object with multiple files
    
    let skillsArray;
    if (skills) {
      skillsArray = skills.split(",").map(skill => skill.trim());
    }
    
    const userId = req.id; // middleware authentication
    let user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
        success: false
      })
    }
    
    // updating data
    if (fullname) user.fullname = fullname
    if (email) user.email = email
    if (phoneNumber) user.phoneNumber = phoneNumber
    if (bio) user.profile.bio = bio
    if (skillsArray) user.profile.skills = skillsArray

    // Handle profile photo upload
    if (files && files.profilePhotoFile && files.profilePhotoFile[0]) {
      const profilePhotoFile = files.profilePhotoFile[0];
      const fileUri = getDataUri(profilePhotoFile);
      
      try {
        const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
          resource_type: 'image',
          public_id: `profile_photos/${userId}_${Date.now()}`,
          access_mode: 'public'
        });
        user.profile.profilePhoto = cloudResponse.secure_url;
      } catch (uploadError) {
        console.log("Error uploading profile photo to Cloudinary:", uploadError);
        return res.status(500).json({
          message: "Failed to upload profile photo. Please try again.",
          success: false
        });
      }
    }

    // Handle resume upload
    if (files && files.resumeFile && files.resumeFile[0]) {
      const resumeFile = files.resumeFile[0];
      console.log("Uploading resume file:", {
        originalname: resumeFile.originalname,
        mimetype: resumeFile.mimetype,
        size: resumeFile.size
      });
      try {
        const streamUpload = (buffer) => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                resource_type: 'raw',
                public_id: `resumes/${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.pdf`,
                access_mode: 'public',
                use_filename: false,
                unique_filename: true
              },
              (error, result) => {
                if (result) resolve(result);
                else reject(error);
              }
            );
            stream.end(buffer);
          });
        };
        const cloudResponse = await streamUpload(resumeFile.buffer);
        console.log("Resume uploaded successfully:", {
          url: cloudResponse.secure_url,
          public_id: cloudResponse.public_id,
          format: cloudResponse.format
        });
        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = resumeFile.originalname;
      } catch (uploadError) {
        console.log("Error uploading resume to Cloudinary:", uploadError);
        console.log("Error details:", {
          message: uploadError.message,
          code: uploadError.code,
          http_code: uploadError.http_code
        });
        return res.status(500).json({
          message: "Failed to upload resume. Please try again.",
          success: false
        });
      }
    }

    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile
    }

    return res.json({
      message: "Profile updated successfully.",
      user,
      success: true
    })
  } catch (error) {
    console.log("Error updating profile:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false
    });
  }
}