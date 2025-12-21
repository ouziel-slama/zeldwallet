import { useEffect, useMemo, useRef, useState } from 'react';
import type { NetworkType } from '../types';
import { ZeldWalletController, type ControllerSnapshot } from '../component/controller';
import type { LocaleKey, LocaleStrings } from '../component/i18n';
import type { ComponentState } from '../component/state';

export type UseZeldWalletControllerArgs = {
  lang?: string;
  network?: NetworkType;
  autoconnect?: boolean;
};

export type UseZeldWalletControllerResult = {
  state: ComponentState;
  locale: LocaleKey;
  strings: LocaleStrings;
  network: NetworkType;
  showPasswordWarning: boolean;
  showBackupWarning: boolean;
  readyWithSecurity: boolean;
  connect: (password?: string) => Promise<void>;
  setLocale: (lang?: string) => void;
  showSetPasswordForm: () => void;
  hideSetPasswordForm: () => void;
  showBackupForm: () => void;
  hideBackupForm: () => void;
  clearBackupResult: () => void;
  handleSetPassword: (password: string, confirmPassword: string) => Promise<void>;
  handleExportBackup: (walletPassword: string) => Promise<void>;
};

export function useZeldWalletController({
  lang = 'en',
  network = 'mainnet',
  autoconnect = true,
}: UseZeldWalletControllerArgs): UseZeldWalletControllerResult {
  const controllerRef = useRef<ZeldWalletController>();

  if (!controllerRef.current) {
    controllerRef.current = new ZeldWalletController({ lang, network, autoconnect });
  }

  const controller = controllerRef.current;
  const [snapshot, setSnapshot] = useState<ControllerSnapshot>(controller.getSnapshot());

  useEffect(() => {
    const unsubscribe = controller.subscribe(setSnapshot);
    controller.maybeAutoconnect();
    return () => {
      unsubscribe();
      controller.detach();
    };
  }, [controller]);

  useEffect(() => {
    controller.setLocale(lang);
  }, [controller, lang]);

  useEffect(() => {
    controller.setNetwork(network);
  }, [controller, network]);

  useEffect(() => {
    controller.setAutoconnect(autoconnect ?? true);
    controller.maybeAutoconnect();
  }, [controller, autoconnect]);

  return useMemo(
    () => ({
      state: snapshot.state,
      locale: snapshot.locale,
      strings: snapshot.strings,
      network: snapshot.network,
      showPasswordWarning: snapshot.showPasswordWarning,
      showBackupWarning: snapshot.showBackupWarning,
      readyWithSecurity: snapshot.readyWithSecurity,
      connect: (password?: string) => controller.connect(password),
      setLocale: (next?: string) => controller.setLocale(next),
      showSetPasswordForm: () => controller.showSetPasswordForm(),
      hideSetPasswordForm: () => controller.hideSetPasswordForm(),
      showBackupForm: () => controller.showBackupForm(),
      hideBackupForm: () => controller.hideBackupForm(),
      clearBackupResult: () => controller.clearBackupResult(),
      handleSetPassword: (password: string, confirmPassword: string) =>
        controller.handleSetPassword(password, confirmPassword),
      handleExportBackup: (walletPassword: string) => controller.handleExportBackup(walletPassword),
    }),
    [controller, snapshot]
  );
}

