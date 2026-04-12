# Confusion Matrix

When a model performs classification, it's not enough to know how accurate it is in general. It's also important to understand what kind of mistakes it makes.

A Confusion Matrix is a table that breaks down the model's predictions into four states, by comparing the prediction to the actual value.

Let's say we're trying to predict whether it will rain tomorrow:

<img src="/ml-lesson-2-summary/assets/image-25.png" alt="image-25.png" width="286" height="242" />

- **True Positive (TP)** - The model predicted rain, and it actually did rain
- **False Positive (FP)** - The model predicted rain, but it didn't actually rain
- **False Negative (FN)** - The model predicted no rain, but it actually did rain
- **True Negative (TN)** - The model predicted no rain, and it actually didn't rain

The table allows us to see not only how accurate the model is, **but also how it makes mistakes.**

**Accuracy (General Precision)**

One of the basic metrics is Accuracy, and here is the formula:

<img src="/ml-lesson-2-summary/assets/image-26.png" alt="image-26.png" width="306" height="74" />

This is the ratio between the number of correct predictions (TP + TN) and the total cases.

**But it's important to understand:** Accuracy alone is not always sufficient. Accuracy measures how often we were right, but not what mistakes we made.

⚠️ Why Accuracy Can Be Misleading

Let's say that on most days it doesn't rain.

A model that always predicts "no rain" could achieve high accuracy, but in practice it's not useful because it never identifies rain.

