import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { mobileApi } from '../config/api';

interface ChatContact {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  department_name?: string;
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group';
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_user_id: string;
  sender_name: string;
  content: string;
  created_at: string;
}

export const ChatScreen: React.FC = () => {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [activeContactName, setActiveContactName] = useState<string>('General Channel');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages(activeRoom.id);
      const interval = setInterval(() => fetchMessages(activeRoom.id, true), 3000);
      return () => clearInterval(interval);
    }
  }, [activeRoom]);

  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const meRes: any = await mobileApi.get('/auth/me');
      setCurrentUserId(meRes.data.user.id);

      const [contactsRes, roomsRes]: any[] = await Promise.all([
        mobileApi.get('/chat/contacts'),
        mobileApi.get('/chat/rooms')
      ]);

      setContacts(contactsRes.data || []);
      const loadedRooms: ChatRoom[] = roomsRes.data || [];
      setRooms(loadedRooms);

      if (loadedRooms.length > 0) {
        setActiveRoom(loadedRooms[0]);
        setActiveContactName(loadedRooms[0].name || 'General Team Channel');
      }
    } catch (error) {
      console.error('Failed to load chat data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (roomId: string, silent = false) => {
    try {
      const res: any = await mobileApi.get(`/chat/rooms/${roomId}/messages`);
      setMessages(res.data || []);
    } catch (error) {
      if (!silent) console.error('Failed to fetch room messages:', error);
    }
  };

  const handleSelectContact = async (contact: ChatContact) => {
    try {
      setActiveContactName(contact.full_name);
      const res: any = await mobileApi.post('/chat/rooms', {
        target_user_id: contact.user_id,
        room_name: contact.full_name
      });
      setActiveRoom(res.data);
    } catch (error) {
      console.error('Failed to select contact room:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !activeRoom || isSending) return;

    try {
      setIsSending(true);
      const res: any = await mobileApi.post(`/chat/rooms/${activeRoom.id}/messages`, {
        content: inputText.trim()
      });
      setMessages((prev) => [...prev, res.data]);
      setInputText('');
    } catch (error) {
      console.error('Failed to send mobile message:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={styles.loadingText}>Loading Team Chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Top Channel/Contact Selector Bar */}
      <View style={styles.contactBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {rooms.filter((r) => r.type === 'group').map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.chip, activeRoom?.id === r.id && styles.activeChip]}
              onPress={() => {
                setActiveRoom(r);
                setActiveContactName(r.name);
              }}
            >
              <Text style={[styles.chipText, activeRoom?.id === r.id && styles.activeChipText]}>
                # {r.name}
              </Text>
            </TouchableOpacity>
          ))}

          {contacts.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.chip, activeContactName === c.full_name && styles.activeChip]}
              onPress={() => handleSelectContact(c)}
            >
              <Text style={[styles.chipText, activeContactName === c.full_name && styles.activeChipText]}>
                👤 {c.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Active Conversation Header */}
      <View style={styles.roomHeader}>
        <Text style={styles.roomTitle}>{activeContactName}</Text>
      </View>

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const isMe = item.sender_user_id === currentUserId;
          return (
            <View style={[styles.msgWrapper, isMe ? styles.myMsgWrapper : styles.otherMsgWrapper]}>
              <Text style={styles.senderLabel}>{isMe ? 'You' : item.sender_name}</Text>
              <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.msgText, isMe ? styles.myMsgText : styles.otherMsgText]}>
                  {item.content}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.listContent}
      />

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type message..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={setInputText}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage} disabled={isSending}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a'
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
    fontSize: 14
  },
  contactBar: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  scrollContent: {
    paddingHorizontal: 12,
    gap: 8
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#334155'
  },
  activeChip: {
    backgroundColor: '#0284c7'
  },
  chipText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600'
  },
  activeChipText: {
    color: '#ffffff'
  },
  roomHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155'
  },
  roomTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  listContent: {
    padding: 16,
    gap: 12
  },
  msgWrapper: {
    marginBottom: 8,
    maxWidth: '80%'
  },
  myMsgWrapper: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end'
  },
  otherMsgWrapper: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start'
  },
  senderLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16
  },
  myBubble: {
    backgroundColor: '#0284c7',
    borderBottomRightRadius: 2
  },
  otherBubble: {
    backgroundColor: '#334155',
    borderBottomLeftRadius: 2
  },
  msgText: {
    fontSize: 14
  },
  myMsgText: {
    color: '#ffffff'
  },
  otherMsgText: {
    color: '#f8fafc'
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  sendButton: {
    backgroundColor: '#0284c7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
