export const computeDueDate = (fromDate: Date, dueDays: number): Date => {
  const dueDate = new Date(fromDate);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate;
};