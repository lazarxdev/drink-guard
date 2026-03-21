import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Smartphone, ShieldAlert, Volume2, Settings as SettingsIcon, CircleCheck as CheckCircle, ChevronRight, X } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
  themeColor: string;
}

const steps = [
  {
    icon: Smartphone,
    title: 'Welcome to DrinkGuard',
    description: 'Monitor your drink and get alerted if someone tries to tamper with it.',
    highlight: 'Your personal drink safety companion',
  },
  {
    icon: ShieldAlert,
    title: 'How It Works',
    description: 'Place your phone on or near your drink. Any motion detected will trigger an alert.',
    highlight: 'Motion detection keeps you informed',
  },
  {
    icon: Volume2,
    title: 'Grace Period Protection',
    description: 'When motion is detected, you have a few seconds to enter your PIN before the alarm sounds. Optionally set up a volume button pattern for faster access.',
    highlight: 'Time to respond when you pick up your phone',
  },
  {
    icon: SettingsIcon,
    title: 'Customize Settings',
    description: 'Adjust sensitivity, choose alarm sounds, enable incognito mode, and pick your theme color.',
    highlight: 'Make it your own',
  },
  {
    icon: CheckCircle,
    title: 'Ready to Start',
    description: 'Tap "Start Monitoring" to begin protecting your drink. You can always access settings anytime.',
    highlight: 'Stay safe out there!',
  },
];

export default function OnboardingModal({ visible, onComplete, themeColor }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <BlurView intensity={80} style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <X size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.content}>
            <View style={[styles.iconContainer, { backgroundColor: themeColor + '20' }]}>
              <Icon size={60} color={themeColor} />
            </View>

            <Text style={styles.title}>{step.title}</Text>
            <Text style={styles.description}>{step.description}</Text>
            <Text style={[styles.highlight, { color: themeColor }]}>{step.highlight}</Text>

            <View style={styles.dotsContainer}>
              {steps.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && { backgroundColor: themeColor },
                    index !== currentStep && { backgroundColor: '#333' },
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: themeColor }]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
              <ChevronRight size={20} color="#fff" />
            </TouchableOpacity>

            {!isLastStep && (
              <TouchableOpacity onPress={handleSkip}>
                <Text style={styles.skipText}>Skip Tutorial</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  skipButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  highlight: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 32,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    width: '100%',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  skipText: {
    color: '#999',
    fontSize: 14,
    marginTop: 16,
  },
});
