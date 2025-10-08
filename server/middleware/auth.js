import jwt from 'jsonwebtoken'
import User from '../models/User.js';

// middleware to protect routes
async function protectRoute(req, res, next) {
	const token = req.cookies.token; // get token from cookies

	if (!token) {
		return res.status(401).json({ message: "Please login first" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User
			.findById(decoded.userId)
			.select("-password");

		if (!user)
			return res.json({ success: false, message: "User not found" });

		req.user = user; // add user to request and able to get in controller
		next();
	} catch (error) {
		console.log(error.message);
		res.status(500).json({ message: "Invalid token" });
	}
}

export {protectRoute}