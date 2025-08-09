import {
  useEffect,
  useRef,
  MutableRefObject,
  useImperativeHandle,
  ForwardedRef
} from 'react';
import useKeyDownHandlers from './useKeyDownHandlers';

/**
 * Common logic for Modal, Overlay, etc.
 *
 * Pass in the `onClose` handler.
 *
 * Can optionally pass in a ref, in case the `onClose` function needs to use the ref.
 *
 * Calls the provided `onClose` function on:
 *  - Press Escape key.
 *  - Click outside the element.
 *
 * Returns a ref to attach to the outermost element of the modal.
 *
 * @param onClose - Function called when modal should close
 * @param passedRef - Optional ref to the modal element. If not provided, one is created internally.
 * @returns A ref to be attached to the modal DOM element
 */
export default function useModalClose<T extends HTMLElement = HTMLElement>(
  onClose: () => void,
  passedRef?: ForwardedRef<T>
): MutableRefObject<T | null> {
  const internalRef = useRef<T | null>(null);

  // Sync internalRef.current to passedRef (handles both object and function refs)
  useImperativeHandle<T | null, T | null>(
    passedRef,
    () => internalRef.current,
    [internalRef.current]
  );

  useEffect(() => {
    internalRef.current?.focus();

    function handleClick(e: MouseEvent) {
      if (
        internalRef.current &&
        !internalRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener('click', handleClick, false);
    return () => document.removeEventListener('click', handleClick, false);
  }, [onClose]);

  useKeyDownHandlers({ escape: onClose });

  return internalRef;
}
