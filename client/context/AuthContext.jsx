import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const navigate = useNavigate()

	const [authUser, setAuthUser] = useState(null);
	const [onlineUsers, setOnlineUsers] = useState([]);
	const [socket, setSocket] = useState(null);

	// check if user is authenticated and if so, set the user data and connect the socket
	const checkAuth = async () => {
		try {
			const { data } = await axios.get("/api/auth/check");
			if (data.success) {
				setAuthUser(data.user);
				connectSocket(data.user);
			}
		} catch (error) {
			toast.error("Unauthorized")
		}
	};

	// login function to handle user authentication and socket connection
	const login = async (state, credentials) => {
		try {
			const { data } = await axios.post(
				`/api/auth/${state}`,
				credentials,
				{
					withCredentials: true,
				}
			);
			console.log("Login API response:", data);
			if (data.success) {
				setAuthUser(data.user);
				connectSocket(data.user);
				toast.success(data.message);
				return true;
			} else {
				toast.error(data.message);
				return false;
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Login failed");
			return false;
		}
	};

    // logout function to handle user logout and socket disconnection
    const logout = async () => {
	try {
		await axios.post("/api/auth/logout", {}, { withCredentials: true });

		if (socket) socket.disconnect();
		setAuthUser(null);
		setOnlineUsers([]);
		toast.success("Logged out successfully");
	} catch (error) {
		toast.error("Failed to log out");
	}
};


    // update profile function to handle user profile updates
    const updateProfile = async(body) => {
        try {
            const {data} = await axios.put('/api/auth/update-profile', body);
            if(data.success) {
                setAuthUser(data.user)
                toast.success("Profile updated successfully")
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Profile update failed");
        }
    }

	// connect socket function to handle socket connection and online users uppdates
	const connectSocket = (userData) => {
		if (!userData || socket?.connected) return;
		const newSocket = io(backendUrl, {
			query: {
				userId: userData._id,
			},
			withCredentials: true,
		});
		newSocket.connect();
		setSocket(newSocket);

		newSocket.on("getOnlineUsers", (userIds) => {
			setOnlineUsers(userIds);
		});
	};

	useEffect(() => {
		checkAuth();
	}, []);

	const value = {
		axios,
		authUser,
		onlineUsers,
		socket,
        login,
        logout,
        updateProfile
	};
	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
};
