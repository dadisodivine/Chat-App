import './Sidebar.css'
import image from '../assets/react.svg';
import { useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../FirebaseConfig/firebase';
import { AuthContext } from '../Context/AuthContext';
import Contacts from './contacts';

// Debounce hook for search optimization
const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};



// Sidebar component for user search and contact list
const Sidebar = () => {
    // State for search input, found users, loading, and error
    const [username, setUsername] = useState("");
    const [users, setUsers] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [err, setErr] = useState(null);
    const { Currentuser } = useContext(AuthContext);

    // Debounce search input to avoid excessive API calls
    const debouncedUsername = useDebounce(username, 300);

    // Simple case-insensitive search function
    const performSearch = useCallback(async (searchTerm) => {
        if (!searchTerm.trim()) {
            setUsers([]);
            setIsSearching(false);
            setErr(null);
            return;
        }

        setIsSearching(true);
        setErr(null);

        try {
            // Get all users and filter client-side for case-insensitive search
            const allUsersQuery = query(collection(db, "users"));
            const allUsersSnapshot = await getDocs(allUsersQuery);
            
            const searchLower = searchTerm.toLowerCase().trim();
            const foundUsers = [];
            
            allUsersSnapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.uid !== Currentuser?.uid) {
                    const userDisplayName = (userData.displayName || '').toLowerCase();
                    const userEmail = (userData.email || '').toLowerCase();
                    
                    // Case-insensitive search in display name or email
                    if (userDisplayName.includes(searchLower) || userEmail.includes(searchLower)) {
                        foundUsers.push(userData);
                    }
                }
            });

            setUsers(foundUsers);
            if (foundUsers.length === 0) {
                setErr("No users found");
            }

        } catch (error) {
            console.error("Error searching users:", error);
            setUsers([]);
            setErr("Error searching users");
        } finally {
            setIsSearching(false);
        }
    }, [Currentuser?.uid]);

    // Effect for real-time search
    useEffect(() => {
        performSearch(debouncedUsername);
    }, [debouncedUsername, performSearch]);

    // Handle input change
    const handleInputChange = (e) => {
        const value = e.target.value;
        setUsername(value);
        
        if (!value.trim()) {
            setUsers([]);
            setErr(null);
            setIsSearching(false);
        }
    };

    // Clear search state
    const clearSearch = () => {
        setUsername('');
        setUsers([]);
        setErr(null);
        setIsSearching(false);
    };

    // Handle selecting a user to start a chat
    const handleSelect = async (selectedUser) => {
        if (!selectedUser || !selectedUser.uid || !Currentuser || !Currentuser.uid) {
            console.error("User not found or missing UID");
            setErr("Cannot create chat: User information incomplete");
            return;
        }

        try {
            // Create a combined chat ID for both users
            const combinedId = Currentuser.uid > selectedUser.uid
                ? Currentuser.uid + selectedUser.uid
                : selectedUser.uid + Currentuser.uid;

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
            const userChatRef = doc(db, "userChats", selectedUser.uid);

            // For current user
            await setDoc(
                currentUserChatRef,
                {
                    [combinedId]: {
                        userInfo: {
                            uid: selectedUser.uid,
                            displayName: selectedUser.displayName,
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
                <div className="search-container">
                    <input
                        type="text"
                        onChange={handleInputChange}
                        value={username}
                        placeholder="Search users by name or email..."
                    />
                    {isSearching && (
                        <div className="search-loading">
                            <span className="loading-spinner"></span>
                        </div>
                    )}
                </div>

                {/* Show error if any */}
                {err && <div className="search-error">{err}</div>}

                {/* Show found users for quick add */}
                {users.length > 0 && (
                    <div className="search-results">
                        {users.map((user) => (
                            <div 
                                key={user.uid} 
                                className="search-result-item" 
                                onClick={() => handleSelect(user)}
                            >
                                <img src={image} alt="user" className="user-avatar" />
                                <div className="user-info">
                                    <h4>{user.displayName}</h4>
                                    <span className="user-email">{user.email}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Contact list - This component should handle sorting internally */}
            <div className="contacts-container">
                <Contacts />
            </div>
        </div>
    );
}

export default Sidebar;