import React, { useContext, useEffect, useRef, useState } from "react";
import "./Main.css";
import image from '../assets/651c6da502353948bdc929f02da2b8e0.jpg';
import { AuthContext } from "../Context/AuthContext";
import { ChatContext } from "../Context/ChatContext";
import { arrayUnion, doc, onSnapshot, Timestamp, updateDoc, setDoc } from "firebase/firestore";
import {v4 as uuid} from 'uuid'
import HamburgerMenu from './HamburgerMenu';
import { db } from "../FirebaseConfig/firebase";
import EmojiPicker from 'emoji-picker-react';


const Main = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef(null);
    const { Currentuser } = useContext(AuthContext);
    const { data } = useContext(ChatContext);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!data.chatId) {
            setMessages([]);
            return;
        }
        const unsub = onSnapshot(doc(db, "chats", data.chatId), (docSnap) => {
            if (docSnap.exists()) {
                setMessages(docSnap.data().messages || []);
            } else {
                setMessages([]);
            }
        });
        return () => {
            unsub();
        };
    }, [data.chatId]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (input.trim() === "" || !data.chatId || !Currentuser) return;
        try {
            // Add message to Firestore
            await updateDoc(doc(db, "chats", data.chatId), {
                messages: arrayUnion({
                    id: uuid(),
                    text: input,
                    senderId: Currentuser.uid,
                    date: Timestamp.now(),
                }),
            });

            // Prepare userInfo objects
            const senderInfo = {
                uid: Currentuser.uid,
                displayName: Currentuser.displayName,
            };
            const receiverInfo = {
                uid: data.user.uid,
                displayName: data.user.displayName,
            };

            // For sender
            await setDoc(doc(db, "userChats", Currentuser.uid), {
                [data.chatId]: {
                    userInfo: receiverInfo,
                    lastMessage: { text: input },
                    updatedAt: Timestamp.now(),
                }
            }, { merge: true });

            // For receiver
            if (data.user?.uid) {
                await setDoc(doc(db, "userChats", data.user.uid), {
                    [data.chatId]: {
                        userInfo: senderInfo,
                        lastMessage: { text: input },
                        updatedAt: Timestamp.now(),
                    }
                }, { merge: true });
            }
        } catch (err) {
            console.error("Error sending message:", err);
        } finally {
            setInput("");
        }
    };

    return (
        <div className="main">
            <div className="main-nav">
                {/* Back button for mobile/tablet */}
                {window.innerWidth <= 900 && (
                    <button
                        className="nav-button"
                        style={{ marginRight: 12, background: 'linear-gradient(45deg, #70ff6b, #46ee24)', color: '#fff', minWidth: 40, padding: '8px 14px' }}
                        onClick={() => {
                            document.body.classList.remove('show-chat');
                            // Scroll sidebar into view for mobile/tablet
                            setTimeout(() => {
                                const sidebar = document.querySelector('.sidebar');
                                if (sidebar) sidebar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                        }}
                    >
                        &#8592;
                    </button>
                )}
                <div className="nav-details">
                    <img src={image} />
                    <h3>{data.user?.displayName || "Chat"}</h3>
                </div>
                <div>
                    <HamburgerMenu />
                </div>
            </div>
            <div className="main-messages">
                {(!data.chatId || messages.length === 0) ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: '40px', fontSize: '1.2rem' }}>
                        Start a conversation
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`main-message ${msg.senderId === Currentuser?.uid ? "main-message--me" : ""}`}
                        >
                            <span>{msg.text}</span>
                            {msg.date && (
                                <div style={{ fontSize: '0.78rem', color: '#b0b0b0', marginTop: 4, textAlign: msg.senderId === Currentuser?.uid ? 'right' : 'left' }}>
                                    {msg.date.seconds
                                        ? new Date(msg.date.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : ''}
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <form className="main-input-bar" onSubmit={handleSend} style={{ position: 'relative' }}>
                <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    style={{ marginRight: 8 }}
                    tabIndex={-1}
                >
                    😊
                </button>
                {showEmojiPicker && (
                    <div style={{ position: 'absolute', bottom: 60, right: 20, zIndex: 10, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                        <button
                            type="button"
                            onClick={() => setShowEmojiPicker(false)}
                            style={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background: 'transparent',
                                border: 'none',
                                fontSize: 28, // Increased from 18 to 28
                                cursor: 'pointer',
                                zIndex: 11,
                                color: '#888',
                            }}
                            aria-label="Close emoji picker"
                        >
                            ×
                        </button>
                        <EmojiPicker
                            onEmojiClick={(emojiData) => setInput(input + emojiData.emoji)}
                            autoFocusSearch={false}
                        />
                    </div>
                )}
                <input
                    type="text"
                    placeholder="Type a message..."
                    value={input}
                    onChange={e => setInput(e.target.value)}
                />
                <button type="submit">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Main;