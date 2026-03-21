import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Delete, ChevronLeft } from 'lucide-react-native';

interface PINKeypadProps {
  pin: string;
  onPinChange: (pin: string) => void;
  maxLength?: number;
  themeColor?: string;
  isDarkTheme?: boolean;
  onBack?: () => void;
  showBack?: boolean;
}

export default function PINKeypad({ pin, onPinChange, maxLength = 4, themeColor = '#4CAF50', isDarkTheme = true, onBack, showBack = false }: PINKeypadProps) {
  const handleNumberPress = (num: string) => {
    if (pin.length < maxLength) {
      onPinChange(pin + num);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      onPinChange(pin.slice(0, -1));
    }
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [showBack ? 'back' : '', '0', 'delete'],
  ];

  const textColor = isDarkTheme ? '#fff' : '#000';
  const cardBg = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const borderColor = isDarkTheme ? '#333' : '#ddd';
  const disabledColor = isDarkTheme ? '#333' : '#999';

  return (
    <View style={styles.container}>
      <View style={styles.pinDisplay}>
        {[...Array(maxLength)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              { backgroundColor: cardBg, borderColor: borderColor },
              index < pin.length && { backgroundColor: themeColor, borderColor: themeColor },
            ]}
          />
        ))}
      </View>

      <View style={styles.keypad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((button, buttonIndex) => {
              if (button === '') {
                return <View key={buttonIndex} style={styles.button} />;
              }

              if (button === 'back') {
                return (
                  <TouchableOpacity
                    key={buttonIndex}
                    style={[styles.button, { backgroundColor: cardBg, borderColor: borderColor }]}
                    onPress={onBack}
                  >
                    <ChevronLeft
                      size={28}
                      color={textColor}
                    />
                  </TouchableOpacity>
                );
              }

              if (button === 'delete') {
                return (
                  <TouchableOpacity
                    key={buttonIndex}
                    style={[styles.button, { backgroundColor: cardBg, borderColor: borderColor }]}
                    onPress={handleDelete}
                    disabled={pin.length === 0}
                  >
                    <Delete
                      size={28}
                      color={pin.length === 0 ? disabledColor : textColor}
                    />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={buttonIndex}
                  style={[styles.button, { backgroundColor: cardBg, borderColor: borderColor }]}
                  onPress={() => handleNumberPress(button)}
                  disabled={pin.length >= maxLength}
                >
                  <Text style={[styles.buttonText, { color: textColor }]}>{button}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 400,
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  keypad: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '500',
  },
});
