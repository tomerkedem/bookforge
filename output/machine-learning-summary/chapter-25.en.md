# Confusion Matrix

<img src="../assets/image-27.png" alt="image-27.png" width="625" height="341" />

When a model performs classification, it's not enough to know if it's "accurate" in general.
You need to understand where it's wrong and what kind of errors it makes.

The Confusion Matrix is a table that breaks down the model's predictions into four clear states, according to a comparison between the prediction and the true value.

When the model correctly predicts that a case is positive, this is called True Positive (TP).

When the model predicts positive but in practice it's negative, this is an error called False Positive (FP).

When the model misses a positive case and predicts negative, this is an error type called False Negative (FN).

And when it correctly predicts that a case is negative, this is called True Negative (TN).

This table allows you to see not only how good the model is, but in what way it errs.

One of the simple metrics derived from the table is Accuracy.

This is the ratio between all correct predictions and all cases, meaning how many times the model was right out of all the predictions it made.

But it's important to understand: Accuracy alone is not always enough.

In cases where there is an imbalance between the groups, a model can achieve high accuracy and still not be useful.

The true power of the Confusion Matrix is that it gives a complete picture:

How well the model identifies correctly, how much it misses, and what kind of errors it makes.
