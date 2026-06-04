const FIRST = [
  'Aiden', 'Priya', 'Omar', 'Lina', 'Marcus', 'Sofia', 'Kenji', 'Amara', 'Diego', 'Nora',
  'Ethan', 'Mei', 'Raj', 'Chloe', 'Ivan', 'Zara', 'Noah', 'Elena', 'Kai', 'Mila',
  'Leo', 'Anya', 'Felix', 'Sara', 'Jonas', 'Ines', 'Theo', 'Maya', 'Luca', 'Rina',
];

const LAST = [
  'Chen', 'Patel', 'Nguyen', 'Kim', 'Brooks', 'Rossi', 'Tanaka', 'Okafor', 'Silva', 'Andersen',
  'Reed', 'Zhang', 'Khan', 'Morales', 'Petrov', 'Ali', 'Fischer', 'Dubois', 'Sato', 'Walsh',
  'Hughes', 'Bauer', 'Costa', 'Nielsen', 'Park', 'Garcia', 'Ibrahim', 'Schmidt', 'Lopez', 'Roy',
];

/** Picks a random full name (new on each call). */
export function randomRevieweeName(): string {
  const first = FIRST[Math.floor(Math.random() * FIRST.length)];
  const last = LAST[Math.floor(Math.random() * LAST.length)];
  return `${first} ${last}`;
}
