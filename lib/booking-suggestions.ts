const suggestions: Record<string, string[]> = {
  "General Practice": [
    "Annual physical",
    "Cold or flu symptoms",
    "Blood pressure follow-up",
    "Prescription renewal",
    "Sick note",
  ],
  "Cardiology": [
    "Chest discomfort",
    "Palpitations",
    "Shortness of breath",
    "Blood pressure follow-up",
    "Cholesterol review",
  ],
  "Dermatology": [
    "Skin rash or irritation",
    "New or changing mole",
    "Acne treatment",
    "Eczema flare-up",
    "Skin check",
  ],
  "Paediatrics": [
    "Well-child visit",
    "Fever or cold symptoms",
    "Vaccination",
    "Growth concern",
    "Rash or skin concern",
  ],
  "Psychiatry": [
    "Anxiety",
    "Depression",
    "Medication review",
    "Sleep problems",
    "Mood changes",
  ],
};

export function getSuggestions(specialty: string): string[] {
  return suggestions[specialty] ?? [];
}
