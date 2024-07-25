import { useEffect, useRef, useCallback } from 'react';
import axios from 'axios';

const defaultTokenKey = Symbol('default');

export function useCancelToken() {
  const requestCanceler = useRef(new Map());

  // Cancel all tokens on unmount
  useEffect(
    () => () =>
      requestCanceler.current.forEach((cancelToken) =>
        cancelToken.cancel('Cancel on unmount')
      ),
    []
  );

  // Request a new token. Cancels previously requested token with the same key
  const getNewToken = useCallback((key: string | symbol = defaultTokenKey) => {
    requestCanceler.current
      .get(key)
      ?.cancel(`New token requested for ${key.toString()}`);
    requestCanceler.current.set(key, axios.CancelToken.source());
    return requestCanceler.current.get(key);
  }, []);

  return getNewToken;
}

export const isRequestCancel = axios.isCancel;
