import { Page, Text, Document, StyleSheet, View, Image } from '@react-pdf/renderer';

// Define necessary interfaces
interface Question {
  id?: string;
  question: string;
  type: 'text' | 'multichoice' | 'truefalse' | 'image';
  options?: string[];
  correct_answer?: string;
  is_active: boolean;
  image_url?: string;
}

interface Category {
  categoryName: string;
  questions: Question[];
}

interface QuestionPDFProps {
  title: string;
  categorizedQuestions: Category[];
  includeAnswers?: boolean;
}

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontSize: 15,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
  },
  categoryTitle: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontFamily: 'Helvetica-Bold',
  },
  questionContainer: {
    marginBottom: 5,
    breakInside: 'avoid',
  },
  questionText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  questionNumber: {
    marginRight: 4,
  },
  questionContent: {
    flex: 1,
  },
  questionParagraph: {
    marginBottom: 4,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  italic: {
    fontFamily: 'Helvetica-Oblique',
  },
  underline: {
    textDecoration: 'underline',
  },
  questionStatus: {
    fontSize: 10,
    marginBottom: 5,
    color: '#666666',
    fontFamily: 'Helvetica',
  },
  imageContainer: {
    marginBottom: 5,
    maxHeight: 400,
    alignItems: 'center',
  },
  questionImage: {
    objectFit: 'contain',
    maxWidth: '90%',
    maxHeight: 240,
  },
  options: {
    marginLeft: 20,
    marginTop: 3,
  },
  option: {
    marginBottom: 3,
    fontSize: 12,
    lineHeight: 1.3,
    fontFamily: 'Helvetica',
  },
  answerSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: '#999',
    paddingTop: 20,
  },
  answerTitle: {
    fontSize: 16,
    marginBottom: 15,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
  categoryAnswers: {
    marginTop: 15,
    marginBottom: 20,
    pageBreakInside: 'avoid',
  },
  categoryAnswerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  answerKey: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  answer: {
    width: '45%',
    marginBottom: 8,
    fontSize: 11,
    lineHeight: 1.4,
    fontFamily: 'Helvetica',
    padding: 2,
  },
  answerLine: {
    marginBottom: 8,
    marginTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    borderBottomStyle: 'dotted',
  },
});

// HTML parser for handling basic formatting tags
const parseHtml = (html: string): TextSegment[] => {
  const segments: TextSegment[] = [];
  let currentSegment: TextSegment = { text: '', bold: false, italic: false, underline: false };
  
  // Helper to push current segment
  const pushSegment = () => {
    if (currentSegment.text) {
      segments.push({ ...currentSegment });
      currentSegment = { text: '', bold: false, italic: false, underline: false };
    }
  };

  let i = 0;
  while (i < html.length) {
    if (html[i] === '<') {
      pushSegment();
      
      if (html.startsWith('<p>', i)) {
        if (segments.length > 0) {
          segments.push({ text: '\n' });
        }
        i += 3;
      } else if (html.startsWith('</p>', i)) {
        i += 4;
      } else if (html.startsWith('<strong>', i)) {
        currentSegment.bold = true;
        i += 8;
      } else if (html.startsWith('</strong>', i)) {
        currentSegment.bold = false;
        i += 9;
      } else if (html.startsWith('<em>', i)) {
        currentSegment.italic = true;
        i += 4;
      } else if (html.startsWith('</em>', i)) {
        currentSegment.italic = false;
        i += 5;
      } else if (html.startsWith('<u>', i)) {
        currentSegment.underline = true;
        i += 3;
      } else if (html.startsWith('</u>', i)) {
        currentSegment.underline = false;
        i += 4;
      } else {
        i++;
      }
    } else {
      currentSegment.text += html[i];
      i++;
    }
  }
  
  pushSegment();
  return segments;
};

const QuestionText = ({ html }: { html: string }) => {
  const segments = parseHtml(html);
  
  return (
    <Text>
      {segments.map((segment, index) => {
        const textStyles = {
          ...(segment.bold && styles.bold),
          ...(segment.italic && styles.italic),
          ...(segment.underline && styles.underline),
        };

        return (
          <Text key={index} style={textStyles}>
            {segment.text}
          </Text>
        );
      })}
    </Text>
  );
};

export const QuestionPDF = ({ 
  title, 
  categorizedQuestions,
  includeAnswers = true 
}: QuestionPDFProps) => (
  <Document>
    {/* Questions Page */}
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{title}</Text>

      {categorizedQuestions.map((category: Category, categoryIndex: number) => (
        <View key={categoryIndex}>
          <Text style={styles.categoryTitle}>{category.categoryName}</Text>
          {category.questions.map((question: Question, index: number) => (
            <View key={`${categoryIndex}-${index}`} style={styles.questionContainer} wrap={false}>
              {!question.is_active && (
                <Text style={styles.questionStatus}>(Inactive Question)</Text>
              )}
              <View style={styles.questionText}>
                <Text style={styles.questionNumber}>{index + 1}. </Text>
                <Text style={styles.questionContent}>
                  <QuestionText html={question.question} />
                </Text>
              </View>

              {question.type === 'image' && question.image_url && (
                <View style={styles.imageContainer}>
                  <Image
                    src={question.image_url}
                    style={styles.questionImage}
                    cache={false}
                  />
                </View>
              )}

              {question.type === 'text' && (
                <View style={styles.answerLine} />
              )}

              {question.type === 'multichoice' && question.options && (
                <View style={styles.options}>
                  {question.options.map((option: string, optIndex: number) => (
                    <Text key={optIndex} style={styles.option}>
                      {String.fromCharCode(97 + optIndex)}. {option}
                    </Text>
                  ))}
                </View>
              )}

              {question.type === 'truefalse' && (
                <View style={styles.options}>
                  <Text style={styles.option}>a. True</Text>
                  <Text style={styles.option}>b. False</Text>
                </View>
              )}

              {question.type === 'image' && (
                <View style={styles.answerLine} />
              )}
            </View>
          ))}
        </View>
      ))}
    </Page>

    {/* Answer Key Page */}
    {includeAnswers && categorizedQuestions.length > 0 && (
      <Page size="A4" style={styles.page}>
        <Text style={styles.answerTitle}>Answer Key</Text>
        {categorizedQuestions.map((category: Category, categoryIndex: number) => (
          <View key={`answers-${categoryIndex}`} style={styles.categoryAnswers}>
            <Text style={styles.categoryAnswerTitle}>{category.categoryName}</Text>
            <View style={styles.answerKey}>
              {category.questions.map((question: Question, index: number) => (
                <Text key={`${categoryIndex}-${index}`} style={styles.answer}>
                  {index + 1}. {question.correct_answer}
                  {!question.is_active ? ' (Inactive)' : ''}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </Page>
    )}
  </Document>
);
