const userInteractionEventName = 'embeddable-user-interaction';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dispatchEventUserInteraction = (detail: Record<string, any>) => {
  window.dispatchEvent(
    new CustomEvent(userInteractionEventName, {
      detail,
    }),
  );
};
