import pandas as pd

# Read the CSV files
df_answers = pd.read_csv('AnswerOptions_04_11.csv')
df_questions = pd.read_csv('QuestionsGenerated_04_11.csv')

print("="*80)
print("DATASET STATISTICS")
print("="*80)

# Basic counts
print("\n📊 BASIC COUNTS")
print(f"Total questions: {len(df_questions)}")
print(f"Total answer options: {len(df_answers)}")

# Questions by number of answer options
print("\n📝 QUESTIONS BY NUMBER OF ANSWER OPTIONS")
answers_per_question = df_answers.groupby('ID').size()
print(answers_per_question.value_counts().sort_index().to_string())
print(f"\nAverage answers per question: {answers_per_question.mean():.2f}")

# Questions by IsPublished status
print("\n📢 QUESTIONS BY PUBLISHED STATUS")
print(df_questions['IsPublished'].value_counts().to_string())

# Questions by Deleted status
print("\n🗑️  QUESTIONS BY DELETED STATUS")
df_questions['IsDeleted'] = df_questions['Deleted'].notna()
print(df_questions['IsDeleted'].value_counts().to_string())

# Questions by Language
print("\n🌍 QUESTIONS BY LANGUAGE")
print(df_questions['Language'].value_counts().to_string())

# Questions by Type
print("\n📋 QUESTIONS BY TYPE")
print(df_questions['Type'].value_counts().to_string())

# Questions by Difficulty
print("\n⚡ QUESTIONS BY DIFFICULTY")
print(df_questions['Difficulty'].value_counts().to_string())

# Questions with previous version
print("\n🔄 QUESTIONS BY PREVIOUS VERSION STATUS")
df_questions['HasPreviousVersion'] = df_questions['PreviousVersionId'].notna()
print(df_questions['HasPreviousVersion'].value_counts().to_string())

print("\n" + "="*80)

# Export statistics to CSV
print("\n💾 Exporting statistics to CSV...")

statistics = []

# Basic counts
statistics.append({"Metric": "Total Questions", "Value": len(df_questions), "Category": "Basic Counts"})
statistics.append({"Metric": "Total Answer Options", "Value": len(df_answers), "Category": "Basic Counts"})
statistics.append({"Metric": "Average Answers per Question", "Value": f"{answers_per_question.mean():.2f}", "Category": "Basic Counts"})

# Answer options distribution
for num_answers, count in answers_per_question.value_counts().sort_index().items():
    statistics.append({"Metric": f"Questions with {num_answers} answers", "Value": count, "Category": "Answer Distribution"})

# Published status
for status, count in df_questions['IsPublished'].value_counts().items():
    statistics.append({"Metric": f"Published: {status}", "Value": count, "Category": "Published Status"})

# Deleted status
for status, count in df_questions['IsDeleted'].value_counts().items():
    statistics.append({"Metric": f"Deleted: {status}", "Value": count, "Category": "Deleted Status"})

# Language
for lang, count in df_questions['Language'].value_counts().items():
    statistics.append({"Metric": f"Language: {lang}", "Value": count, "Category": "Language"})

# Type
for qtype, count in df_questions['Type'].value_counts().items():
    statistics.append({"Metric": f"Type: {qtype}", "Value": count, "Category": "Question Type"})

# Difficulty
for difficulty, count in df_questions['Difficulty'].value_counts().items():
    statistics.append({"Metric": f"Difficulty: {difficulty}", "Value": count, "Category": "Difficulty"})

# Previous version status
for status, count in df_questions['HasPreviousVersion'].value_counts().items():
    statistics.append({"Metric": f"Has Previous Version: {status}", "Value": count, "Category": "Version Status"})

# Create DataFrame and export
df_stats = pd.DataFrame(statistics)
df_stats.to_csv('dataset_statistics.csv', index=False)

print("Statistics exported to dataset_statistics.csv")
print("\n" + "="*80)
