// Weights sum to 100; presentation and attendance each take 5% from the final exam.
const assessments = [...Array.from({
  length: 4
}, (_, i) => ({
  title: `Quiz ${i + 1}`,
  category: 'quizzes',
  totalField: 'quizTotals',
  index: i,
  weight: 3.75
})), ...Array.from({
  length: 4
}, (_, i) => ({
  title: `Assignment ${i + 1}`,
  category: 'assignments',
  totalField: 'assignmentTotals',
  index: i,
  weight: 2.5
})), {
  title: 'Midterm',
  category: 'midterm',
  totalField: 'midtermTotal',
  index: null,
  weight: 25
}, {
  title: 'Final exam',
  category: 'final',
  totalField: 'finalTotal',
  index: null,
  weight: 40
}, {
  title: 'Presentation',
  category: 'presentation',
  totalField: 'presentationTotal',
  index: null,
  weight: 5
}, {
  title: 'Attendance',
  category: 'attendance',
  totalField: 'attendanceTotal',
  index: null,
  weight: 5
}];
function calculate(grade) {
  const score = assessments.reduce((sum, a) => {
    const mark = a.index === null ? grade[a.category] : grade[a.category]?.[a.index];
    const total = a.index === null ? grade[a.totalField] : grade[a.totalField]?.[a.index];
    return sum + (Number(total) > 0 ? Math.min(1, Math.max(0, Number(mark || 0) / Number(total))) * a.weight : 0);
  }, 0);
  const bands = [[85, 'A', 4], [80, 'A-', 3.7], [75, 'B+', 3.3], [70, 'B', 3], [65, 'B-', 2.7], [60, 'C+', 2.3], [55, 'C', 2], [50, 'D', 1.7], [0, 'F', 0]];
  const [, letterGrade, gpa] = bands.find(([min]) => score >= min);
  return {
    total: Math.round(score * 100) / 100,
    letterGrade,
    gpa
  };
}
module.exports = {
  assessments,
  calculate
};
