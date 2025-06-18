import './Chat.css';
import Main from './Main';
import Sidebar from './Sidebar';
import { useState, useEffect } from 'react';

const ChatComponent = () => {
    // Track if chat view should be shown (for mobile/tablet)
    const [showChat, setShowChat] = useState(false);

    // Listen for .show-chat class changes (for compatibility with Main/Sidebar logic)
    useEffect(() => {
        const handler = () => {
            setShowChat(document.body.classList.contains('show-chat'));
        };
        window.addEventListener('show-chat-toggle', handler);
        // Also listen for class changes via click
        const observer = new MutationObserver(handler);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => {
            window.removeEventListener('show-chat-toggle', handler);
            observer.disconnect();
        };
    }, []);

    // Helper: on desktop, always show both; on mobile/tablet, show one
    const isMobileOrTablet = window.innerWidth <= 900;

    return (
        <div className={`chat-component${showChat ? ' show-chat' : ''}`}>
            {/* On mobile/tablet, show only Sidebar or Main. On desktop, show both. */}
            {isMobileOrTablet ? (
                showChat ? <Main /> : <Sidebar />
            ) : (
                <>
                    <Sidebar />
                    <Main />
                </>
            )}
        </div>
    );
}

export default ChatComponent;