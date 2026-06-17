'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warn';
  isTestEnv: boolean;
}

export default function Toast({ message, type, isTestEnv }: ToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success': return <FaCheckCircle />;
      case 'error':
      case 'warn':
      default: return <FaExclamationTriangle />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success': return styles.success;
      case 'error': return styles.error;
      case 'warn': return styles.warn;
      default: return '';
    }
  };

  return (
    <motion.div
      id="toast"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={isTestEnv ? { duration: 0 } : { duration: 0.2 }}
      className={`${styles.toast} ${getTypeClass()}`}
    >
      {getIcon()}
      <span>{message}</span>
    </motion.div>
  );
}
