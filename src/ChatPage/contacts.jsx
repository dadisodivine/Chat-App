import { useContext, useEffect, useState } from 'react';
import image from '../assets/OIP (2).jfif';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../FirebaseConfig/firebase';
import { AuthContext } from '../Context/AuthContext';
import { ChatContext } from '../Context/ChatContext';
import './Sidebar.css'

const Contacts = () => {
    const [chats,setChats] = useState([])
    const { Currentuser } = useContext(AuthContext);
    const { dispatch } = useContext(ChatContext);

    useEffect(() => {
        const getChats = async () => {
            const unsub = onSnapshot(doc(db, "userChats", Currentuser.uid), (doc) => {
                setChats(doc.data());
            });
            return () => {
                unsub();
            };
        }
        Currentuser.uid && getChats();
    }, [Currentuser.uid]);

    const handleSelect = (e) => {
        dispatch({ type: "CHANGE_USER", payload: e });
        // Responsive: add 'show-chat' class to parent on mobile/tablet
        if (window.innerWidth <= 900) {
            document.body.classList.add('show-chat');
        }
    }

    return ( 
        <div className="contact">
            {Object.entries(chats).map((chat) => (
                <div className="contacts" key={chat[0]} onClick={()=>handleSelect(chat[1].userInfo)} id={chat[0]}>
                    <div>
                        <img src={image} className="contact-image" />
                    </div>
                    <div>
                        <h3>{chat[1].userInfo.displayName}</h3>
                        <p className="contact-paragraph">{chat[1].lastMessage.text}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
 
export default Contacts;