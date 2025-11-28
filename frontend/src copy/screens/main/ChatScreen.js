import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  TextInput,
  IconButton,
  Text,
  ActivityIndicator,
  Avatar,
  Surface,
} from 'react-native-paper';
import { colors, spacing } from '../../theme';
import api from '../../api';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await api.chat.getHistory();
      if (response.messages) {
        setMessages(response.messages);
      }
    } catch (error) {
      console.error('Load chat history error:', error);
      // Add welcome message if no history
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm FinPal, your AI financial coach. I can help you with:\n\n• Understanding your spending patterns\n• Creating budgets and savings goals\n• Investment advice based on your profile\n• Answering financial questions\n\nHow can I help you today?",
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setInitialLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.chat.sendMessage(userMessage.content);
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || "I'm sorry, I couldn't process that. Please try again.",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Send message error:', error);
      
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        created_at: new Date().toISOString(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <Avatar.Icon
            size={32}
            icon="robot"
            style={styles.avatar}
            color={colors.white}
          />
        )}
        
        <Surface
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
            message.isError && styles.errorBubble,
          ]}
          elevation={1}
        >
          <Text
            style={[
              styles.messageText,
              isUser && styles.userMessageText,
            ]}
          >
            {message.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isUser && styles.userMessageTime,
            ]}
          >
            {formatTime(message.created_at)}
          </Text>
        </Surface>

        {isUser && (
          <Avatar.Icon
            size={32}
            icon="account"
            style={[styles.avatar, styles.userAvatar]}
            color={colors.white}
          />
        )}
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        
        {loading && (
          <View style={styles.typingContainer}>
            <Avatar.Icon
              size={32}
              icon="robot"
              style={styles.avatar}
              color={colors.white}
            />
            <Surface style={[styles.messageBubble, styles.assistantBubble]} elevation={1}>
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={styles.typingText}>FinPal is typing...</Text>
              </View>
            </Surface>
          </View>
        )}
      </ScrollView>

      {/* Quick Suggestions */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsContainer}
        contentContainerStyle={styles.suggestionsContent}
      >
        {[
          'How am I spending?',
          'Create a budget',
          'Savings tips',
          'Investment advice',
          'Analyze expenses',
        ].map((suggestion) => (
          <Surface
            key={suggestion}
            style={styles.suggestionChip}
            elevation={1}
          >
            <Text
              style={styles.suggestionText}
              onPress={() => {
                setInputText(suggestion);
              }}
            >
              {suggestion}
            </Text>
          </Surface>
        ))}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask FinPal anything..."
          mode="outlined"
          style={styles.input}
          outlineColor={colors.gray}
          activeOutlineColor={colors.primary}
          multiline
          maxLength={1000}
          onSubmitEditing={sendMessage}
        />
        <IconButton
          icon="send"
          mode="contained"
          containerColor={colors.primary}
          iconColor={colors.white}
          size={24}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading}
          style={styles.sendButton}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  avatar: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.sm,
  },
  userAvatar: {
    backgroundColor: colors.secondary,
  },
  messageBubble: {
    maxWidth: '70%',
    padding: spacing.md,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
  },
  errorBubble: {
    backgroundColor: '#FFE5E5',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  userMessageText: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: spacing.sm,
    color: colors.textSecondary,
    fontSize: 14,
  },
  suggestionsContainer: {
    maxHeight: 50,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  suggestionsContent: {
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  suggestionText: {
    fontSize: 13,
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.background,
    marginRight: spacing.sm,
  },
  sendButton: {
    marginBottom: 4,
  },
});

export default ChatScreen;
