export const getScoreColor = (score: number) => {
  if (score <= 40) return 'bg-[#78350f]'; // Brown
  if (score <= 69) return 'bg-tertiary'; // Orange
  return 'bg-primary'; // Green
};
