import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
    TouchableOpacity,
} from 'react-native';
import Markdown from 'react-native-markdown-display'; // For Markdown rendering
import { WebView } from 'react-native-webview'; // Use WebView for rendering Adaptive Cards
import { directLineInterface } from '../service/DirectLineClass';
import * as AdaptiveCards from 'adaptivecards';

const ChatbotUI = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const scrollViewRef = useRef();
    const inputRef = useRef(null);
    const [directLineToken, setDirectLineToken] = useState('');
    const [conversationId, setConversationId] = useState('');
    const [streamUrl, setStreamUrl] = useState(null);
    const [directLineIntf, setDirectLineIntf] = useState(null);

    useEffect(() => {
        const initializeChat = async () => {
            try {

                var dl = null;

                if (!directLineIntf){
                    dl= new directLineInterface();
                }

                await dl.initializeConversation(handleIncomingActivity);

                // Send a welcome event after connecting
                await dl.sendActivity({
                    type: 'event',
                    name: 'WELCOME',
                    from: { id: 'user', role: 'user' },
                });

                setDirectLineIntf(dl);

            } catch (error) {
                console.error('Error initializing chat:', error);
            }
        };

        initializeChat();
    }, []);

    const handleIncomingActivity = (activity) => {
        if (activity.type === 'message') {
            const newMessage = {
                id: activity.id,
                text: activity.text,
                sender: activity.from.role,
                attachments: activity.attachments || [],
                suggestedActions: activity.suggestedActions || null,
            };

            setMessages((prevMessages) => [...prevMessages, newMessage]);
        }
    };

    const handleSendMessage = async () => {
        if (inputMessage.trim() === '') return;

        const newMessage = {
            id: Date.now(),
            text: inputMessage,
            sender: 'user',
        };

        setInputMessage('');

        try {
            await directLineIntf.sendActivity({
                type: 'message',
                from: { id: 'user', role: 'user' },
                text: inputMessage,
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }

        Keyboard.dismiss();

        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const renderMessage = (item) => {
        if (item.attachments && item.attachments.length > 0) {
            return item.attachments.map((attachment, index) => {
                if (attachment.contentType === 'application/vnd.microsoft.card.adaptive') {
                    // Adaptive Card renderer logic
                    const adaptiveCard = new AdaptiveCards.AdaptiveCard();
                    adaptiveCard.parse(attachment.content);
                    const renderedCardHtml = adaptiveCard.render().outerHTML;

                    return (
                        <View
                            key={`${item.id}-attachment-${index}`}
                            style={[styles.adaptiveCardContainer, { backgroundColor: '#73c4e2' }]} // Apply background color here
                        >
                            <WebView
                                originWhitelist={['*']}
                                source={{ html: `<html><body style="margin:0;padding:0;background-color:#73c4e2;">${renderedCardHtml}</body></html>` }}
                                style={{ flex: 1, backgroundColor: 'transparent' }} // Set WebView background to transparent
                            />
                        </View>
                    );
                }
                return null;
            });
        }

        return (
            <View
                key={item.id}
                style={[
                    styles.messageContainer,
                    item.sender === 'user' ? styles.userMessage : styles.botMessage,
                ]}
            >
                <Markdown style={styles.messageMarkdown}>{item.text}</Markdown>

                {item.suggestedActions && item.suggestedActions.actions.length > 0 && (
                    <View style={styles.suggestedActionsContainer}>
                        {item.suggestedActions.actions.map((action, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.suggestedActionButton}
                                onPress={() => handleSuggestedAction(action)}
                            >
                                <Text style={styles.suggestedActionText}>{action.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    };

    const handleSuggestedAction = async (action) => {
        // Send the action to the bot, but don't add it to messages yet
        try {
            await directLineIntf.sendActivity({
                type: 'message',
                from: { id: 'user', role: 'user' },
                text: action.value || action.title,
            });
        } catch (error) {
            console.error('Error sending suggested action:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.nativeEvent.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleCardAction = async (actionData) => {
        // Parse the action data from the WebView
        const action = JSON.parse(actionData);

        // Send the action value back to the bot
        try {
            await directLineIntf.sendActivity({
                type: 'message',
                from: { id: 'user', role: 'user' },
                text: action.value || action.title,
            });
        } catch (error) {
            console.error('Error sending action:', error);
        }
    };

    return (
            <>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.chatContainer}
                >
                    <ScrollView
                        ref={scrollViewRef}
                        onContentSizeChange={() =>
                            scrollViewRef.current.scrollToEnd({ animated: true })
                        }
                        style={styles.messagesContainer}
                    >
                        {messages.map(renderMessage)}
                    </ScrollView>

                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            style={styles.input}
                            value={inputMessage}
                            onChangeText={setInputMessage}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your message..."
                            multiline={true}
                            numberOfLines={4}
                            textAlignVertical="auto"
                            placeholderTextColor="#aaa"
                        />
                        <TouchableOpacity onPress={handleSendMessage}>
                            <Text style={styles.sendButton}>Send</Text>
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </>
    );
};

const styles = StyleSheet.create({
    chatContainer: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messageContainer: {
        maxWidth: '80%',
        padding: 10,
        marginBottom: 10,
        borderRadius: 10,
        borderWidth: 1, // Adds visible border
        borderColor: 'black', // Border color
        backgroundColor: 'white', // Default background color
        // Shadow for iOS
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        // Shadow for Android
        elevation: 5,
    },
    userMessage: {
        backgroundColor: '#30b5e7',
        alignSelf: 'flex-start',
    },
    botMessage: {
        backgroundColor: '#73c4e2',
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    input: {
        flex: 1,
        padding: 10,
        borderRadius: 20,
        backgroundColor: '#fff',
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#0078d4',
        color: '#fff',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 10,
    },
    adaptiveCardContainer: {
        marginTop: 10,
        width: '100%',
        height: 'auto',
        backgroundColor: '#73c4e2',
    },
    suggestedActionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 10,
    },
    suggestedActionButton: {
        backgroundColor: '#0078d4',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 5,
        marginRight: 10,
        marginBottom: 10,
    },
    suggestedActionText: {
        color: '#fff',
    },
});

export default ChatbotUI;
