import React from 'react';
import { View, Image } from '@tarojs/components';

interface CardBackProps {
  style?: React.CSSProperties;
  className?: string;
  imageSrc?: string;
}

const DiamondPattern: React.FC = () => (
  <>
    <View style={{
      width: '80%',
      height: '80%',
      border: '2px solid rgba(255,255,255,0.15)',
      borderRadius: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <View style={{
        width: '50%',
        height: '50%',
        border: '2px solid rgba(255,255,255,0.1)',
        borderRadius: '2px',
        transform: 'rotate(45deg)',
      }} />
    </View>
  </>
);

export const CardBack: React.FC<CardBackProps> = ({ style, className = '', imageSrc }) => {
  return (
    <View className={className} style={{
      width: '100%',
      height: '100%',
      backgroundColor: '#2c3e50',
      borderRadius: '4px',
      border: '1px solid #1a252f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
      ...style,
    }}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          mode="aspectFill"
          style={{ width: '100%', height: '100%' }}
        />
      ) : (
        <DiamondPattern />
      )}
    </View>
  );
};

CardBack.displayName = 'CardBack';
