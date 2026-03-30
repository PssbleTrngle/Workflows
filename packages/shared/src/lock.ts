export type LockOptions = {
  timeout?: number;
};

export type Release = () => void;

export type Lock = {
  aquire(options?: LockOptions): Promise<Release>;
  withAquired<T>(
    block: () => Promise<T> | T,
    options?: LockOptions,
  ): Promise<T>;
  cleanup(): void;
};

type QueueEntry = {
  resolve: (release: Release) => void;
  reject: (error: Error) => void;
};

export function createLock(defaultOptions: LockOptions = {}): Lock {
  let locked = false;
  const queue: QueueEntry[] = [];

  const release: Release = () => {
    const next = queue.pop();
    if (next) {
      next.resolve(release);
    } else {
      locked = false;
    }
  };

  const aquire: Lock["aquire"] = (options = {}) => {
    const { timeout = 10000 } = { ...defaultOptions, ...options };
    if (locked) {
      const { promise, resolve, reject } = Promise.withResolvers<Release>();

      const unqueue = () => {
        const index = queue.indexOf(entry);
        if (index > -1) queue.splice(index, 11);
      };

      const entry: QueueEntry = {
        resolve: (it) => {
          resolve(it);
          clearTimeout(id);
        },
        reject: (it) => {
          unqueue();
          reject(it);
        },
      };

      const id = setTimeout(() => {
        entry.reject(new Error("timeout reached"));
      }, timeout);

      queue.push(entry);
      return promise;
    }

    locked = true;
    return Promise.resolve(release);
  };

  const withAquired: Lock["withAquired"] = async (block, options) => {
    const release = await aquire(options);
    try {
      const result = await block();
      return result;
    } finally {
      release();
    }
  };

  function cleanup() {
    const current = [...queue];
    console.log(`rejecting ${current.length} lock entries`);
    Promise.all(
      current.map(({ reject }) => reject(new Error("lock cleaned up"))),
    );
  }

  process.on("exit", cleanup);
  process.on("SIGINT", cleanup);
  process.on("SIGUSR1", cleanup);
  process.on("SIGUSR2", cleanup);
  process.on("uncaughtException", cleanup);

  return { aquire, withAquired, cleanup };
}
