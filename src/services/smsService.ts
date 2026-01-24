import { Platform, PermissionsAndroid, NativeModules, NativeEventEmitter, Linking, Alert } from 'react-native';
import { SmsPattern, PatternDefinition, ExpenseSuggestion } from '../models/types';
import { getEnabledSmsPatterns, createExpenseSuggestion } from './database';
import { notificationService } from './notificationService';
import { generateUUID } from '../utils/uuid';

// SMS Message interface
export interface SmsMessage {
  id: string;
  address: string; // Sender ID
  body: string;
  date: number; // Timestamp in milliseconds
  read: boolean;
}

// SMS Permission status
export type SmsPermissionStatus = 'granted' | 'denied' | 'never_ask_again' | 'unavailable';

// Get the native SMS Receiver module (typed in types.d.ts)
const SmsReceiver = NativeModules.SmsReceiver;

/**
 * SMS Service
 * 
 * Handles SMS permission requests, reading SMS messages, and
 * listening for new incoming SMS on Android.
 * 
 * Note: iOS does not support reading SMS due to platform restrictions.
 * On iOS, users can manually paste SMS text for pattern onboarding.
 * 
 * For background SMS detection, this service uses the SmsReceiver native module
 * which registers a BroadcastReceiver to listen for incoming SMS.
 */
class SmsService {
  private isListening: boolean = false;
  private patterns: SmsPattern[] = [];
  private eventEmitter: NativeEventEmitter | null = null;
  private subscription: any = null;
  private hasNativeModule: boolean = !!SmsReceiver;

  constructor() {
    // Log native module availability
    console.log('SmsService initialized, native module available:', this.hasNativeModule);
  }

  /**
   * Check if SMS features are available on this platform
   */
  isAvailable(): boolean {
    return Platform.OS === 'android';
  }

  /**
   * Check if native SMS module is available (development build)
   */
  hasNativeSmsSupport(): boolean {
    return this.hasNativeModule;
  }

  /**
   * Check if running in development mode (Expo Go)
   */
  isInExpoGo(): boolean {
    // Check if running in Expo Go by checking for native modules
    return !this.hasNativeModule;
  }

  /**
   * Check current SMS permission status
   */
  async checkPermission(): Promise<SmsPermissionStatus> {
    if (Platform.OS !== 'android') {
      return 'unavailable';
    }

    try {
      const readGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.READ_SMS
      );
      
      if (readGranted) {
        return 'granted';
      }
      
      return 'denied';
    } catch (error) {
      console.error('Failed to check SMS permission:', error);
      return 'denied';
    }
  }

  /**
   * Request SMS read permission with proper explanation
   */
  async requestPermission(): Promise<SmsPermissionStatus> {
    if (Platform.OS !== 'android') {
      return 'unavailable';
    }

    try {
      // Request both READ_SMS and RECEIVE_SMS permissions together
      const results = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
      ]);

      const readResult = results[PermissionsAndroid.PERMISSIONS.READ_SMS];
      const receiveResult = results[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS];

      // Check if at least READ_SMS was granted
      if (readResult === PermissionsAndroid.RESULTS.GRANTED) {
        return 'granted';
      }
      
      if (readResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return 'never_ask_again';
      }
      
      return 'denied';
    } catch (error) {
      console.error('Failed to request SMS permission:', error);
      return 'denied';
    }
  }

  /**
   * Show dialog to open settings when permission is permanently denied
   */
  async openSettings(): Promise<void> {
    Alert.alert(
      'SMS Permission Required',
      'Please enable SMS permission in Settings to automatically detect expenses from bank messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Open Settings', 
          onPress: () => Linking.openSettings() 
        },
      ]
    );
  }

  /**
   * Request RECEIVE_SMS permission for listening to incoming messages
   */
  async requestReceiveSmsPermission(): Promise<SmsPermissionStatus> {
    if (Platform.OS !== 'android') {
      return 'unavailable';
    }

    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: 'SMS Notification Permission',
          message:
            'BudgetOne needs permission to detect new SMS messages in real-time ' +
            'to notify you about expenses as they happen.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );

      switch (result) {
        case PermissionsAndroid.RESULTS.GRANTED:
          return 'granted';
        case PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN:
          return 'never_ask_again';
        default:
          return 'denied';
      }
    } catch (error) {
      console.error('Failed to request RECEIVE_SMS permission:', error);
      return 'denied';
    }
  }

  /**
   * Get recent SMS messages
   * In Expo Go, this returns mock data. In a development build with
   * native SMS module, this reads actual SMS messages.
   */
  async getRecentMessages(limit: number = 50): Promise<SmsMessage[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    const hasPermission = await this.checkPermission();
    if (hasPermission !== 'granted') {
      return [];
    }

    // Check if native SMS module is available (SmsReceiver from our plugin)
    if (SmsReceiver) {
      try {
        const messages = await SmsReceiver.getRecentMessages(limit);
        return messages.map((msg: any) => ({
          id: msg._id?.toString() || generateUUID(),
          address: msg.address || '',
          body: msg.body || '',
          date: parseInt(msg.date) || Date.now(),
          read: msg.read === '1' || msg.read === true,
        }));
      } catch (error) {
        console.error('Failed to read SMS via native module:', error);
        return this.getMockMessages();
      }
    }

    // Fallback to mock data in Expo Go
    console.log('SMS reading not available in Expo Go. Using mock data.');
    return this.getMockMessages();
  }

  /**
   * Mock messages for development/testing
   */
  private getMockMessages(): SmsMessage[] {
    const now = Date.now();
    return [
      {
        id: '1',
        address: 'HDFCBK',
        body: 'Rs.1,250.00 debited from a/c **1234 on 24-01-26. Info: UPI/SWIGGY. Avl bal: Rs.15,000.00',
        date: now - 3600000,
        read: true,
      },
      {
        id: '2',
        address: 'ICICIB',
        body: 'Dear Customer, INR 500.00 has been debited from your account **5678 for Amazon Pay. Available balance is INR 8,500.00',
        date: now - 7200000,
        read: true,
      },
      {
        id: '3',
        address: 'SBIINB',
        body: 'SBI: Your A/c XXX789 debited by Rs.2,000.00 on 24Jan26 at ATM. Avl Bal Rs.25,000.00.',
        date: now - 86400000,
        read: true,
      },
      {
        id: '4',
        address: 'AXISBK',
        body: 'Transaction of Rs.3,500.00 on your Axis Bank Card ending 4321 was successful at AMAZON.',
        date: now - 172800000,
        read: true,
      },
      {
        id: '5',
        address: 'KOTAKB',
        body: 'Kotak Bank: Rs 750.00 paid to UBER via UPI from A/c XX6789 on 22-01-26. UPI Ref: 123456789',
        date: now - 259200000,
        read: true,
      },
    ];
  }

  /**
   * Start listening for incoming SMS messages
   * 
   * Uses the SmsReceiver native module with Android BroadcastReceiver
   * for real-time background SMS detection.
   */
  async startListening(): Promise<void> {
    if (this.isListening || Platform.OS !== 'android') {
      return;
    }

    // Load enabled patterns
    await this.refreshPatterns();

    // Check if we have patterns configured
    if (this.patterns.length === 0) {
      console.log('No SMS patterns configured, skipping listener start');
      return;
    }

    // Check if native SMS module is available for real-time listening
    if (SmsReceiver) {
      try {
        // Set up event emitter for native SMS events
        this.eventEmitter = new NativeEventEmitter(SmsReceiver as any);
        this.subscription = this.eventEmitter.addListener(
          'onSmsReceived',
          async (sms: { address: string; body: string; date: number }) => {
            console.log('SMS received from native module:', sms.address);
            const smsMessage: SmsMessage = {
              id: generateUUID(),
              address: sms.address,
              body: sms.body,
              date: sms.date || Date.now(),
              read: false,
            };
            await this.processIncomingSms(smsMessage);
          }
        );
        
        // Start the native receiver
        await SmsReceiver.startListening();
        this.isListening = true;
        console.log('✅ Native SMS listening started with', this.patterns.length, 'patterns');
      } catch (error) {
        console.error('Failed to start native SMS listener:', error);
      }
    } else {
      console.log('⚠️ Native SMS receiver not available (running in Expo Go?)');
      console.log('Background SMS detection requires a development build.');
      this.isListening = true; // Mark as "listening" even without native support
    }

    console.log('SMS service initialized');
  }

  /**
   * Check for new SMS messages manually (for when background isn't available)
   * Call this periodically or when app comes to foreground
   */
  async checkForNewSms(): Promise<ExpenseSuggestion[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    await this.refreshPatterns();
    
    if (this.patterns.length === 0) {
      return [];
    }

    const hasPermission = await this.checkPermission();
    if (hasPermission !== 'granted') {
      return [];
    }

    const suggestions: ExpenseSuggestion[] = [];
    
    try {
      // Get recent messages (last 10)
      const messages = await this.getRecentMessages(10);
      
      // Process each message
      for (const sms of messages) {
        const result = await this.processIncomingSms(sms);
        if (result) {
          suggestions.push(result);
        }
      }
    } catch (error) {
      console.error('Error checking for new SMS:', error);
    }

    return suggestions;
  }

  /**
   * Get the current listening status
   */
  getListeningStatus(): { isListening: boolean; hasNativeSupport: boolean; patternCount: number } {
    return {
      isListening: this.isListening,
      hasNativeSupport: this.hasNativeModule,
      patternCount: this.patterns.length,
    };
  }

  /**
   * Stop listening for incoming SMS messages
   */
  async stopListening(): Promise<void> {
    if (!this.isListening) {
      return;
    }

    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }

    if (SmsReceiver) {
      try {
        await SmsReceiver.stopListening();
      } catch (error) {
        console.error('Failed to stop native SMS listener:', error);
      }
    }

    this.isListening = false;
    console.log('SMS listening stopped');
  }

  /**
   * Refresh the list of enabled patterns from database
   */
  async refreshPatterns(): Promise<void> {
    try {
      this.patterns = await getEnabledSmsPatterns();
    } catch (error) {
      console.error('Failed to refresh SMS patterns:', error);
    }
  }

  /**
   * Process an incoming SMS against enabled patterns
   */
  async processIncomingSms(sms: SmsMessage): Promise<ExpenseSuggestion | null> {
    const senderId = sms.address;
    const body = sms.body;

    for (const pattern of this.patterns) {
      // Check if sender matches
      const senderRegex = new RegExp(pattern.pattern.senderRegex, 'i');
      if (!senderRegex.test(senderId)) {
        continue;
      }

      // Try to extract amount
      const extractedData = this.extractFromPattern(body, pattern.pattern);
      if (extractedData.amount === null) {
        continue;
      }

      // Create expense suggestion
      const suggestion: ExpenseSuggestion = {
        id: generateUUID(),
        amount: extractedData.amount,
        dateTime: extractedData.dateTime || new Date(sms.date).toISOString(),
        merchant: extractedData.merchant,
        originalSmsText: body,
        smsSenderId: senderId,
        patternId: pattern.id,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };

      // Save to database
      await createExpenseSuggestion(suggestion);

      // Send notification
      await notificationService.sendExpenseNotification(suggestion);

      return suggestion;
    }

    return null;
  }

  /**
   * Extract expense data from SMS using pattern
   */
  private extractFromPattern(
    smsBody: string,
    pattern: PatternDefinition
  ): { amount: number | null; dateTime: string | null; merchant: string | null } {
    let amount: number | null = null;
    let dateTime: string | null = null;
    let merchant: string | null = null;

    try {
      // Extract amount
      if (pattern.amountRegex) {
        const amountRegex = new RegExp(pattern.amountRegex, 'i');
        const amountMatch = smsBody.match(amountRegex);
        if (amountMatch && amountMatch[pattern.amountGroup]) {
          const amountStr = amountMatch[pattern.amountGroup].replace(/,/g, '');
          amount = parseFloat(amountStr);
          if (isNaN(amount)) {
            amount = null;
          }
        }
      }

      // Extract date/time
      if (pattern.dateTimeRegex && pattern.dateTimeGroup) {
        const dateRegex = new RegExp(pattern.dateTimeRegex, 'i');
        const dateMatch = smsBody.match(dateRegex);
        if (dateMatch && dateMatch[pattern.dateTimeGroup]) {
          dateTime = dateMatch[pattern.dateTimeGroup];
        }
      }

      // Extract merchant
      if (pattern.merchantRegex && pattern.merchantGroup) {
        const merchantRegex = new RegExp(pattern.merchantRegex, 'i');
        const merchantMatch = smsBody.match(merchantRegex);
        if (merchantMatch && merchantMatch[pattern.merchantGroup]) {
          merchant = merchantMatch[pattern.merchantGroup];
        }
      }
    } catch (error) {
      console.error('Pattern extraction failed:', error);
    }

    return { amount, dateTime, merchant };
  }

  /**
   * Manually test if an SMS matches any enabled pattern
   * Useful for debugging and onboarding flow
   */
  async testAgainstPatterns(sms: SmsMessage): Promise<{
    matched: boolean;
    patternId?: string;
    amount?: number;
    dateTime?: string;
    merchant?: string;
  }> {
    for (const pattern of this.patterns) {
      const senderRegex = new RegExp(pattern.pattern.senderRegex, 'i');
      if (!senderRegex.test(sms.address)) {
        continue;
      }

      const extracted = this.extractFromPattern(sms.body, pattern.pattern);
      if (extracted.amount !== null) {
        return {
          matched: true,
          patternId: pattern.id,
          amount: extracted.amount,
          dateTime: extracted.dateTime || undefined,
          merchant: extracted.merchant || undefined,
        };
      }
    }

    return { matched: false };
  }
}

// Export singleton instance
export const smsService = new SmsService();

// Export class for testing
export { SmsService };
