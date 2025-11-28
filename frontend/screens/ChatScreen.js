import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Card, IconButton, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api';
import { theme, spacing, shadows } from '../theme';

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState([
    'Check my balance',
    'Analyze my spending',
    'Investment advice',
    'How can I save more?',
  ]);
  const scrollViewRef = useRef();

  useEffect(() => {
    loadChatHistory();
    // Add welcome message
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      message: "Hello! I'm FinPal, your AI financial coach. 🎯\n\nI can help you:\n• Analyze your spending habits\n• Track your financial goals\n• Provide investment advice\n• Answer any money questions\n\nHow can I help you today?",
      timestamp: new Date(),
    }]);
  }, []);

  const loadChatHistory = async () => {
    try {
      const history = await api.getChatHistory();
      if (history.length > 0) {
        const formattedHistory = history.map(h => ({
          id: h.id,
          role: h.role,
          message: h.message,
          timestamp: new Date(h.created_at),
        }));
        setMessages(prev => [...prev, ...formattedHistory]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = async (text = inputText) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      message: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.chat(text.trim());
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        message: response.response,
        type: response.type,
        data: response.data,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      if (response.quickReplies) {
        setQuickReplies(response.quickReplies);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        message: "I'm sorry, I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply);
  };

  const renderMessage = (message) => {
    const isUser = message.role === 'user';
    
    return (
      <View 
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.assistantMessageContainer
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
          </View>
        )}
        <Card style={[
          styles.messageCard,
          isUser ? styles.userMessage : styles.assistantMessage
        ]}>
          <Card.Content style={styles.messageContent}>
            <Text style={[
              styles.messageText,
              isUser && styles.userMessageText
            ]}>
              {message.message}
            </Text>
            <Text style={[
              styles.timestamp,
              isUser && styles.userTimestamp
            ]}>
              {new Date(message.timestamp).toLocaleTimeString('en-IN', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Chat Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAvatar}>
            <MaterialCommunityIcons name="robot" size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text style={styles.headerTitle}>FinPal AI</Text>
            <Text style={styles.headerSubtitle}>Your Financial Coach</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(renderMessage)}
        
        {loading && (
          <View style={styles.loadingContainer}>
            <View style={styles.avatarContainer}>
              <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
            </View>
            <Card style={styles.typingCard}>
              <Card.Content style={styles.typingContent}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.typingText}>FinPal is typing...</Text>
              </Card.Content>
            </Card>
          </View>
        )}
      </ScrollView>

      {/* Quick Replies */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.quickRepliesContainer}
        contentContainerStyle={styles.quickRepliesContent}
      >
        {quickReplies.map((reply, index) => (
          <Chip
            key={index}
            mode="outlined"
            onPress={() => handleQuickReply(reply)}
            style={styles.quickReplyChip}
            textStyle={styles.quickReplyText}
          >
            {reply}
          </Chip>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <RNTextInput
          style={styles.input}
          placeholder="Ask FinPal anything..."
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={() => sendMessage()}
          multiline
          maxLength={500}
        />
        <IconButton
          icon="send"
          size={24}
          iconColor="#fff"
          style={styles.sendButton}
          onPress={() => sendMessage()}
          disabled={!inputText.trim() || loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gray100,
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.gray500,
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
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  messageCard: {
    maxWidth: '75%',
    borderRadius: 16,
    ...shadows.small,
  },
  userMessage: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageContent: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.text,
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: theme.colors.gray500,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    ...shadows.small,
  },
  typingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  typingText: {
    fontSize: 14,
    color: theme.colors.gray500,
    marginLeft: spacing.sm,
  },
  quickRepliesContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
    maxHeight: 60,
  },
  quickRepliesContent: {
    padding: spacing.sm,
    alignItems: 'center',
  },
  quickReplyChip: {
    marginRight: spacing.sm,
    backgroundColor: 'transparent',
    borderColor: theme.colors.primary,
  },
  quickReplyText: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray200,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.gray100,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    margin: 0,
  },
});
