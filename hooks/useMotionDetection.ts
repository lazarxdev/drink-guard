import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

interface MotionDetectionResult {
  isMonitoring: boolean;
  motionDetected: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  resetAlert: () => void;
}

export function useMotionDetection(sensitivity: number = 40): MotionDetectionResult {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [motionDetected, setMotionDetected] = useState(false);
  const deviceMotionSubscription = useRef<any>(null);
  const baselineRef = useRef<{
    accel: { x: number; y: number; z: number };
    rotation: { alpha: number; beta: number; gamma: number };
  } | null>(null);
  const calibrationSamplesRef = useRef<{
    accel: { x: number; y: number; z: number }[];
    rotation: { alpha: number; beta: number; gamma: number }[];
  }>({ accel: [], rotation: [] });

  const normalizedSensitivity = sensitivity / 10;
  const ACCEL_THRESHOLD = 0.05 + (10 - normalizedSensitivity) * 0.02;
  const ROTATION_THRESHOLD = 0.02 + (10 - normalizedSensitivity) * 0.01;
  const CALIBRATION_SAMPLES = 15;

  const startMonitoring = () => {
    setMotionDetected(false);
    calibrationSamplesRef.current = { accel: [], rotation: [] };
    baselineRef.current = null;

    if (Platform.OS === 'web') {
      console.log('Motion detection not available on web, using mock mode');
      setIsMonitoring(true);
      return;
    }

    DeviceMotion.setUpdateInterval(100);

    deviceMotionSubscription.current = DeviceMotion.addListener(data => {
      if (!data.acceleration || !data.rotation) return;

      if (calibrationSamplesRef.current.accel.length < CALIBRATION_SAMPLES) {
        calibrationSamplesRef.current.accel.push(data.acceleration);
        calibrationSamplesRef.current.rotation.push(data.rotation);

        if (calibrationSamplesRef.current.accel.length === CALIBRATION_SAMPLES) {
          const accelAvg = {
            x: calibrationSamplesRef.current.accel.reduce((sum, d) => sum + d.x, 0) / CALIBRATION_SAMPLES,
            y: calibrationSamplesRef.current.accel.reduce((sum, d) => sum + d.y, 0) / CALIBRATION_SAMPLES,
            z: calibrationSamplesRef.current.accel.reduce((sum, d) => sum + d.z, 0) / CALIBRATION_SAMPLES,
          };
          const rotationAvg = {
            alpha: calibrationSamplesRef.current.rotation.reduce((sum, d) => sum + (d.alpha || 0), 0) / CALIBRATION_SAMPLES,
            beta: calibrationSamplesRef.current.rotation.reduce((sum, d) => sum + (d.beta || 0), 0) / CALIBRATION_SAMPLES,
            gamma: calibrationSamplesRef.current.rotation.reduce((sum, d) => sum + (d.gamma || 0), 0) / CALIBRATION_SAMPLES,
          };
          baselineRef.current = { accel: accelAvg, rotation: rotationAvg };
        }
        return;
      }

      if (baselineRef.current && !motionDetected) {
        const { accel, rotation } = baselineRef.current;

        const accelDiff = Math.sqrt(
          Math.pow(data.acceleration.x - accel.x, 2) +
          Math.pow(data.acceleration.y - accel.y, 2) +
          Math.pow(data.acceleration.z - accel.z, 2)
        );

        const alphaDiff = Math.abs((data.rotation.alpha || 0) - rotation.alpha);
        const betaDiff = Math.abs((data.rotation.beta || 0) - rotation.beta);
        const gammaDiff = Math.abs((data.rotation.gamma || 0) - rotation.gamma);
        const maxRotationDiff = Math.max(alphaDiff, betaDiff, gammaDiff);

        if (accelDiff > ACCEL_THRESHOLD || maxRotationDiff > ROTATION_THRESHOLD) {
          console.log('Motion detected! Accel:', accelDiff.toFixed(3), 'Rotation:', maxRotationDiff.toFixed(3));
          setMotionDetected(true);
        }
      }
    });

    setIsMonitoring(true);
  };

  const stopMonitoring = () => {
    deviceMotionSubscription.current?.remove();
    deviceMotionSubscription.current = null;
    setIsMonitoring(false);
    setMotionDetected(false);
    baselineRef.current = null;
    calibrationSamplesRef.current = { accel: [], rotation: [] };
  };

  const resetAlert = () => {
    setMotionDetected(false);
  };

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, []);

  return {
    isMonitoring,
    motionDetected,
    startMonitoring,
    stopMonitoring,
    resetAlert,
  };
}
