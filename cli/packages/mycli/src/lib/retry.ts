
// TODO: put these into config if people are really affected
// Added to some retry code found online... in future, could redo this with RxJS or some async util.
// https://gitlab.com/snippets/1775781

// TODO: redo this function as a state machine so that when retries are exceeded, we can see what the final status was
export async function retry<T>(
  fn: () => Promise<T>,
  predicate: (arg: T) => boolean = (result: T) => (result as any) === true,
  retriesLeft: number,
  interval: number ,
  exponential: boolean = false
): Promise<T> {
  try {
    const val = await fn();
    if (!predicate(val)) {
      throw new Error("this is hacky but will force a retry");
    }

    return val;
  } catch (error) {
    if (retriesLeft) {
      await new Promise(r => setTimeout(r, interval));
      return retry(
        fn,
        predicate,
        retriesLeft - 1,
        exponential ? interval * 2 : interval,
        exponential
      );
    } else throw new Error(`Max retries reached for function ${fn.name}`);
  }
}
