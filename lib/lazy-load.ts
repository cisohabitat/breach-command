// Share an in-flight load and keep a successful module, but let a failed
// download be tried again when the connection is available.
export function retryableLoad<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | null = null;
  return () => {
    pending ??= Promise.resolve().then(load).catch(error => {
      pending = null;
      throw error;
    });
    return pending;
  };
}
