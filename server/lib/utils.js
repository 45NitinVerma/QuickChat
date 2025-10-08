import jwt from "jsonwebtoken";

// generate token
export const generateToken = (userId) => {
	const token = jwt.sign(
		{
			userId,
		},
		process.env.JWT_SECRET, // secret key
		{ expiresIn: "24h" } 
	);

    return token;
};
