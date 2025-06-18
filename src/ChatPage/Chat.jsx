import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Main from "./Main";
import "./Chat.css";

const Chat = () => {
    const [darkMode, setDarkMode] = useState(false);

    const handleToggleTheme = () => setDarkMode((prev) => !prev);

    return (
        <div className={`chat-page-container${darkMode ? " dark" : " light"}`}>
            <button
                className="theme-toggle-btn"
                onClick={handleToggleTheme}
                aria-label="Toggle dark mode"
            >
                {darkMode ? "🌙 Dark" : "☀️ Light"}
            </button>
            <div className="chat-component">
                <Sidebar />
                <Main />
            </div>
        </div>
    );
};

export default Chat;
