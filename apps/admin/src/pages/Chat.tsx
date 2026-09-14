import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import {
  Search,
  Send,
  MessageSquare,
  Users,
  User,
  RefreshCw,
  Hash,
  CheckCheck,
  Circle,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';

interface ChatContact {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  department_name?: string;
  designation_name?: string;
  status: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
  last_message?: string;
  last_message_at?: string;
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_user_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const targetUserIdFromUrl = searchParams.get('user_id');

  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [activeContact, setActiveContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Mobile View Toggle: 'list' (shows user directory) or 'chat' (shows active conversation)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>(targetUserIdFromUrl ? 'chat' : 'list');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchRoomMessages(activeRoom.id);
      const interval = setInterval(() => {
        fetchRoomMessages(activeRoom.id, true);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const meRes: any = await api.get('/auth/me');
      const userObj = meRes.data?.user || meRes.user;
      setCurrentUser(userObj);

      const [contactsRes, roomsRes]: any[] = await Promise.all([
        api.get('/chat/contacts'),
        api.get('/chat/rooms')
      ]);

      const loadedContacts: ChatContact[] = Array.isArray(contactsRes.data) ? contactsRes.data : (Array.isArray(contactsRes) ? contactsRes : []);
      const loadedRooms: ChatRoom[] = Array.isArray(roomsRes.data) ? roomsRes.data : (Array.isArray(roomsRes) ? roomsRes : []);
      
      setContacts(loadedContacts);
      setRooms(loadedRooms);

      // If user_id passed in URL query param, automatically select that contact & open chat on mobile!
      if (targetUserIdFromUrl) {
        const matched = loadedContacts.find((c) => c.user_id === targetUserIdFromUrl);
        if (matched) {
          handleSelectContact(matched);
          return;
        }
      }

      // Default to General Group Chat if available
      if (loadedRooms.length > 0) {
        setActiveRoom(loadedRooms[0]);
      }
    } catch (err) {
      console.error('Failed to load chat data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomMessages = async (roomId: string, silent = false) => {
    try {
      const res: any = await api.get(`/chat/rooms/${roomId}/messages`);
      const msgList = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
      setMessages(msgList);
    } catch (err) {
      if (!silent) console.error('Failed to fetch messages:', err);
    }
  };

  const handleSelectContact = async (contact: ChatContact) => {
    try {
      setActiveContact(contact);
      setMobileView('chat'); // Switch to full chat view on mobile
      const res: any = await api.post('/chat/rooms', {
        target_user_id: contact.user_id,
        room_name: contact.full_name
      });
      const room: ChatRoom = res.data || res;
      setActiveRoom(room);
    } catch (err) {
      console.error('Failed to open direct chat:', err);
    }
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setActiveContact(null);
    setActiveRoom(room);
    setMobileView('chat'); // Switch to full chat view on mobile
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !activeRoom || isSending) return;

    try {
      setIsSending(true);
      const res: any = await api.post(`/chat/rooms/${activeRoom.id}/messages`, {
        content: newMessage.trim()
      });
      const sentMsg = res.data || res;
      setMessages((prev) => [...prev, sentMsg]);
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const nameStr = (c?.full_name || c?.email || 'Employee').toLowerCase();
    const emailStr = (c?.email || '').toLowerCase();
    const deptStr = (c?.department_name || '').toLowerCase();
    const queryStr = (search || '').toLowerCase();
    return nameStr.includes(queryStr) || emailStr.includes(queryStr) || deptStr.includes(queryStr);
  });

  return (
    <div className="h-[calc(100vh-5rem)] -m-6 flex bg-white dark:bg-[#111b21] overflow-hidden">
      
      {/* LEFT SIDEBAR: EMPLOYEE CONTACTS DIRECTORY */}
      {/* On Mobile: Hidden when mobileView === 'chat', Visible when mobileView === 'list' */}
      <div className={`${mobileView === 'chat' ? 'hidden md:flex' : 'flex'} w-full md:w-96 border-r border-slate-200 dark:border-slate-800 flex-col bg-white dark:bg-[#111b21]`}>
        
        {/* Top Header */}
        <div className="px-4 py-3 bg-[#008069] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shadow-xs border border-white/20">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-tight">Team Messages</h2>
              <p className="text-[11px] text-emerald-100">{contacts.length} Employees Available</p>
            </div>
          </div>
          <button
            onClick={fetchInitialData}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            title="Refresh employees list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Search Field */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#111b21]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Contacts & Channels List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          
          {/* Team Group Channels */}
          {rooms.filter((r) => r.type === 'group').length > 0 && (
            <div className="p-2">
              <div className="px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center justify-between">
                <span>Group Channels</span>
                <Users className="w-3.5 h-3.5" />
              </div>
              {rooms.filter((r) => r.type === 'group').map((room) => (
                <button
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                    activeRoom?.id === room.id && !activeContact
                      ? 'bg-emerald-50 dark:bg-[#2a3942] text-emerald-900 dark:text-white font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-[#202c33] text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Hash className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate">{room.name}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">All Staff</span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">General company team chat</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* All Employees Directory List */}
          <div className="p-2">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>All Employees ({filteredContacts.length})</span>
              <User className="w-3.5 h-3.5" />
            </div>

            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading employee list...</div>
            ) : filteredContacts.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 text-center italic">No employees found</p>
            ) : (
              filteredContacts.map((contact) => {
                const isActive = activeContact?.id === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-[#2a3942] text-emerald-900 dark:text-white font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-[#202c33] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                        {contact.full_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-[#111b21]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">{contact.full_name}</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                          <MessageCircle className="w-3 h-3" /> Chat
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {contact.department_name || contact.designation_name || contact.email}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR: ACTIVE CHAT CONVERSATION WINDOW */}
      {/* On Mobile: Hidden when mobileView === 'list', Visible when mobileView === 'chat' */}
      <div className={`${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a]`}>
        {activeRoom ? (
          <>
            {/* Active Header */}
            <div className="px-4 md:px-6 py-3 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 md:gap-3">
                
                {/* Back Arrow button on Mobile to return to Employee list */}
                <button
                  onClick={() => setMobileView('list')}
                  className="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-700 dark:text-slate-200 shrink-0"
                  title="Back to Employee List"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                  {activeContact ? activeContact.full_name.charAt(0).toUpperCase() : <Hash className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug truncate">
                    {activeContact ? activeContact.full_name : activeRoom.name}
                  </h3>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
                    <Circle className="w-2 h-2 fill-emerald-500 stroke-none shrink-0" />
                    <span className="truncate">{activeContact ? `${activeContact.department_name || 'Active'} • Online` : 'All Company Members'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 md:gap-2 text-slate-500 dark:text-slate-400">
                <button onClick={() => fetchRoomMessages(activeRoom.id)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Refresh messages">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message History Stream */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="p-5 bg-white dark:bg-[#111b21] rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 text-center max-w-sm">
                    <MessageSquare className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <h4 className="font-semibold text-sm text-slate-800 dark:text-white">Start Conversation</h4>
                    <p className="text-xs text-slate-400 mt-1">Send a message below to start chatting with {activeContact ? activeContact.full_name : activeRoom.name}.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_user_id === currentUser?.id;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] md:max-w-md px-4 py-2.5 rounded-2xl text-xs shadow-xs relative ${
                          isMe
                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-white rounded-tr-none'
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-white rounded-tl-none'
                        }`}
                      >
                        {!isMe && (
                          <span className="block font-bold text-[11px] text-emerald-700 dark:text-emerald-400 mb-0.5">
                            {msg.sender_name}
                          </span>
                        )}
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 dark:text-slate-300 float-right ml-3">
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Input Bar */}
            <form onSubmit={handleSendMessage} className="p-2.5 md:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-700/50 flex items-center gap-2">
              <input
                type="text"
                placeholder={`Type a message to ${activeContact ? activeContact.full_name : activeRoom.name}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 px-4 py-2.5 md:py-3 text-xs bg-white dark:bg-[#2a3942] text-slate-900 dark:text-white rounded-xl focus:outline-none border-none placeholder-slate-400 shadow-xs"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="w-10 h-10 md:w-11 md:h-11 bg-[#00a884] hover:bg-[#008069] disabled:opacity-50 text-white rounded-xl flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-3">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">Select Employee to Chat</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">Choose any employee from the list on the left to start direct instant messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};
