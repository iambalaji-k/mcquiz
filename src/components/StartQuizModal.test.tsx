import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartQuizModal } from './StartQuizModal';
import type { Quiz } from '../types/quiz';

const mockQuiz: Quiz = {
  title: 'Sample Test Quiz',
  description: 'A test description',
  version: '1.0',
  questions: [
    {
      id: 1,
      category: 'Math',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      answer: 1,
      explanation: '2 + 2 = 4',
    },
    {
      id: 2,
      category: 'Science',
      question: 'What is H2O?',
      options: ['Water', 'Air', 'Fire', 'Earth'],
      answer: 0,
      explanation: 'H2O is water',
    },
    {
      id: 3,
      category: 'Math',
      question: 'What is 5 * 5?',
      options: ['10', '20', '25', '30'],
      answer: 2,
      explanation: '5 * 5 = 25',
    },
    {
      id: 4,
      category: 'Science',
      question: 'What is the closest planet to the sun?',
      options: ['Venus', 'Mercury', 'Mars', 'Jupiter'],
      answer: 1,
      explanation: 'Mercury is closest',
    },
    {
      id: 5,
      category: 'History',
      question: 'What year did WW2 end?',
      options: ['1943', '1944', '1945', '1946'],
      answer: 2,
      explanation: 'WW2 ended in 1945',
    },
  ],
};

describe('StartQuizModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <StartQuizModal
        isOpen={false}
        quiz={mockQuiz}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correctly when isOpen is true without throwing hook errors', () => {
    render(
      <StartQuizModal
        isOpen={true}
        quiz={mockQuiz}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    expect(screen.getByText('Sample Test Quiz')).toBeInTheDocument();
    expect(screen.getByText('Practice Setup')).toBeInTheDocument();
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
    expect(screen.getByText('Math')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('allows decreasing and increasing question count', () => {
    render(
      <StartQuizModal
        isOpen={true}
        quiz={mockQuiz}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    );

    const decreaseBtn = screen.getByLabelText('Decrease question count');
    const increaseBtn = screen.getByLabelText('Increase question count');

    fireEvent.click(decreaseBtn);
    expect(screen.getByText('4 of 5')).toBeInTheDocument();

    fireEvent.click(increaseBtn);
    expect(screen.getByText('5 of 5')).toBeInTheDocument();
  });

  it('calls onConfirm with prepared quiz when Confirm & Start is clicked', () => {
    const onConfirmMock = vi.fn();
    render(
      <StartQuizModal
        isOpen={true}
        quiz={mockQuiz}
        onClose={vi.fn()}
        onConfirm={onConfirmMock}
      />
    );

    const startBtn = screen.getByRole('button', { name: /Confirm & Start/i });
    fireEvent.click(startBtn);

    expect(onConfirmMock).toHaveBeenCalledTimes(1);
    const preparedQuiz = onConfirmMock.mock.calls[0][0];
    expect(preparedQuiz.questions.length).toBe(5);
    expect(preparedQuiz.title).toBe('Sample Test Quiz');
  });

  it('calls onClose when Cancel or Close is clicked', () => {
    const onCloseMock = vi.fn();
    render(
      <StartQuizModal
        isOpen={true}
        quiz={mockQuiz}
        onClose={onCloseMock}
        onConfirm={vi.fn()}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
