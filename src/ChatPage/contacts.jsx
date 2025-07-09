import { useContext, useEffect, useState } from 'react';
import image from '../assets/OIP (2).jfif';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../FirebaseConfig/firebase';
import { AuthContext } from '../Context/AuthContext';
import { ChatContext } from '../Context/ChatContext';
import './Sidebar.css'

const Contacts = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const { Currentuser } = useContext(AuthContext);
    const { dispatch } = useContext(ChatContext);

    useEffect(() => {
        if (!Currentuser?.uid) {
            setLoading(false);
            return;
        }

        const getChats = () => {
            const unsub = onSnapshot(
                doc(db, "userChats", Currentuser.uid), 
                (doc) => {
                    if (doc.exists()) {
                        const data = doc.data();
                        // Debug: log the raw chat data
                        console.log('Raw chat data:', data);
                        // Convert object to array for sorting
                        const chatsArray = Object.entries(data).map(([id, chat]) => ({
                            id,
                            ...chat,
                            updatedAt: chat.updatedAt && typeof chat.updatedAt.toDate === 'function'
                                ? chat.updatedAt.toDate()
                                : new Date(0),
                            lastMessageText: chat.lastMessage && chat.lastMessage.text ? chat.lastMessage.text : "No messages yet"
                        }));

                        // Sort by most recent first (updatedAt descending)
                        chatsArray.sort((a, b) => b.updatedAt - a.updatedAt);
                        // Convert back to object format to maintain compatibility
                        const sortedChats = {};
                        chatsArray.forEach(chat => {
                            const { id, ...chatData } = chat;
                            sortedChats[id] = chatData;
                        });
                        setChats(sortedChats);
                    } else {
                        setChats({});
                    }
                    setLoading(false);
                },
                (error) => {
                    console.error("Error fetching chats:", error);
                    setLoading(false);
                }
            );
            return unsub;
        };
        const unsubscribe = getChats();
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [Currentuser?.uid]);

    const handleSelect = (e) => {
        dispatch({ type: "CHANGE_USER", payload: e });
        // Responsive: add 'show-chat' class to parent on mobile/tablet
        if (window.innerWidth <= 900) {
            document.body.classList.add('show-chat');
        }
    }

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'now';
        if (minutes < 60) return `${minutes}m`;
        if (hours < 24) return `${hours}h`;
        if (days < 7) return `${days}d`;
        
        return date.toLocaleDateString();
    };

    if (loading) {
        return (
            <div className="contact">
                <div className="contacts-loading">
                    <div className="loading-spinner"></div>
                    <span>Loading chats...</span>
                </div>
            </div>
        );
    }

    if (Object.keys(chats).length === 0) {
        return (
            <div className="contact">
                <div className="no-chats">
                    <p>No chats yet. Search for users to start a conversation!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="contact">
            {Object.entries(chats).map((chat) => (
                chat[1].userInfo ? (
                    <div 
                        className="contacts" 
                        key={chat[0]} 
                        onClick={() => handleSelect(chat[1].userInfo)} 
                        id={chat[0]}
                    >
                        <div className="contact-avatar-container">
                            <img src={image} className="contact-image" alt="Contact" />
                        </div>
                        <div className="contact-details">
                            <div className="contact-header">
                                <h3>{chat[1].userInfo.displayName}</h3>
                                <span className="contact-time">
                                    {formatTime(chat[1].updatedAt)}
                                </span>
                            </div>
                            <p className="contact-paragraph">
                                {chat[1].lastMessageText}
                            </p>
                        </div>
                    </div>
                ) : null
            ))}
        </div>
    );
}

export default Contacts;