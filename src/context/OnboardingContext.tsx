import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type OnboardingStep = 'welcome' | 'sms_setup' | 'permissions' | 'completed';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  currentStep: OnboardingStep;
  setCurrentStep: (step: OnboardingStep) => void;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_STORAGE_KEY = '@chillar_onboarding';

interface StoredOnboardingState {
  isComplete: boolean;
  currentStep: OnboardingStep;
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const stored = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (stored) {
        const parsed: StoredOnboardingState = JSON.parse(stored);
        setIsComplete(parsed.isComplete);
        setCurrentStep(parsed.currentStep);
      }
    } catch (error) {
      console.error('Failed to load onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveOnboardingState = async (state: StoredOnboardingState) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save onboarding state:', error);
    }
  };

  const handleSetCurrentStep = (step: OnboardingStep) => {
    setCurrentStep(step);
    saveOnboardingState({ isComplete, currentStep: step });
  };

  const completeOnboarding = async () => {
    setIsComplete(true);
    setCurrentStep('completed');
    await saveOnboardingState({ isComplete: true, currentStep: 'completed' });
  };

  const resetOnboarding = async () => {
    setIsComplete(false);
    setCurrentStep('welcome');
    await saveOnboardingState({ isComplete: false, currentStep: 'welcome' });
  };

  return (
    <OnboardingContext.Provider
      value={{
        isOnboardingComplete: isComplete,
        currentStep,
        setCurrentStep: handleSetCurrentStep,
        completeOnboarding,
        resetOnboarding,
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
