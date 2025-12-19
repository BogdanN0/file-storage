import { useState, useCallback } from "react";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean;
  resolver?: (value: boolean) => void;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: "",
    message: "",
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        ...options,
        resolver: resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolver?.(true);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolver]);

  const handleCancel = useCallback(() => {
    state.resolver?.(false);
    setState((prev) => ({ ...prev, isOpen: false }));
  }, [state.resolver]);

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleCancel,
  };
}
