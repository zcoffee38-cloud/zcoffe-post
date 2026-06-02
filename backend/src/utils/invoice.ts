export const generateInvoiceNumber = (): string => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.getTime().toString().slice(-6);
  return `ZC-${date}-${time}`;
};

export const generateQueueNumber = (lastNumber: number): number => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  // Reset to 1 if it's a new day, otherwise increment
  return lastNumber + 1;
};
