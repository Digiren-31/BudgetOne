/// <reference types="react" />

declare module '*.png' {
  const value: any;
  export = value;
}

declare module '*.jpg' {
  const value: any;
  export = value;
}

declare module '*.svg' {
  import React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

// Extend the native event emitter for SMS handling
declare module 'react-native' {
  interface NativeModulesStatic {
    SmsReader?: {
      getRecentMessages(count: number): Promise<any[]>;
    };
    SmsReceiver?: {
      startListening(): Promise<boolean>;
      stopListening(): Promise<boolean>;
      getRecentMessages(limit: number): Promise<Array<{
        _id: string;
        address: string;
        body: string;
        date: string;
        read: string;
      }>>;
      addListener(eventName: string): void;
      removeListeners(count: number): void;
    };
    NotificationListener?: {
      isEnabled(): Promise<boolean>;
      openSettings(): Promise<boolean>;
      startListening(): Promise<boolean>;
      stopListening(): Promise<boolean>;
      addListener(eventName: string): void;
      removeListeners(count: number): void;
    };
  }
}

// Type augmentation for navigation
import { RootStackParamList } from './src/navigation/AppNavigator';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
