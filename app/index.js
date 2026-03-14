// App.js - Simple Calculator
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';

export default function App() {
  const [displayValue, setDisplayValue] = useState('0');
  const [previousValue, setPreviousValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForNewNumber, setWaitingForNewNumber] = useState(false);

  // Handle number button press
  const handleNumberPress = (num) => {
    if (waitingForNewNumber) {
      setDisplayValue(String(num));
      setWaitingForNewNumber(false);
    } else {
      setDisplayValue(displayValue === '0' ? String(num) : displayValue + num);
    }
  };

  // Handle operator button press
  const handleOperatorPress = (op) => {
    if (operator && !waitingForNewNumber) {
      calculate();
    }

    setPreviousValue(parseFloat(displayValue));
    setOperator(op);
    setWaitingForNewNumber(true);
  };

  // Calculate result
  const calculate = () => {
    if (!operator || previousValue === null) return;

    const current = parseFloat(displayValue);
    let result = 0;

    switch (operator) {
      case '+':
        result = previousValue + current;
        break;
      case '-':
        result = previousValue - current;
        break;
      case '×':
        result = previousValue * current;
        break;
      case '÷':
        result = previousValue / current;
        break;
      default:
        return;
    }

    setDisplayValue(String(result));
    setPreviousValue(result);
    setOperator(null);
  };

  // Clear all
  const handleClear = () => {
    setDisplayValue('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForNewNumber(false);
  };

  // Handle decimal point
  const handleDecimal = () => {
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
    }
  };

  // Handle percentage
  const handlePercentage = () => {
    const value = parseFloat(displayValue) / 100;
    setDisplayValue(String(value));
  };

  // Handle plus/minus
  const handlePlusMinus = () => {
    const value = parseFloat(displayValue) * -1;
    setDisplayValue(String(value));
  };

  // Button component
  const CalculatorButton = ({ title, onPress, type = 'number', size = 'normal' }) => {
    const getButtonStyle = () => {
      let buttonStyle = [styles.button];

      if (type === 'operator') {
        buttonStyle.push(styles.operatorButton);
      } else if (type === 'function') {
        buttonStyle.push(styles.functionButton);
      }

      if (size === 'double') {
        buttonStyle.push(styles.doubleButton);
      }

      return buttonStyle;
    };

    const getTextStyle = () => {
      let textStyle = [styles.buttonText];

      if (type === 'operator') {
        textStyle.push(styles.operatorText);
      } else if (type === 'function') {
        textStyle.push(styles.functionText);
      }

      return textStyle;
    };

    return (
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={getTextStyle()}>{title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202020" />

      {/* Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayText}>{displayValue}</Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          <CalculatorButton title="C" onPress={handleClear} type="function" />
          <CalculatorButton title="+/-" onPress={handlePlusMinus} type="function" />
          <CalculatorButton title="%" onPress={handlePercentage} type="function" />
          <CalculatorButton title="÷" onPress={() => handleOperatorPress('÷')} type="operator" />
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          <CalculatorButton title="7" onPress={() => handleNumberPress(7)} />
          <CalculatorButton title="8" onPress={() => handleNumberPress(8)} />
          <CalculatorButton title="9" onPress={() => handleNumberPress(9)} />
          <CalculatorButton title="×" onPress={() => handleOperatorPress('×')} type="operator" />
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          <CalculatorButton title="4" onPress={() => handleNumberPress(4)} />
          <CalculatorButton title="5" onPress={() => handleNumberPress(5)} />
          <CalculatorButton title="6" onPress={() => handleNumberPress(6)} />
          <CalculatorButton title="-" onPress={() => handleOperatorPress('-')} type="operator" />
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          <CalculatorButton title="1" onPress={() => handleNumberPress(1)} />
          <CalculatorButton title="2" onPress={() => handleNumberPress(2)} />
          <CalculatorButton title="3" onPress={() => handleNumberPress(3)} />
          <CalculatorButton title="+" onPress={() => handleOperatorPress('+')} type="operator" />
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          <CalculatorButton title="0" onPress={() => handleNumberPress(0)} size="double" />
          <CalculatorButton title="." onPress={handleDecimal} />
          <CalculatorButton title="=" onPress={calculate} type="operator" />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202020',
  },
  displayContainer: {
    flex: 2,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 20,
    backgroundColor: '#2c2c2c',
  },
  displayText: {
    fontSize: 70,
    color: '#fff',
    fontWeight: '300',
  },
  buttonsContainer: {
    flex: 3,
    padding: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 10,
  },
  button: {
    flex: 1,
    margin: 5,
    borderRadius: 35,
    backgroundColor: '#3c3c3c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  doubleButton: {
    flex: 2,
    alignItems: 'flex-start',
    paddingLeft: 30,
  },
  buttonText: {
    fontSize: 30,
    color: '#fff',
    fontWeight: '400',
  },
  operatorButton: {
    backgroundColor: '#ff9f0a',
  },
  operatorText: {
    fontSize: 35,
    color: '#fff',
  },
  functionButton: {
    backgroundColor: '#a5a5a5',
  },
  functionText: {
    fontSize: 30,
    color: '#000',
  },
});