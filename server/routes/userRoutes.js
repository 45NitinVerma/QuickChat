import express from 'express'
import { checkAuth, login, signup, updateProfile } from '../controllers/userController.js';
import { protectRoute } from '../middleware/auth.js';

const userRouter = express.Router();

// endpoints
userRouter.post('/signup', signup)
userRouter.post('/login', login)
// backend: routes/auth.js
userRouter.post("/logout", (req, res) => {
	res.clearCookie("token", {
		httpOnly: true,
		sameSite: "none",
		secure: true,
	});
	return res.json({ success: true, message: "Logged out" });
});

userRouter.put('/update-profile', protectRoute, updateProfile)
userRouter.get('/check', protectRoute, checkAuth)

export default userRouter;