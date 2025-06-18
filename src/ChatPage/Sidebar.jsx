import './Sidebar.css'
import image from '../assets/react.svg';
import { useContext, useState } from 'react';
import { collection, doc, getDoc, getDocs, query, setDoc, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../FirebaseConfig/firebase';
import { AuthContext } from '../Context/AuthContext';
import Contacts from './contacts';

// Sidebar component for user search and contact list
const Sidebar = () => {
    // State for search input, found user, and error
    const [username, setUsername] = useState("");
    const [user, setUser] = useState(null);
    const [err, setErr] = useState(null);
    const { Currentuser } = useContext(AuthContext);

    // Handle user search on Enter key
    const handleSearch = async (e) => {
        if (e.key === 'Enter' && username.trim() !== "") {
            const q = query(collection(db, "users"), where("displayName", "==", username));
            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    // Only use the first matching user
                    const docSnap = querySnapshot.docs[0];
                    setUser(docSnap.data());
                    setErr(null);
                } else {
                    setUser(null);
                    setErr("User not found");
                }
            } catch (error) {
                console.error("Error fetching user:", error);
                setUser(null);
                setErr("Error fetching user");
            }
        }
    };

    // Clear search state
    const clearSearch = () => {
        setUsername('');
        setUser(null);
        setErr(null);
    };

    // Handle selecting a user to start a chat
    const handleSelect = async () => {
        if (!user || !user.uid || !Currentuser || !Currentuser.uid) {
            console.error("User not found or missing UID");
            setErr("Cannot create chat: User information incomplete");
            return;
        }
        try {
            // Create a combined chat ID for both users
            const combinedId = Currentuser.uid > user.uid
                ? Currentuser.uid + user.uid
                : user.uid + Currentuser.uid;
            // Check if chat already exists
            const chatDocRef = doc(db, "chats", combinedId);
            const chatDoc = await getDoc(chatDocRef);
            if (!chatDoc.exists()) {
                await setDoc(chatDocRef, {
                    createdAt: serverTimestamp(),
                    messages: []
                });
            }
            // Update userChats for both users
            const currentUserChatRef = doc(db, "userChats", Currentuser.uid);
            const userChatRef = doc(db, "userChats", user.uid);
            // For current user
            await setDoc(
                currentUserChatRef,
                {
                    [combinedId]: {
                        userInfo: {
                            uid: user.uid,
                            displayName: user.displayName,
                        },
                        lastMessage: "",
                        updatedAt: serverTimestamp(),
                    }
                },
                { merge: true }
            );
            // For other user
            await setDoc(
                userChatRef,
                {
                    [combinedId]: {
                        userInfo: {
                            uid: Currentuser.uid,
                            displayName: Currentuser.displayName,
                        },
                        lastMessage: "",
                        updatedAt: serverTimestamp(),
                    }
                },
                { merge: true }
            );
            clearSearch();
        } catch (err) {
            console.error("Error creating chat:", err);
            setErr("Failed to create chat");
        }
    };

    return (
        <div className="sidebar">
            {/* Search input for finding users */}
            
            <div className="sidebar-input">
                <input
                    type="text"
                    onKeyDown={handleSearch}
                    onChange={e => setUsername(e.target.value)}
                    value={username}
                    placeholder="Search or start new chat"
                />
                {/* Show error if any */}
                {err && <div style={{ color: "red", fontSize: "0.9em" }}>{err}</div>}
                {/* Show found user for quick add */}
                {user && (
                    <div className='search-details' onClick={handleSelect}>
                        <img src={image} alt="user" />
                        <h3>{user.displayName}</h3>
                    </div>
                )}
            </div>
            {/* Contact list */}
            <div>
                <Contacts />
            </div>
        </div>
    );
}

export default Sidebar;