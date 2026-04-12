# F1 Score and Understanding Model Performance

When evaluating a classification model, Accuracy (general precision) is not always sufficient.

It shows how many times we were right, but doesn't distinguish between types of errors.

For example, if most days it doesn't rain, a model that always predicts "no rain" could achieve high accuracy, but in practice it won't be useful.

<img src="/ml-lesson-2-summary/assets/image-27.png" alt="image-27.png" width="474" height="256" />

To better understand the model's performance, we focus on positive cases.

**Precision**

Precision measures how accurate the model's positive predictions are.

Meaning:

When the model predicted "it will rain tomorrow," how many times did it actually happen.

<img src="/ml-lesson-2-summary/assets/image-28.png" alt="image-28.png" width="202" height="59" />

**Recall**

Recall measures how well the model succeeds in identifying all positive cases.

Meaning:

Out of all the days it actually rained, how many did the model successfully identify.

<img src="/ml-lesson-2-summary/assets/image-29.png" alt="image-29.png" width="168" height="53" />

**The Balance Between Them**

There's a trade-off between the two metrics:

**High Precision** → when the model says "it will rain" it's usually right, but might miss days when it actually did rain

**High Recall** → the model identifies most rainy days, but sometimes errs and alerts about rain even when it didn't rain

**F1 Score**

The F1 score combines Precision and Recall into one balanced metric:

<img src="/ml-lesson-2-summary/assets/image-30.png" alt="image-30.png" width="232" height="56" />

**F1 provides a balanced picture between prediction precision and the ability to identify all important cases**

