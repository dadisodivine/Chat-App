import './Sidebar.css'
import defaultAvatar from '../assets/OIP (2).jfif';
import { useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, groupsCollection, groupChatsCollection } from '../FirebaseConfig/firebase';
import { AuthContext } from '../Context/AuthContext';
import { ChatContext } from '../Context/ChatContext';
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
    const { dispatch } = useContext(ChatContext);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Fetch all users for group selection
    useEffect(() => {
        if (showGroupModal) {
            const fetchUsers = async () => {
                const usersCol = collection(db, 'users');
                const usersSnap = await getDocs(usersCol);
                const users = [];
                usersSnap.forEach(doc => {
                    const data = doc.data();
                    // Exclude self
                    if (data.uid !== Currentuser?.uid) {
                        users.push(data);
                    }
                });
                setAllUsers(users);
            };
            fetchUsers();
        }
    }, [showGroupModal, Currentuser]);
    // Filter users by search
    const filteredUsers = allUsers.filter(user =>
        user.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
    // Add/remove user from selected
    const toggleUser = (user) => {
        setSelectedUsers(prev =>
            prev.some(u => u.uid === user.uid)
                ? prev.filter(u => u.uid !== user.uid)
                : [...prev, user]
        );
    };

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

            // Open the chat (even if it already existed)
            dispatch({ type: 'CHANGE_USER', payload: selectedUser });
            clearSearch();
        } catch (err) {
            console.error("Error creating chat:", err);
            setErr("Failed to create chat");
        }
    };

    // Group creation handler
    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length === 0) return;
        try {
            // Generate a groupId
            const groupId = 'group_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
            // Group members: include self
            const members = [Currentuser, ...selectedUsers];
            // 1. Create group doc
            await setDoc(doc(groupsCollection, groupId), {
                groupId,
                name: groupName,
                members: members.map(u => ({ uid: u.uid, displayName: u.displayName, email: u.email })),
                createdBy: { uid: Currentuser.uid, displayName: Currentuser.displayName },
                createdAt: serverTimestamp(),
            });
            // 2. Create groupChats doc
            await setDoc(doc(groupChatsCollection, groupId), {
                messages: [],
            });
            // 3. Update userChats for all members
            for (const user of members) {
                await setDoc(doc(db, 'userChats', user.uid), {
                    [groupId]: {
                        groupInfo: {
                            groupId,
                            name: groupName,
                            members: members.map(u => ({ uid: u.uid, displayName: u.displayName, email: u.email })),
                        },
                        lastMessage: { text: '' },
                        updatedAt: serverTimestamp(),
                    }
                }, { merge: true });
            }
            // Reset modal state
            setShowGroupModal(false);
            setGroupName('');
            setUserSearch('');
            setSelectedUsers([]);
        } catch (err) {
            alert('Failed to create group: ' + err.message);
        }
    };


    return (
        <div className="sidebar">
            {/* New Group Button */}
            <button
                className="new-group-btn"
                style={{ width: '100%', marginBottom: 12, padding: '10px', background: 'linear-gradient(45deg, #70ff6b, #46ee24)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
                onClick={() => setShowGroupModal(true)}
            >
                + New Group
            </button>
            {/* Group Creation Modal */}
            {showGroupModal && (
                <div className="group-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="group-modal" style={{ background: '#fff', padding: 24, borderRadius: 10, minWidth: 320, boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}>
                        <h2 style={{ marginBottom: 16 }}>Create Group</h2>
                        <label style={{ display: 'block', marginBottom: 8 }}>
                            Group Name:
                            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 16, borderRadius: 4, border: '1px solid #ccc' }} placeholder="Enter group name" />
                        </label>
                        <label style={{ display: 'block', marginBottom: 8 }}>
                            Add Members:
                            <input type="text" value={userSearch} onChange={e => setUserSearch(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 4, borderRadius: 4, border: '1px solid #ccc' }} placeholder="Search users to add..." />
                        </label>
                        <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
                            {filteredUsers.map(user => (
                                <div key={user.uid} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.some(u => u.uid === user.uid)}
                                        onChange={() => toggleUser(user)}
                                        id={`user-${user.uid}`}
                                    />
                                    <label htmlFor={`user-${user.uid}`} style={{ cursor: 'pointer' }}>{user.displayName || user.email}</label>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginBottom: 8, fontSize: 13, color: '#555' }}>
                            Selected: {selectedUsers.map(u => u.displayName || u.email).join(', ')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                            <button onClick={() => setShowGroupModal(false)} style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: '#eee', color: '#333', fontWeight: 500 }}>Cancel</button>
                            <button style={{ padding: '8px 16px', borderRadius: 4, border: 'none', background: 'linear-gradient(45deg, #70ff6b, #46ee24)', color: '#fff', fontWeight: 600 }} onClick={handleCreateGroup}>Create</button>
                        </div>
                    </div>
                </div>
            )}
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
                                <img src={user.photoURL || defaultAvatar} alt="user" className="user-avatar" />
                                <div className="user-info">
                                    <h4>{user.displayName}</h4>
                                    {/* <span className="user-email">{user.email}</span> */}
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