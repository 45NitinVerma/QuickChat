import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import cloudinary from '../lib/cloudinary.js'
import bcrypt from "bcryptjs";

// Signup a new user
async function signup(req, res) {
	const { fullName, email, password, bio } = req.body; // Destructuring assignment to extract user details from the request body got from route '/user/register'

	try {
		if (!fullName || !email || !password || !bio)
			return res.json({ success: false, message: "Missing Details." });

		// check if user already exists
		const isUserAlreadyExists = await User.findOne({ email: email });
		if (isUserAlreadyExists) {
			return res.status(400).json({
				message: "User already exists",
			});
		}

		// hash password before creating user and storing in database
		const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

		// create user
		const user = await User.create({
			fullName,
			email,
			password: hashedPassword,
			bio,
		});

		// create JWT token from lib/utils.js
		const token = generateToken(user._id);

		// send token in HTTP-only cookie
		res.cookie("token", token);

		// send response to client
		res.status(201).json({
			success: true,
			message: "User registered successfully",
			userData: user,
			token,
		});
	} catch (error) {
        console.log(error.message);
        res.json({
			success: false,
			message: error.message,
		});
    }
}

// Login user
async function login(req, res) {
    const { email, password } = req.body; // Destructuring assignment to extract user details from the request body got from route '/user/login'

    try {
        // check if user exists
    const user = await User.findOne({ email: email });
    if (!user) {
        return res.status(400).json({
            message: "Invalid email or password",
        });
    }

    // compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.status(400).json({
            message: "Invalid credentials",
        });
    }

    // create JWT token
    const token = generateToken(user)

    // send token in HTTP-only cookie
    res.cookie("token", token, {
		httpOnly: true,
		secure: true,
		sameSite: "none",
	});

    // send response to client
    res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user,
        token, 
    });
    } catch (error) {
        console.log(error.message);
        res.json({
			success: false,
			message: error.message,
		});
    }    
}

// controller to check user is authenticated
const checkAuth = (req, res) => {
	res.json({success: true, user: req.user});
}

// controller to update user profile details
const updateProfile = async (req, res) => {
try {
	const {profilePic, bio, fullName} = req.body

	const userId = req.user._id;
	let updatedUser;

	if(!profilePic){
		updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName}, {new: true});
	}else {
		const upload = await cloudinary.uploader.upload(profilePic);

		updatedUser = await User.findByIdAndUpdate(userId, {profilePic: upload.secure_url, bio, fullName}, {new:true})
	}
	res.json({
		success:true,
		user: updatedUser
	})

} catch (error) {
	console.log(error.message);
	res.json({success:false, message: error.message})
}
}

export {signup, login, checkAuth, updateProfile} 