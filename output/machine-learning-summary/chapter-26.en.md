# Beyond Accuracy: Precision, Recall, and F1 Score

<img src="../assets/image-28.png" alt="image-28.png" width="710" height="274" />

Overall accuracy tells how many predictions were correct out of all cases
But it doesn't tell us what errors the model makes

To truly understand the model's performance, we focus on positive cases

Precision asks a simple question: when I said "positive", how many times was I right?

TP / (TP + FP)

Recall asks a different question: out of all positive cases that exist, how many did I manage to find?
TP / (TP + FN)

Between precision and recall there is a balance
You can be very precise but miss cases, and you can find many cases but make more errors

The F1 Score combines both and gives one metric that balances between prediction correctness and case coverage

F1 = 2 · (Precision · Recall) / (Precision + Recall)
