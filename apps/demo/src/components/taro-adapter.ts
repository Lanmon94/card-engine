import React, { forwardRef } from 'react';

type TaroProps = {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  onClick?: (e: any) => void;
  onLongPress?: (e: any) => void;
  [key: string]: any;
};

export const View = forwardRef<HTMLDivElement, TaroProps>((props, ref) => {
  const { className, style, onClick, onLongPress, children, ...rest } = props;
  return React.createElement('div', { ref, className, style, onClick, children, ...rest });
});
View.displayName = 'View';

export const Text = forwardRef<HTMLSpanElement, TaroProps>((props, ref) => {
  const { className, style, onClick, children, ...rest } = props;
  return React.createElement('span', { ref, className, style, onClick, children, ...rest });
});
Text.displayName = 'Text';

export const Image = forwardRef<HTMLImageElement, TaroProps>((props, ref) => {
  const { className, style, src, ...rest } = props;
  return React.createElement('img', { ref, className, style, src, ...rest });
});
Image.displayName = 'Image';

export const ScrollView = View;
export const Swiper = View;
export const SwiperItem = View;
