import {
  createElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type DetailedHTMLProps,
  type HTMLAttributes,
  type Ref,
} from 'react';
import { defineZeldWalletUI, ZeldWalletUI } from '../component/ZeldWalletUI';
import type { UseZeldWalletControllerArgs } from './useZeldWalletController';

declare global {
  // Allow usage of the custom element in TSX without casting to any.
  namespace JSX {
    interface IntrinsicElements {
      'zeld-wallet-ui': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export type ZeldWalletCardProps = UseZeldWalletControllerArgs & {
  className?: string;
  variant?: 'light' | 'dark';
  /**
   * Optionally override the tag name when defining the custom element.
   */
  tagName?: string;
};

export type ZeldWalletCardRef = {
  connect: (password?: string) => Promise<void>;
};

export const ZeldWalletCard = forwardRef<ZeldWalletCardRef, ZeldWalletCardProps>(function ZeldWalletCard(
  { className, variant = 'dark', tagName, lang = 'en', network = 'mainnet', autoconnect = true },
  ref
) {
  const elementRef = useRef<ZeldWalletUI | null>(null);
  const tag = useMemo(() => defineZeldWalletUI(tagName), [tagName]);

  useImperativeHandle(
    ref,
    () => ({
      connect: (password?: string) => elementRef.current?.connect(password) ?? Promise.resolve(),
    }),
    []
  );

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    el.lang = lang;
  }, [lang]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    el.network = network;
  }, [network]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    el.autoconnect = autoconnect ?? true;
  }, [autoconnect]);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;
    el.variant = variant;
  }, [variant]);

  const classNames = useMemo(() => ['zeldwallet-react-wrapper', className].filter(Boolean).join(' '), [className]);

  return createElement(tag, {
    ref: elementRef as unknown as Ref<HTMLElement>,
    lang,
    network,
    autoconnect: autoconnect ? 'true' : 'false',
    className: classNames,
    variant,
  });
});

