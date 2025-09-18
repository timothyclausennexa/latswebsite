import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { Icon } from './ui/Icon';

interface ChatMessage {
    id: number;
    user_id: string | null;
    username: string;
    message: string;
    created_at: string;
    is_deleted: boolean;
    is_anonymous?: boolean;
}

const LiveChat: React.FC = () => {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load initial messages
    const loadMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('is_deleted', false)
                .order('created_at', { ascending: true })
                .limit(50);

            if (error) throw error;
            setMessages(data || []);
            setTimeout(scrollToBottom, 100);
        } catch (err) {
            console.error('Error loading messages:', err);
        } finally {
            setLoading(false);
        }
    };

    // Send message (anonymous or authenticated)
    const sendMessage = async () => {
        if (!newMessage.trim() || sending) return;

        setSending(true);
        setError('');

        try {
            const { data, error } = await supabase.rpc('send_chat_message', {
                p_message: newMessage.trim(),
                p_is_anonymous: isAnonymous || !user
            });

            if (error) throw error;

            if (!data.success) {
                setError(data.error || 'Failed to send message');
            } else {
                setNewMessage('');
            }
        } catch (err: any) {
            console.error('Error sending message:', err);
            setError(err.message || 'Failed to send message');
        } finally {
            setSending(false);
        }
    };

    // Handle enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Set up real-time subscription
    useEffect(() => {
        loadMessages();

        // Subscribe to new messages
        const channel = supabase
            .channel('chat_messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'chat_messages'
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;
                    setMessages(prev => [...prev, newMsg]);
                    setTimeout(scrollToBottom, 100);
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'chat_messages'
                },
                (payload) => {
                    const updatedMsg = payload.new as ChatMessage;
                    setMessages(prev =>
                        prev.map(msg =>
                            msg.id === updatedMsg.id ? updatedMsg : msg
                        ).filter(msg => !msg.is_deleted)
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Format timestamp
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full bg-prison-black border-2 border-ash-white/20 rounded-lg">
            {/* Header */}
            <div className="border-b-2 border-ash-white/20 p-3 sm:p-4">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                    </span>
                    <h3 className="font-pixel-heading text-sm sm:text-base text-warning-orange">
                        LIVE CHAT
                    </h3>
                    <span className="text-xs text-ash-white/60 ml-auto">
                        {messages.length} messages
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-3 min-h-[300px] max-h-[400px]"
                style={{ scrollBehavior: 'smooth' }}
            >
                {loading ? (
                    <div className="text-center text-ash-white/60 py-8">
                        Loading messages...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-ash-white/60 py-8">
                        No messages yet. Be the first to chat!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-2 ${msg.user_id === user?.id ? 'justify-end' : ''}`}
                        >
                            <div
                                className={`max-w-[75%] sm:max-w-[60%] ${
                                    msg.user_id === user?.id
                                        ? 'bg-warning-orange/20 border-warning-orange/50'
                                        : 'bg-ash-white/10 border-ash-white/30'
                                } border rounded-lg p-2 sm:p-3`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-pixel-heading text-xs text-warning-orange">
                                        {msg.username}
                                    </span>
                                    <span className="text-xs text-ash-white/40">
                                        {formatTime(msg.created_at)}
                                    </span>
                                </div>
                                <p className="text-sm sm:text-base text-ash-white break-words">
                                    {msg.message}
                                </p>
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {user ? (
                <div className="border-t-2 border-ash-white/20 p-3 sm:p-4">
                    {error && (
                        <div className="text-alarm-red text-xs mb-2">{error}</div>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            maxLength={500}
                            disabled={sending}
                            className="flex-1 bg-ash-white/10 border-2 border-ash-white/30 rounded px-3 py-2 text-ash-white placeholder-ash-white/50 focus:border-warning-orange focus:outline-none text-sm sm:text-base"
                        />
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={sendMessage}
                            disabled={!newMessage.trim() || sending}
                            className="px-4 sm:px-6"
                        >
                            {sending ? '...' : 'SEND'}
                        </Button>
                    </div>
                    <div className="text-xs text-ash-white/40 mt-1">
                        {newMessage.length}/500 characters
                    </div>
                </div>
            ) : (
                <div className="border-t-2 border-ash-white/20 p-3 sm:p-4">
                    <p className="text-center text-ash-white/60 text-sm">
                        Login to join the chat
                    </p>
                </div>
            )}
        </div>
    );
};

export default LiveChat;